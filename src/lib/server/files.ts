// Uploaded files stored in MySQL (server only). Replaces Firebase Storage.

import { StoreError } from "./docstore";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Validates a storage path like "drivers/abc/documents/insurance/file.pdf". */
export function assertFilePath(path: unknown): string {
  if (typeof path !== "string" || path.length === 0 || path.length > 500) {
    throw new StoreError(400, "invalid-argument", "Invalid file path.");
  }
  const parts = path.split("/");
  if (parts.some((p) => p === "" || p === "." || p === ".." || /[\x00-\x1f\\]/.test(p))) {
    throw new StoreError(400, "invalid-argument", "Invalid file path.");
  }
  return path;
}

/** Public URL the browser uses to view a stored file. */
export function fileUrl(path: string, version?: string | number): string {
  const url = "/api/files/" + path.split("/").map(encodeURIComponent).join("/");
  return version !== undefined ? `${url}?v=${encodeURIComponent(String(version))}` : url;
}

/** Content types safe to show inside the page; anything else downloads in a sandbox. */
const INLINE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

export function fileResponseHeaders(contentType: string, size: number, name: string): Headers {
  const safe = INLINE_TYPES.has(contentType.toLowerCase());
  const headers = new Headers({
    "Content-Type": safe ? contentType : "application/octet-stream",
    "Content-Length": String(size),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=300",
    "Content-Disposition": `${safe ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
  });
  if (!safe) headers.set("Content-Security-Policy", "sandbox; default-src 'none'");
  return headers;
}
