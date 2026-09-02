import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Server-only Firebase Admin SDK singleton. This must never be imported
 * from a "use client" file — it holds a service account credential with
 * full access to the project and only runs in API routes / server code.
 *
 * Credentials come from environment variables (see .env.local on the
 * server this runs on):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (paste the key from the downloaded service
 *                           account JSON; \n escapes are unescaped below)
 *
 * If those aren't set, initializeApp() falls back to
 * GOOGLE_APPLICATION_CREDENTIALS (a path to the downloaded JSON key) —
 * the same fallback scripts/create-admin.ts already uses.
 */
function buildAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Falls back to GOOGLE_APPLICATION_CREDENTIALS if set, or throws a clear
  // error at call time (not at import time) if neither is configured.
  return initializeApp();
}

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (!cachedApp) {
    cachedApp = buildAdminApp();
  }
  return cachedApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
