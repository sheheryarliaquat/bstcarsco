// Firestore-style document storage on MySQL (server only).
//
// Each collection is a table (see src/lib/mysql/schema.ts) holding the
// document as JSON in `data`. Queries use the same operators the site used
// with Firestore; equality filters on strings/booleans are pushed into SQL
// to narrow the rows read, and every condition is then checked exactly in
// JavaScript, so results match Firestore's rules for types and arrays.

import crypto from "node:crypto";
import type { Db } from "@/lib/mysql/db";
import {
  APP_TABLES_SQL,
  createTableSql,
  toMysqlDatetime,
} from "@/lib/mysql/schema";

export type DocData = Record<string, unknown>;
export type Doc = DocData & { id: string };

export interface QueryCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface QueryOptions {
  orderBy?: string;
  direction?: "asc" | "desc";
  limit?: number;
  /** Continue after the document with this id (from a previous page). */
  startAfterId?: string;
}

export class StoreError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const COLLECTION_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const ID_RE = /^[^/]{1,255}$/;
const RESERVED = new Set(["auth_users", "sessions", "password_resets", "files", "storage_files"]);

export function assertCollection(name: unknown): string {
  if (typeof name !== "string" || !COLLECTION_RE.test(name) || RESERVED.has(name)) {
    throw new StoreError(400, "invalid-argument", "Invalid collection name.");
  }
  return name;
}

export function assertId(id: unknown): string {
  if (typeof id !== "string" || !ID_RE.test(id)) {
    throw new StoreError(400, "invalid-argument", "Invalid document id.");
  }
  return id;
}

/** 20-character id like Firestore's auto ids. */
export function newId(length = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

// Remembered per request (per connection), not for the life of the server:
// GoDaddy's "Import SQL" drops every table, and the site must recreate them
// on the next request instead of failing until it is restarted.
// CREATE TABLE IF NOT EXISTS is cheap when the table is already there.
const readyTables = new WeakMap<Db, Set<string>>();

function readySet(db: Db): Set<string> {
  let set = readyTables.get(db);
  if (!set) {
    set = new Set();
    readyTables.set(db, set);
  }
  return set;
}

export async function ensureAppTables(db: Db): Promise<void> {
  const ready = readySet(db);
  if (ready.has("__app__")) return;
  for (const sql of APP_TABLES_SQL) await db.query(sql);
  // users is written inside sign-up transactions; create it up front because
  // CREATE TABLE inside a transaction would commit it early in MySQL.
  await ensureCollection(db, "users");
  ready.add("__app__");
}

export async function ensureCollection(db: Db, name: string): Promise<void> {
  const ready = readySet(db);
  if (ready.has(name)) return;
  await db.query(createTableSql(name));
  ready.add(name);
}

function parseData(value: unknown): DocData {
  if (value == null) return {};
  if (typeof value === "string") return JSON.parse(value) as DocData;
  if (Buffer.isBuffer(value)) return JSON.parse(value.toString("utf8")) as DocData;
  return value as DocData;
}

/** Make data safe to store as JSON: Dates -> ISO strings, drop undefined. */
export function normalize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => (v === undefined ? null : normalize(v)));
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "object") {
    const out: DocData = {};
    for (const [k, v] of Object.entries(value as DocData)) {
      const n = normalize(v);
      if (n !== undefined) out[k] = n;
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getDoc(db: Db, collection: string, id: string, forUpdate = false): Promise<Doc | null> {
  await ensureCollection(db, collection);
  const [rows] = await db.query(
    `SELECT \`data\` FROM \`${collection}\` WHERE \`id\` = ?${forUpdate ? " FOR UPDATE" : ""}`,
    [id]
  );
  const row = (rows as { data: unknown }[])[0];
  if (!row) return null;
  return { ...parseData(row.data), id };
}

export function getField(doc: DocData, path: string): unknown {
  let cur: unknown = doc;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object" || Array.isArray(cur)) return undefined;
    cur = (cur as DocData)[part];
  }
  return cur;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const ak = Object.keys(a as DocData);
    const bk = Object.keys(b as DocData);
    return ak.length === bk.length && ak.every((k) => deepEqual((a as DocData)[k], (b as DocData)[k]));
  }
  return false;
}

function comparable(a: unknown, b: unknown): boolean {
  return (typeof a === "number" && typeof b === "number") || (typeof a === "string" && typeof b === "string");
}

export function matches(doc: DocData, c: QueryCondition): boolean {
  const v = getField(doc, c.field);
  const target = c.value;
  switch (c.operator) {
    case "==":
      return v !== undefined && deepEqual(v, target);
    case "!=":
      return v !== undefined && v !== null && !deepEqual(v, target);
    case "<":
      return comparable(v, target) && (v as number) < (target as number);
    case "<=":
      return comparable(v, target) && (v as number) <= (target as number);
    case ">":
      return comparable(v, target) && (v as number) > (target as number);
    case ">=":
      return comparable(v, target) && (v as number) >= (target as number);
    case "array-contains":
      return Array.isArray(v) && v.some((x) => deepEqual(x, target));
    case "array-contains-any":
      return Array.isArray(v) && Array.isArray(target) && v.some((x) => target.some((t) => deepEqual(x, t)));
    case "in":
      return v !== undefined && Array.isArray(target) && target.some((t) => deepEqual(v, t));
    case "not-in":
      return v !== undefined && v !== null && Array.isArray(target) && !target.some((t) => deepEqual(v, t));
    default:
      throw new StoreError(400, "invalid-argument", `Unsupported query operator: ${c.operator}`);
  }
}

function jsonPath(field: string): string {
  return "$." + field.split(".").map((p) => '"' + p.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(".");
}

function compareValues(a: unknown, b: unknown): number {
  // Firestore-like ordering: missing/null first, then booleans, numbers, strings.
  const rank = (v: unknown) =>
    v === undefined || v === null ? 0 : typeof v === "boolean" ? 1 : typeof v === "number" ? 2 : typeof v === "string" ? 3 : 4;
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 1 || ra === 2) return (a as number) - (b as number);
  if (ra === 3) return (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0;
  return 0;
}

/**
 * Run a query. `canRead` is applied to each matching document; documents
 * the caller may not read are left out.
 */
export async function queryDocs(
  db: Db,
  collection: string,
  conditions: QueryCondition[],
  opts: QueryOptions,
  canRead: (doc: Doc) => Promise<boolean>
): Promise<{ docs: Doc[]; hasMore: boolean }> {
  await ensureCollection(db, collection);
  const where: string[] = [];
  const params: unknown[] = [];
  for (const c of conditions) {
    if (typeof c?.field !== "string" || !c.field || c.field.length > 200) {
      throw new StoreError(400, "invalid-argument", "Invalid query field.");
    }
    // Narrow in SQL only where it can't drop a real match.
    if (c.operator === "==" && (typeof c.value === "string" || typeof c.value === "boolean")) {
      where.push("JSON_UNQUOTE(JSON_EXTRACT(`data`, ?)) = ?");
      params.push(jsonPath(c.field), String(c.value));
    }
  }
  const [rows] = await db.query(
    `SELECT \`id\`, \`data\` FROM \`${collection}\`${where.length ? " WHERE " + where.join(" AND ") : ""}`,
    params
  );

  let docs: Doc[] = (rows as { id: string; data: unknown }[])
    .map((r) => ({ ...parseData(r.data), id: r.id }))
    .filter((d) => conditions.every((c) => matches(d, c)));

  if (opts.orderBy) {
    const field = opts.orderBy;
    const dir = opts.direction === "asc" ? 1 : -1;
    // Firestore leaves out documents that don't have the order-by field.
    docs = docs.filter((d) => getField(d, field) !== undefined);
    docs.sort((a, b) => dir * compareValues(getField(a, field), getField(b, field)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  } else {
    docs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  const readable: Doc[] = [];
  for (const d of docs) if (await canRead(d)) readable.push(d);

  let start = 0;
  if (opts.startAfterId) {
    const idx = readable.findIndex((d) => d.id === opts.startAfterId);
    start = idx >= 0 ? idx + 1 : readable.length;
  }
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 1000) : undefined;
  const page = limit ? readable.slice(start, start + limit) : readable.slice(start);
  const hasMore = limit ? start + limit < readable.length : false;
  return { docs: page, hasMore };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function putDoc(db: Db, collection: string, id: string, data: DocData): Promise<void> {
  await ensureCollection(db, collection);
  const { id: _ignored, ...rest } = data;
  void _ignored;
  const clean = normalize(rest) as DocData;
  await db.query(
    `INSERT INTO \`${collection}\` (\`id\`, \`data\`, \`created_at\`, \`updated_at\`, \`synced_at\`)
     VALUES (?, ?, ?, ?, 'app')
     ON DUPLICATE KEY UPDATE \`data\` = VALUES(\`data\`), \`created_at\` = VALUES(\`created_at\`),
       \`updated_at\` = VALUES(\`updated_at\`), \`synced_at\` = 'app'`,
    [
      id,
      JSON.stringify(clean),
      toMysqlDatetime(clean.createdAt as string),
      toMysqlDatetime(clean.updatedAt as string),
    ]
  );
}

export async function removeDoc(db: Db, collection: string, id: string): Promise<void> {
  await ensureCollection(db, collection);
  await db.query(`DELETE FROM \`${collection}\` WHERE \`id\` = ?`, [id]);
}

/**
 * Firestore update semantics: each top-level key replaces that field;
 * a key with dots ("address.city") sets that nested field.
 */
export function applyUpdate(existing: DocData, changes: DocData): DocData {
  const out: DocData = structuredClone(existing);
  delete out.id;
  for (const [key, value] of Object.entries(changes)) {
    if (key === "id") continue;
    const parts = key.split(".");
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = cur[parts[i]];
      if (next === null || typeof next !== "object" || Array.isArray(next)) cur[parts[i]] = {};
      cur = cur[parts[i]] as DocData;
    }
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}
