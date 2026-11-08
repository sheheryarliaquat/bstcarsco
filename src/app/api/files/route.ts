// File API (replaces Firebase Storage). Called by src/lib/firebase/storage.ts.
//
//   POST   /api/files              multipart form: path, file   -> { url }
//   GET    /api/files?folder=x     list files directly in folder x
//   DELETE /api/files?path=x       delete one file
//   GET    /api/files/<path>       view a file (see [...path]/route.ts)

import { Access } from "@/lib/server/access";
import { getSession } from "@/lib/server/auth";
import { ensureAppTables, StoreError } from "@/lib/server/docstore";
import { assertFilePath, fileUrl, MAX_FILE_BYTES } from "@/lib/server/files";
import { handle, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const denied = () => new StoreError(403, "permission-denied", "You don't have permission to access this file.");

function nowUtc(): string {
  return new Date().toISOString().replace("T", " ").replace("Z", "");
}

export async function POST(request: Request) {
  return handle(request, async (db) => {
    await ensureAppTables(db);
    const length = Number(request.headers.get("content-length") || "0");
    if (length > MAX_FILE_BYTES + 1024 * 1024) {
      throw new StoreError(413, "too-large", "File is too large (maximum 10 MB).");
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new StoreError(400, "invalid-argument", "Upload must be a multipart form.");
    }
    const path = assertFilePath(form.get("path"));
    const file = form.get("file");
    if (!(file instanceof Blob)) throw new StoreError(400, "invalid-argument", "No file was sent.");
    if (file.size > MAX_FILE_BYTES) throw new StoreError(413, "too-large", "File is too large (maximum 10 MB).");
    const contentType = (file.type || "application/octet-stream").slice(0, 255);

    const session = await getSession(db, request);
    const access = new Access(db, session);
    const [rows] = await db.query("SELECT 1 FROM `files` WHERE `path` = ?", [path]);
    const exists = (rows as unknown[]).length > 0;
    if (!(await access.canFile(exists ? "update" : "create", path, { contentType, size: file.size }))) throw denied();

    const content = Buffer.from(await file.arrayBuffer());
    const now = nowUtc();
    await db.query(
      `INSERT INTO \`files\` (\`path\`, \`content\`, \`content_type\`, \`size_bytes\`, \`owner_uid\`, \`created_at\`, \`updated_at\`)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`content\` = VALUES(\`content\`), \`content_type\` = VALUES(\`content_type\`),
         \`size_bytes\` = VALUES(\`size_bytes\`), \`owner_uid\` = VALUES(\`owner_uid\`), \`updated_at\` = VALUES(\`updated_at\`)`,
      [path, content, contentType, content.length, session?.uid ?? null, now, now]
    );
    return json({ url: fileUrl(path, Date.now()), path, size: content.length, contentType });
  });
}

export async function GET(request: Request) {
  return handle(request, async (db) => {
    await ensureAppTables(db);
    const folder = new URL(request.url).searchParams.get("folder") ?? "";
    const prefix = folder ? assertFilePath(folder.replace(/\/+$/, "")) + "/" : "";
    const [rows] = await db.query(
      "SELECT `path`, `size_bytes`, `created_at` FROM `files` WHERE `path` LIKE ? ORDER BY `path`",
      [prefix.replace(/[\\%_]/g, (c) => "\\" + c) + "%"]
    );
    const access = new Access(db, await getSession(db, request));
    const items = [];
    for (const r of rows as { path: string; size_bytes: number; created_at: string }[]) {
      const rest = r.path.slice(prefix.length);
      if (rest.includes("/")) continue; // only files directly in this folder, like Firebase listAll().items
      if (!(await access.canFile("read", r.path))) continue;
      items.push({
        name: rest,
        fullPath: r.path,
        size: Number(r.size_bytes),
        timeCreated: new Date(r.created_at.replace(" ", "T") + "Z").toISOString(),
      });
    }
    return json({ items });
  });
}

export async function DELETE(request: Request) {
  return handle(request, async (db) => {
    await ensureAppTables(db);
    const path = assertFilePath(new URL(request.url).searchParams.get("path"));
    const access = new Access(db, await getSession(db, request));
    if (!(await access.canFile("delete", path))) throw denied();
    const [result] = await db.query("DELETE FROM `files` WHERE `path` = ?", [path]);
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new StoreError(404, "object-not-found", "File not found.");
    }
    return json({ ok: true });
  });
}
