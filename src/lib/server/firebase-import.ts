// One-time copy of the admin's pricing settings from the old Firebase
// project into MySQL (server only). Used by /api/admin/import-firebase-settings.
//
// Reads Firestore's `settings` documents over its public REST API, signed in
// as an anonymous Firebase user (the old security rules let any signed-in
// user read `settings`). Uses the project's public web config, the same
// values the site's browser code used before the move to MySQL.

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCoAHZj99dLuTbPnJmrZfEhOVPHtUFBHK8";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "bstcarsco";

/** The pricing documents the admin pages save in `settings`. */
export const PRICING_SETTINGS_DOCS = ["routeFares", "vehicleRates", "bookingExtras"];

type FirestoreValue = Record<string, unknown>;

/** Converts a Firestore REST value ({ stringValue: "x" }, …) to plain JSON. */
export function fromFirestoreValue(v: FirestoreValue): unknown {
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("stringValue" in v) return String(v.stringValue);
  if ("timestampValue" in v) return new Date(String(v.timestampValue)).toISOString();
  if ("bytesValue" in v) return String(v.bytesValue);
  if ("referenceValue" in v) return String(v.referenceValue).replace(/^projects\/[^/]+\/databases\/[^/]+\/documents\//, "");
  if ("geoPointValue" in v) {
    const g = v.geoPointValue as { latitude?: number; longitude?: number };
    return { latitude: g.latitude ?? 0, longitude: g.longitude ?? 0 };
  }
  if ("arrayValue" in v) {
    const values = ((v.arrayValue as { values?: FirestoreValue[] }) ?? {}).values ?? [];
    return values.map(fromFirestoreValue);
  }
  if ("mapValue" in v) {
    return fromFirestoreFields(((v.mapValue as { fields?: Record<string, FirestoreValue> }) ?? {}).fields ?? {});
  }
  return null;
}

export function fromFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromFirestoreValue(v);
  return out;
}

export class FirebaseImportError extends Error {}

type FetchFn = typeof fetch;

async function call(fetchImpl: FetchFn, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchImpl(url, init);
  } catch (err) {
    throw new FirebaseImportError(`Could not reach Firebase from the server: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function anonymousToken(fetchImpl: FetchFn): Promise<string> {
  const res = await call(fetchImpl, `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const body = (await res.json().catch(() => ({}))) as { idToken?: string; error?: { message?: string } };
  if (!res.ok || !body.idToken) {
    const reason = body.error?.message ?? `HTTP ${res.status}`;
    throw new FirebaseImportError(
      reason.includes("ADMIN_ONLY_OPERATION") || reason.includes("OPERATION_NOT_ALLOWED")
        ? "Firebase anonymous sign-in is turned off, so the old settings can't be read this way."
        : `Could not sign in to Firebase: ${reason}`
    );
  }
  return body.idToken;
}

/**
 * Fetches the given `settings` documents from Firebase.
 * Returns { docId: data } for the documents that exist.
 */
export async function fetchFirebaseSettings(
  docIds: string[],
  fetchImpl: FetchFn = fetch
): Promise<Record<string, Record<string, unknown>>> {
  const token = await anonymousToken(fetchImpl);
  const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings`;
  const out: Record<string, Record<string, unknown>> = {};
  for (const id of docIds) {
    const res = await call(fetchImpl, `${base}/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) continue;
    const body = (await res.json().catch(() => ({}))) as {
      fields?: Record<string, FirestoreValue>;
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new FirebaseImportError(`Could not read settings/${id} from Firebase: ${body.error?.message ?? `HTTP ${res.status}`}`);
    }
    out[id] = fromFirestoreFields(body.fields ?? {});
  }
  return out;
}
