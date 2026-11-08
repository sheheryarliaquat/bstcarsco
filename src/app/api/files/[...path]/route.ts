// Serves an uploaded file: GET /api/files/<path>. Access follows storage rules
// (src/lib/server/access.ts); public paths (e.g. profile photos) need no login.

import { Access } from "@/lib/server/access";
import { getSession } from "@/lib/server/auth";
import { ensureAppTables, StoreError } from "@/lib/server/docstore";
import { assertFilePath, fileResponseHeaders } from "@/lib/server/files";
import { handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Params) {
  const { path: segments } = await params;
  return handle(request, async (db) => {
    await ensureAppTables(db);
    const path = assertFilePath(segments.map((s) => decodeURIComponent(s)).join("/"));
    const access = new Access(db, await getSession(db, request));
    if (!(await access.canFile("read", path))) {
      throw new StoreError(403, "permission-denied", "You don't have permission to view this file.");
    }
    const [rows] = await db.query(
      "SELECT `content`, `content_type`, `size_bytes` FROM `files` WHERE `path` = ?",
      [path]
    );
    const row = (rows as { content: Buffer; content_type: string; size_bytes: number }[])[0];
    if (!row) throw new StoreError(404, "object-not-found", "File not found.");
    const name = path.split("/").pop() || "file";
    return new Response(new Uint8Array(row.content), {
      headers: fileResponseHeaders(row.content_type, Number(row.size_bytes), name),
    });
  });
}
