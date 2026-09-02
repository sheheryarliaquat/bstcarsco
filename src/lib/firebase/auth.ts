import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth as getAuth, db as getDb, isFirebaseConfigured } from './config';
import type { User as AppUser, UserRole } from '@/types';

interface SignUpData {
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
}

const DEMO_STORAGE_KEY = 'bst_demo_users';
const DEMO_SESSION_KEY = 'bst_demo_session';

interface DemoUser {
  uid: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  photoURL: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

function getDemoUsers(): Record<string, DemoUser> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDemoUsers(users: Record<string, DemoUser>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(users));
}

function createDemoUserCredential(user: DemoUser): UserCredential {
  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`,
      photoURL: user.photoURL || null,
      phoneNumber: null,
      providerId: 'demo',
      emailVerified: true,
      isAnonymous: false,
      metadata: {} as User['metadata'],
      providerData: [],
      getIdToken: async () => 'demo-token',
      getIdTokenResult: async () => ({ token: 'demo-token', claims: {}, signInProvider: 'demo', signInSecondFactor: null, expirationTime: '' }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({}),
    } as unknown as User,
    providerId: 'demo',
  } as UserCredential;
}

function setDemoSession(user: DemoUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
}

function getDemoSession(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(DEMO_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function isFirebaseAvailable(): boolean {
  if (!isFirebaseConfigured()) return false;
  try {
    getAuth();
    return true;
  } catch {
    return false;
  }
}

export async function signUp(
  email: string,
  password: string,
  userData: SignUpData
): Promise<UserCredential> {
  if (isFirebaseAvailable()) {
    try {
      const credential = await createUserWithEmailAndPassword(getAuth(), email, password);
      await firebaseUpdateProfile(credential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });
      await setDoc(doc(getDb(), 'users', credential.user.uid), {
        uid: credential.user.uid,
        email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role || 'passenger',
        status: 'active',
        photoURL: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      return credential;
    } catch {
      // Fall through to demo mode
    }
  }

  const users = getDemoUsers();
  const key = email.toLowerCase();
  if (users[key]) {
    throw new Error('An account with this email already exists.');
  }

  const newUser: DemoUser = {
    uid: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    email,
    password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    role: userData.role || 'passenger',
    photoURL: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users[key] = newUser;
  saveDemoUsers(users);
  setDemoSession(newUser);

  return createDemoUserCredential(newUser);
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  if (isFirebaseAvailable()) {
    try {
      const credential = await signInWithEmailAndPassword(getAuth(), email, password);
      await setDoc(
        doc(getDb(), 'users', credential.user.uid),
        { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );
      return credential;
    } catch {
      // Fall through to demo mode
    }
  }

  const users = getDemoUsers();
  const key = email.toLowerCase();
  const user = users[key];

  if (!user) {
    throw new Error('No account found with this email.');
  }
  if (user.password !== password) {
    throw new Error('Invalid password.');
  }

  user.lastLoginAt = new Date().toISOString();
  users[key] = user;
  saveDemoUsers(users);
  setDemoSession(user);

  return createDemoUserCredential(user);
}

export async function signInWithGoogle(): Promise<UserCredential> {
  if (isFirebaseAvailable()) {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(getAuth(), provider);
      const userRef = doc(getDb(), 'users', credential.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const names = credential.user.displayName?.split(' ') || ['', ''];
        await setDoc(userRef, {
          uid: credential.user.uid,
          email: credential.user.email,
          firstName: names[0],
          lastName: names.slice(1).join(' '),
          phone: '',
          role: 'passenger' as UserRole,
          status: 'active',
          photoURL: credential.user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      }
      return credential;
    } catch {
      // Fall through to demo mode
    }
  }

  const demoUser: DemoUser = {
    uid: `demo-google-${Date.now()}`,
    email: 'google-user@demo.com',
    password: '',
    firstName: 'Google',
    lastName: 'User',
    phone: '',
    role: 'passenger',
    photoURL: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  setDemoSession(demoUser);
  return createDemoUserCredential(demoUser);
}

export async function signOutUser(): Promise<void> {
  if (isFirebaseAvailable()) {
    try {
      await signOut(getAuth());
    } catch {
      // Fall through
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (isFirebaseAvailable()) {
    try {
      await sendPasswordResetEmail(getAuth(), email);
      return;
    } catch {
      // Fall through
    }
  }
  throw new Error('Password reset is not available in demo mode.');
}

export async function updateProfile(data: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> {
  if (isFirebaseAvailable()) {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No authenticated user');
      await firebaseUpdateProfile(user, data);
      await setDoc(doc(getDb(), 'users', user.uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return;
    } catch {
      // Fall through
    }
  }

  const session = getDemoSession();
  if (session) {
    if (data.displayName) {
      const parts = data.displayName.split(' ');
      session.firstName = parts[0] || session.firstName;
      session.lastName = parts.slice(1).join(' ') || session.lastName;
    }
    if (data.photoURL) session.photoURL = data.photoURL;
    setDemoSession(session);
    const users = getDemoUsers();
    if (users[session.email]) {
      users[session.email] = { ...users[session.email], ...session };
      saveDemoUsers(users);
    }
  }
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  if (isFirebaseAvailable()) {
    try {
      return firebaseOnAuthStateChanged(getAuth(), callback);
    } catch {
      // Fall through to demo
    }
  }

  const session = getDemoSession();
  if (session) {
    setTimeout(() => {
      callback(createDemoUserCredential(session).user as User);
    }, 0);
  } else {
    setTimeout(() => callback(null), 0);
  }

  return () => {};
}

/**
 * Firestore rules for `vehicles`/`settings`/`bookings` require
 * request.auth != null — a signed-out visitor otherwise gets a silent
 * permission-denied on the public quotes/checkout flow. This gives them an
 * anonymous Firebase session (stable uid, no credentials) so those reads
 * and their own booking's create/read succeed without forcing a real
 * account. Requires Anonymous sign-in enabled in the Firebase console
 * (Authentication → Sign-in method).
 *
 * IMPORTANT: Firebase Auth restores a persisted session (e.g. an admin's
 * login) asynchronously after page load — `auth.currentUser` can read
 * `null` for a moment even when a real session is about to be restored.
 * Checking it synchronously here previously caused a real signed-in
 * session to occasionally be raced and overwritten by a fresh anonymous
 * one (Firebase Auth persistence is shared across tabs in the same
 * browser, so this could silently sign an admin out everywhere). Waiting
 * for the first onAuthStateChanged callback guarantees restoration has
 * finished before deciding whether an anonymous session is needed.
 */
export async function ensureAuthSession(): Promise<User | null> {
  if (!isFirebaseAvailable()) return getCurrentUser();
  try {
    const auth = getAuth();
    const restored = await new Promise<User | null>((resolve) => {
      const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
    if (restored) return restored;
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (err) {
    console.error('ensureAuthSession: anonymous sign-in failed —', err);
    return getAuth().currentUser;
  }
}

export function getCurrentUser(): User | null {
  if (isFirebaseAvailable()) {
    try {
      return getAuth().currentUser;
    } catch {
      // Fall through
    }
  }

  const session = getDemoSession();
  if (session) {
    return createDemoUserCredential(session).user as User;
  }
  return null;
}

export async function getUserData(uid: string): Promise<AppUser | null> {
  if (isFirebaseAvailable()) {
    try {
      const userSnap = await getDoc(doc(getDb(), 'users', uid));
      if (userSnap.exists()) {
        return { uid: userSnap.id, ...userSnap.data() } as AppUser;
      }
    } catch {
      // Fall through to demo
    }
  }

  const session = getDemoSession();
  if (session && (session.uid === uid || uid.startsWith('demo-'))) {
    return {
      uid: session.uid,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName,
      phone: session.phone,
      role: session.role,
      status: session.status as 'active',
      photoURL: session.photoURL,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    } as AppUser;
  }

  const users = getDemoUsers();
  const user = users[uid] || Object.values(users).find((u) => u.uid === uid);
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status as 'active',
      photoURL: user.photoURL,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as AppUser;
  }

  return null;
}

export async function createGuestBooking(
  bookingData: Record<string, unknown>
): Promise<string> {
  if (isFirebaseAvailable()) {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const docRef = await addDoc(collection(getDb(), 'guest_bookings'), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Fall through
    }
  }
  return `guest-${Date.now()}`;
}
