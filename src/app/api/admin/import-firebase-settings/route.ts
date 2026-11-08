// POST /api/admin/import-firebase-settings   (admin only)
// Copies the pricing settings (route fares, vehicle rates, booking extras)
// from the old Firebase project into MySQL.
//
// Body (optional): { overwrite: true } to replace settings already in MySQL.
// By default, settings that already exist in MySQL are left as they are.

import { Access } from "@/lib/server/access";
import { getSession } from "@/lib/server/auth";
import { getDoc, putDoc, StoreError } from "@/lib/server/docstore";
import { fetchFirebaseSettings, FirebaseImportError, PRICING_SETTINGS_DOCS } from "@/lib/server/firebase-import";
import { handle, json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handle(request, async (db) => {
    const session = await getSession(db, request);
    if (!session || session.anonymous || !(await new Access(db, session).isAdmin())) {
      throw new StoreError(403, "permission-denied", "Only an admin can import settings.");
    }
    const body = await readJson(request);
    const overwrite = body.overwrite === true;

    let fromFirebase: Record<string, Record<string, unknown>>;
    try {
      fromFirebase = await fetchFirebaseSettings(PRICING_SETTINGS_DOCS);
    } catch (err) {
      if (err instanceof FirebaseImportError) throw new StoreError(502, "firebase-unavailable", err.message);
      throw err;
    }

    const results: Record<string, string> = {};
    for (const id of PRICING_SETTINGS_DOCS) {
      const data = fromFirebase[id];
      if (!data) {
        results[id] = "not found in Firebase";
        continue;
      }
      const existing = await getDoc(db, "settings", id);
      if (existing && !overwrite) {
        results[id] = "kept the version already in MySQL";
        continue;
      }
      const now = new Date().toISOString();
      await putDoc(db, "settings", id, { ...data, updatedAt: now, importedFromFirebaseAt: now });
      const count = Array.isArray(data.routes) ? `${data.routes.length} routes` : Array.isArray(data.rates) ? `${data.rates.length} rates` : "saved";
      results[id] = `imported (${count})`;
    }
    return json({ ok: true, results });
  });
}
