# Moving bstcars.co from Firebase to MySQL

The live site keeps running on Firebase until each part has a working MySQL
replacement. Each stage is its own pull request and can be rolled back alone.

| Stage | What moves | Site affected? |
|---|---|---|
| 1. Copy data (this PR) | All Firestore collections, Auth logins and the Storage file list are copied into MySQL tables | No — read-only copy |
| 2. Data layer | `src/lib/firebase/firestore.ts` and `src/lib/services/*` read and write MySQL through server routes instead of Firestore | Yes |
| 3. Live updates | Screens using Firestore real-time listeners (driver tracking, booking status) switch to polling or server-sent events | Yes |
| 4. Logins | Firebase Auth replaced by our own sessions; existing passwords keep working using the exported Firebase password hashes | Yes |
| 5. Files | Driver documents move from Firebase Storage to the new file storage | Yes |
| 6. Back-end jobs | `functions/src/index.ts` (Stripe, notifications, earnings) becomes Next.js route handlers / scheduled jobs | Yes |
| 7. Final sync and switch-off | Last export with `--prune`, then Firebase is turned off | Yes |

## Stage 1: copy the data

You need a Firebase service account key: Firebase console → Project settings →
Service accounts → **Generate new private key**. Save it outside the repo (it is
a password to the whole Firebase project; never commit or share it).

```bash
npm install
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json \
  npm run export:mysql -- --download-files ./firebase-storage
```

This writes `firebase-export/bstcars-mysql-001.sql`, `-002.sql`, … and copies
every uploaded file into `firebase-storage/`. Nothing in Firebase is changed.

Then in GoDaddy: **bst → Settings → Hosted Database → Import SQL**, and import
the files **in name order**. Check the result with **Browse tables**.

Re-running is safe: every row is an upsert, so you can export and import again
at any time to refresh MySQL. For the final sync before switching off Firebase,
add `--prune` so documents deleted in Firebase are removed from MySQL too.

Delete `firebase-export/` after importing: it holds customer data and password hashes.

## Table layout

One table per Firestore collection (subcollections become `parent__child`):

- `id` — Firestore document id
- `data` — the whole document as JSON (timestamps as ISO-8601 UTC strings,
  GeoPoints as `{"latitude","longitude"}`, references as their path)
- `created_at`, `updated_at` — from the document's `createdAt` / `updatedAt`
- `f_<field>` — indexed, read-only columns for every field the site filters or
  sorts on (from `firestore.indexes.json`), e.g. `bookings.f_driverId`
- `synced_at` — which export run last wrote the row

Plus `auth_users` (one row per Firebase login, with its password hash and salt)
and `storage_files` (one row per uploaded file).

To check logins later, the Firebase password-hash parameters are needed:
Firebase console → Authentication → Users → ⋮ → **Password hash parameters**.
Keep them with the service account key, not in the repo.
