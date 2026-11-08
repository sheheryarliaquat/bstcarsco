/**
 * Export everything from Firebase into MySQL import files.
 *
 * Copies, read-only (nothing in Firebase is changed):
 *   - every Firestore collection (and subcollection) -> one MySQL table each
 *   - every Firebase Auth login                        -> `auth_users`
 *   - a list of every Firebase Storage file            -> `storage_files`
 *     (and, with --download-files, the files themselves to a local folder)
 *
 * The output is a set of .sql files for GoDaddy's "Import SQL" button
 * (Hosted Database). Import them in name order. Every statement is an
 * upsert, so the export can be re-run and re-imported at any time to
 * bring MySQL up to date — e.g. once now, and a final time just before
 * the site switches over.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run export:mysql -- [options]
 *
 * Credentials: same as scripts/create-admin.ts — either
 * GOOGLE_APPLICATION_CREDENTIALS pointing to a service account JSON file,
 * or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.
 * (Firebase console -> Project settings -> Service accounts -> Generate new private key.)
 *
 * Options:
 *   --out <dir>              output folder (default ./firebase-export)
 *   --max-mb <n>             split output into files of about n MB (default 20)
 *   --only <a,b,c>           export only these collections
 *   --skip <a,b,c>           skip these collections
 *   --no-subcollections      don't look for subcollections (faster)
 *   --no-auth                skip Firebase Auth users
 *   --no-storage             skip Firebase Storage file list
 *   --download-files <dir>   also download every Storage file into <dir>
 *   --bucket <name>          Storage bucket (default from env, else bstcarsco.firebasestorage.app)
 *   --prune                  in the last file, delete MySQL rows for documents that
 *                            no longer exist in Firebase (use for the final sync)
 *
 * The output contains customer data and password hashes: keep it private,
 * don't commit it (firebase-export/ is git-ignored), and delete it after importing.
 */

import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldPath,
  type CollectionReference,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  AUTH_USERS_TABLE_SQL,
  KNOWN_COLLECTIONS,
  STORAGE_FILES_TABLE_SQL,
  createTableSql,
  documentRow,
  pruneSql,
  tableNameFor,
  toMysqlDatetime,
  toPlain,
  upsertSql,
} from "./mysql-migration/sql";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const opts = {
    out: "./firebase-export",
    maxMb: 20,
    only: [] as string[],
    skip: [] as string[],
    subcollections: true,
    auth: true,
    storage: true,
    downloadFiles: "",
    bucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "bstcarsco.firebasestorage.app",
    prune: false,
  };
  const list = (v = "") => v.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`Missing value for ${a}`);
      return v;
    };
    if (a === "--out") opts.out = next();
    else if (a === "--max-mb") opts.maxMb = Number(next());
    else if (a === "--only") opts.only = list(next());
    else if (a === "--skip") opts.skip = list(next());
    else if (a === "--no-subcollections") opts.subcollections = false;
    else if (a === "--no-auth") opts.auth = false;
    else if (a === "--no-storage") opts.storage = false;
    else if (a === "--download-files") opts.downloadFiles = next();
    else if (a === "--bucket") opts.bucket = next();
    else if (a === "--prune") opts.prune = true;
    else throw new Error(`Unknown option: ${a}`);
  }
  if (!(opts.maxMb > 0)) throw new Error("--max-mb must be a positive number");
  return opts;
}

// ---------------------------------------------------------------------------
// Output: numbered .sql files of roughly --max-mb each
// ---------------------------------------------------------------------------

class SqlFiles {
  private part = 0;
  private bytes = 0;
  private fd: number | null = null;
  readonly files: string[] = [];

  constructor(private dir: string, private maxBytes: number, private runId: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private open() {
    this.close();
    this.part++;
    const file = path.join(this.dir, `bstcars-mysql-${String(this.part).padStart(3, "0")}.sql`);
    this.fd = fs.openSync(file, "w");
    this.files.push(file);
    const header =
      `-- bstcars.co Firebase -> MySQL export, run ${this.runId}, part ${this.part}\n` +
      `-- Import the files in name order.\n` +
      `SET NAMES utf8mb4;\n\n`;
    fs.writeSync(this.fd, header);
    this.bytes = Buffer.byteLength(header);
  }

  write(sql: string) {
    if (!sql) return;
    const size = Buffer.byteLength(sql);
    if (this.fd === null || (this.bytes + size > this.maxBytes && this.bytes > 200)) this.open();
    fs.writeSync(this.fd!, sql + "\n");
    this.bytes += size + 1;
  }

  close() {
    if (this.fd !== null) fs.closeSync(this.fd);
    this.fd = null;
  }
}

/** Groups rows into multi-row upserts of at most ~100 rows / ~1 MB. */
class Batcher {
  private rows: Record<string, unknown>[] = [];
  private size = 0;
  count = 0;

  constructor(private table: string, private out: SqlFiles) {}

  add(row: Record<string, unknown>) {
    const rowSize = JSON.stringify(row).length;
    if (this.rows.length >= 100 || (this.size + rowSize > 1_000_000 && this.rows.length > 0)) {
      this.flush();
    }
    this.rows.push(row);
    this.size += rowSize;
    this.count++;
  }

  flush() {
    this.out.write(upsertSql(this.table, this.rows));
    this.rows = [];
    this.size = 0;
  }
}

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------

function initFirebase(): App {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  // Uses GOOGLE_APPLICATION_CREDENTIALS / application-default credentials.
  return initializeApp();
}

const createdTables = new Set<string>();
const exportedTables = new Set<string>();
const counts: Record<string, number> = {};

function ensureTable(out: SqlFiles, table: string, subcollection: boolean) {
  if (createdTables.has(table)) return;
  out.write(createTableSql(table, { subcollection }));
  createdTables.add(table);
}

async function exportCollection(
  col: CollectionReference,
  out: SqlFiles,
  runId: string,
  withSubcollections: boolean,
  batchers: Map<string, Batcher>
) {
  const isSub = col.path.includes("/");
  const table = tableNameFor(col.path);
  ensureTable(out, table, isSub);
  exportedTables.add(table);
  let batcher = batchers.get(table);
  if (!batcher) {
    batcher = new Batcher(table, out);
    batchers.set(table, batcher);
  }

  let last: QueryDocumentSnapshot | undefined;
  for (;;) {
    let q = col.orderBy(FieldPath.documentId()).limit(500);
    if (last) q = q.startAfter(last);
    const page = await q.get();
    if (page.empty) break;

    for (const doc of page.docs) {
      const parentPath = isSub ? col.parent!.path : undefined;
      batcher.add(documentRow(doc.id, doc.data(), runId, parentPath));
    }

    if (withSubcollections) {
      const subs = await Promise.all(page.docs.map((d) => d.ref.listCollections()));
      for (const subList of subs) {
        for (const sub of subList) {
          await exportCollection(sub, out, runId, withSubcollections, batchers);
        }
      }
    }

    last = page.docs[page.docs.length - 1];
    process.stdout.write(`\r  ${col.path}: ${batcher.count} documents`);
    if (page.size < 500) break;
  }
  if (!isSub) process.stdout.write(`\r  ${col.path}: ${batcher.count} documents\n`);
}

async function exportAuthUsers(app: App, out: SqlFiles, runId: string) {
  out.write(AUTH_USERS_TABLE_SQL);
  const batcher = new Batcher("auth_users", out);
  let pageToken: string | undefined;
  do {
    const res = await getAuth(app).listUsers(1000, pageToken);
    for (const u of res.users) {
      const data = toPlain(u.toJSON()) as Record<string, unknown>;
      batcher.add({
        uid: u.uid,
        email: u.email ?? null,
        email_verified: u.emailVerified ? 1 : 0,
        phone_number: u.phoneNumber ?? null,
        display_name: u.displayName ?? null,
        photo_url: u.photoURL ?? null,
        disabled: u.disabled ? 1 : 0,
        provider_ids: u.providerData.map((p) => p.providerId).join(",") || null,
        password_hash: u.passwordHash ?? null,
        password_salt: u.passwordSalt ?? null,
        custom_claims: u.customClaims ? JSON.stringify(u.customClaims) : null,
        created_at: toMysqlDatetime(u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null),
        last_sign_in_at: toMysqlDatetime(
          u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null
        ),
        data: JSON.stringify(data),
        synced_at: runId,
      });
    }
    pageToken = res.pageToken;
    process.stdout.write(`\r  logins: ${batcher.count}`);
  } while (pageToken);
  batcher.flush();
  process.stdout.write(`\r  logins: ${batcher.count}\n`);
  counts["auth_users"] = batcher.count;
  exportedTables.add("auth_users");
}

async function exportStorage(
  app: App,
  bucketName: string,
  out: SqlFiles,
  runId: string,
  downloadDir: string
) {
  out.write(STORAGE_FILES_TABLE_SQL);
  const batcher = new Batcher("storage_files", out);
  const bucket = getStorage(app).bucket(bucketName);
  const root = downloadDir ? path.resolve(downloadDir) : "";

  type PageQuery = { autoPaginate: false; maxResults: number; pageToken?: string };
  let query: PageQuery | null = { autoPaginate: false, maxResults: 1000 };
  while (query) {
    const res = await bucket.getFiles(query);
    const files = res[0];
    const nextQuery = res[1] as PageQuery | null | undefined;
    for (const file of files) {
      const m = file.metadata;
      let downloadedTo: string | null = null;
      if (root) {
        const dest = path.resolve(root, file.name);
        if (dest.startsWith(root + path.sep) && !file.name.endsWith("/")) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          await file.download({ destination: dest });
          downloadedTo = path.relative(root, dest);
        }
      }
      batcher.add({
        path: file.name,
        size_bytes: m.size !== undefined ? Number(m.size) : null,
        content_type: m.contentType ?? null,
        md5_hash: m.md5Hash ?? null,
        created_at: toMysqlDatetime(m.timeCreated ?? null),
        updated_at: toMysqlDatetime(m.updated ?? null),
        metadata: JSON.stringify(toPlain(m)),
        downloaded_to: downloadedTo,
        synced_at: runId,
      });
      process.stdout.write(`\r  storage files: ${batcher.count}`);
    }
    query = nextQuery ?? null;
  }
  batcher.flush();
  process.stdout.write(`\r  storage files: ${batcher.count}\n`);
  counts["storage_files"] = batcher.count;
  exportedTables.add("storage_files");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const runId = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const out = new SqlFiles(opts.out, opts.maxMb * 1024 * 1024, runId);
  const app = initFirebase();
  const db = getFirestore(app);

  console.log(`Exporting Firebase project to ${path.resolve(opts.out)} (run ${runId})`);

  // Tables for every collection the site uses, even empty ones, so the
  // later code switch finds them all in MySQL.
  for (const name of KNOWN_COLLECTIONS) ensureTable(out, name, false);

  const wanted = (name: string) =>
    (opts.only.length === 0 || opts.only.includes(name)) && !opts.skip.includes(name);

  console.log("Firestore collections:");
  const batchers = new Map<string, Batcher>();
  const collections = await db.listCollections();
  for (const col of collections) {
    if (!wanted(col.id)) {
      console.log(`  ${col.id}: skipped`);
      continue;
    }
    await exportCollection(col, out, runId, opts.subcollections, batchers);
  }
  for (const [table, b] of batchers) {
    b.flush();
    counts[table] = b.count;
  }

  const partial = opts.only.length > 0 || opts.skip.length > 0;
  if (opts.auth && !partial) {
    console.log("Firebase Auth:");
    await exportAuthUsers(app, out, runId);
  }
  if (opts.storage && !partial) {
    console.log(`Firebase Storage (${opts.bucket}):`);
    await exportStorage(app, opts.bucket, out, runId, opts.downloadFiles);
  }

  if (opts.prune) {
    out.write("-- Remove rows for documents that were deleted in Firebase since an earlier export.");
    for (const table of exportedTables) out.write(pruneSql(table, runId));
  }
  out.close();

  console.log("\nDone. Rows per table:");
  for (const [table, n] of Object.entries(counts).sort()) console.log(`  ${table.padEnd(32)} ${n}`);
  console.log("\nImport these files with GoDaddy -> Settings -> Hosted Database -> Import SQL, in this order:");
  for (const f of out.files) console.log(`  ${f}`);
  console.log("\nThe files contain customer data and password hashes: delete them after importing.");
}

main().catch((err) => {
  console.error("\nExport failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
