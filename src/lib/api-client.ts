// Browser-side helper for calling the site's own /api routes.
// Errors carry a `code` like Firebase errors did (e.g. "permission-denied"),
// so existing error handling keeps working.

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init });
  } catch {
    throw new ApiError("network-request-failed", "Network error — check your connection and try again.", 0);
  }
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(err?.code ?? `http-${res.status}`, err?.message ?? `Request failed (${res.status}).`, res.status);
  }
  return body as T;
}

export function apiPost<T>(path: string, body: unknown = {}): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** True when the server says the database isn't set up (e.g. local dev without MySQL). */
export function isBackendUnavailable(err: unknown): boolean {
  return err instanceof ApiError && err.code === "backend-unavailable";
}
