// Shared helpers for the /api route handlers (server only).

import { isMysqlConfigured, withConnection, type Db } from "@/lib/mysql/db";
import { StoreError } from "./docstore";

export function json(body: unknown, status = 200, setCookies: string[] = []): Response {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  for (const c of setCookies) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function readJson<T = Record<string, unknown>>(request: Request, maxBytes = 1_000_000): Promise<T> {
  const text = await request.text();
  if (text.length > maxBytes) throw new StoreError(413, "too-large", "Request is too large.");
  if (!text) return {} as T;
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== "object") throw new Error();
    return value as T;
  } catch {
    throw new StoreError(400, "invalid-argument", "Request body must be JSON.");
  }
}

/** Only allow same-site requests to change data (protects the session cookie from CSRF). */
export function assertSameOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  if (!origin) return; // non-browser clients and same-origin navigations
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new StoreError(403, "permission-denied", "Cross-site request blocked.");
  }
  if (!host || originHost !== host.split(",")[0].trim()) {
    throw new StoreError(403, "permission-denied", "Cross-site request blocked.");
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof StoreError) {
    return json({ error: { code: err.code, message: err.message } }, err.status);
  }
  console.error("[api] unexpected error:", err);
  return json({ error: { code: "internal", message: "Something went wrong. Please try again." } }, 500);
}

/** Run a handler with one database connection and uniform error handling. */
export async function handle(request: Request, fn: (db: Db) => Promise<Response>): Promise<Response> {
  if (!isMysqlConfigured()) {
    return json(
      { error: { code: "backend-unavailable", message: "The database is not configured." } },
      503
    );
  }
  try {
    assertSameOrigin(request);
    return await withConnection(fn);
  } catch (err) {
    return errorResponse(err);
  }
}
