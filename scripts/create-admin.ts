/**
 * Create (or promote) a real admin account in Firebase — Auth user +
 * Firestore `users/{uid}` document with role: 'admin'.
 *
 * This is the script that actually provisions the account behind the
 * /admin/login page. It talks to Firebase Auth + Firestore directly via the
 * Admin SDK, so it needs service-account credentials with access to the
 * project — the same ones scripts/seed-data.ts uses.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com \
 *   ADMIN_PASSWORD='a-strong-password' \
 *   ADMIN_FIRST_NAME=Jane \
 *   ADMIN_LAST_NAME=Doe \
 *   npx tsx scripts/create-admin.ts
 *
 * Requires (same as scripts/seed-data.ts):
 *   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *     environment variables (from a Firebase service account key), or a
 *     GOOGLE_APPLICATION_CREDENTIALS path to a service account JSON file.
 *   - firebase-admin installed (npm install firebase-admin --save-dev)
 *
 * Safe to re-run: if the email already exists, its password/name are
 * updated and its Firestore role is (re)set to 'admin' rather than
 * creating a duplicate account.
 */

import { initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

let app: App

try {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
} catch {
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS / application-default creds.
  app = initializeApp()
}

const auth = getAuth(app)
const db = getFirestore(app)

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`\nMissing required environment variable: ${name}`)
    console.error('See the usage comment at the top of this script.\n')
    process.exit(1)
  }
  return value
}

async function main() {
  const email = requireEnv('ADMIN_EMAIL')
  const password = requireEnv('ADMIN_PASSWORD')
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin'
  const lastName = process.env.ADMIN_LAST_NAME || 'User'
  const phone = process.env.ADMIN_PHONE || ''
  const role = process.env.ADMIN_ROLE === 'super_admin' ? 'super_admin' : 'admin'

  if (password.length < 8) {
    console.error('\nADMIN_PASSWORD must be at least 8 characters.\n')
    process.exit(1)
  }

  let uid: string

  try {
    const existing = await auth.getUserByEmail(email)
    uid = existing.uid
    await auth.updateUser(uid, {
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true,
    })
    console.log(`✓ Existing Firebase Auth user found for ${email} (${uid}) — password/name updated.`)
  } catch {
    const created = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true,
    })
    uid = created.uid
    console.log(`✓ Created Firebase Auth user for ${email} (${uid}).`)
  }

  await db.collection('users').doc(uid).set(
    {
      uid,
      email,
      firstName,
      lastName,
      phone,
      role,
      status: 'active',
      photoURL: '',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  console.log(`✓ Firestore users/${uid} set with role: '${role}'.`)

  console.log(`\nDone. Sign in at /admin/login with:\n  email:    ${email}\n  password: (the ADMIN_PASSWORD you set)\n`)
}

main().catch((err) => {
  console.error('\nFailed to create admin account:', err)
  process.exit(1)
})
