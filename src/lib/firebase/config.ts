import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase's client-side web config is not a secret — it's meant to be
// public (Firebase's own docs note this); real access control comes from
// Firestore/Storage security rules, not from hiding this object. These
// fallbacks exist because some hosting platforms' "environment variables"
// panel doesn't actually inject NEXT_PUBLIC_* vars into `next build` (they
// only reach the runtime process, not the client bundle those vars need to
// be baked into) — env vars still take priority whenever they *are*
// wired through correctly.
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCoAHZj99dLuTbPnJmrZfEhOVPHtUFBHK8',
  authDomain: 'bstcarsco.firebaseapp.com',
  projectId: 'bstcarsco',
  storageBucket: 'bstcarsco.firebasestorage.app',
  messagingSenderId: '756277897347',
  appId: '1:756277897347:web:bf992bb7e3f2a4572153b6',
  measurementId: 'G-0Z3V4NTT3Q',
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? FALLBACK_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? FALLBACK_FIREBASE_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? FALLBACK_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? FALLBACK_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? FALLBACK_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? FALLBACK_FIREBASE_CONFIG.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? FALLBACK_FIREBASE_CONFIG.measurementId,
};

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables before using Firebase.');
  }

  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

function getApp(): FirebaseApp {
  return getFirebaseApp();
}

function getAuthInstance(): Auth {
  return getAuth(getFirebaseApp());
}

function getFirestoreInstance(): Firestore {
  return getFirestore(getFirebaseApp());
}

function getStorageInstance(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

export { getApp as app, getAuthInstance as auth, getFirestoreInstance as db, getStorageInstance as storage };

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
