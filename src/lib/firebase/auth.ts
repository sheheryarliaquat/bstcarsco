// Logins for the site — now backed by the GoDaddy MySQL database through
// /api/auth (see src/app/api/auth/[action]/route.ts), not Firebase Auth.
//
// The file keeps its old path and function names so the rest of the site is
// unchanged. When the server reports that no database is configured (e.g.
// local development without MySQL), the previous localStorage demo mode is
// used instead, as before.

import { apiFetch, apiPost, isBackendUnavailable } from '@/lib/api-client';
import { addDocument, getDocument } from './firestore';
import type { User as AppUser, UserRole } from '@/types';

/** The signed-in login (what Firebase's `User` used to be). */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  providerId: string;
}

export interface UserCredential {
  user: User;
  providerId: string;
}

interface ServerUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
}

function toUser(u: ServerUser): User {
  return { ...u, phoneNumber: null, providerId: u.isAnonymous ? 'anonymous' : 'password' };
}

// ---------------------------------------------------------------------------
// Current user, shared by every onAuthStateChanged listener
// ---------------------------------------------------------------------------

let current: User | null | undefined; // undefined = not loaded yet
let loading: Promise<User | null> | null = null;
const listeners = new Set<(user: User | null) => void>();

function setCurrent(user: User | null): void {
  current = user;
  for (const cb of listeners) cb(user);
}

function loadCurrent(): Promise<User | null> {
  if (!loading) {
    loading = apiFetch<{ user: ServerUser | null }>('/api/auth/me')
      .then(({ user }) => (user ? toUser(user) : null))
      .catch((err) => {
        if (isBackendUnavailable(err)) {
          const session = getDemoSession();
          return session ? createDemoUserCredential(session).user : null;
        }
        return null;
      })
      .then((user) => {
        setCurrent(user);
        return user;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

// ---------------------------------------------------------------------------
// Demo mode (no database configured)
// ---------------------------------------------------------------------------

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
    },
    providerId: 'demo',
  };
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

function demoSignUp(email: string, password: string, userData: SignUpData): UserCredential {
  const users = getDemoUsers();
  const key = email.toLowerCase();
  if (users[key]) {
    throw new Error('An account with this email already exists.');
  }
  const now = new Date().toISOString();
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
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  users[key] = newUser;
  saveDemoUsers(users);
  setDemoSession(newUser);
  return createDemoUserCredential(newUser);
}

function demoSignIn(email: string, password: string): UserCredential {
  const users = getDemoUsers();
  const key = email.toLowerCase();
  const user = users[key];
  if (!user) throw new Error('No account found with this email.');
  if (user.password !== password) throw new Error('Invalid password.');
  user.lastLoginAt = new Date().toISOString();
  users[key] = user;
  saveDemoUsers(users);
  setDemoSession(user);
  return createDemoUserCredential(user);
}

function demoUserData(uid: string): AppUser | null {
  const session = getDemoSession();
  const user =
    session && (session.uid === uid || uid.startsWith('demo-'))
      ? session
      : Object.values(getDemoUsers()).find((u) => u.uid === uid);
  if (!user) return null;
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

// ---------------------------------------------------------------------------
// Public API (same names as before)
// ---------------------------------------------------------------------------

export async function signUp(
  email: string,
  password: string,
  userData: SignUpData
): Promise<UserCredential> {
  try {
    const { user } = await apiPost<{ user: ServerUser }>('/api/auth/signup', {
      email,
      password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role,
    });
    const u = toUser(user);
    setCurrent(u);
    return { user: u, providerId: 'password' };
  } catch (err) {
    if (!isBackendUnavailable(err)) throw err;
  }
  const credential = demoSignUp(email, password, userData);
  setCurrent(credential.user);
  return credential;
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const { user } = await apiPost<{ user: ServerUser }>('/api/auth/login', { email, password });
    const u = toUser(user);
    setCurrent(u);
    return { user: u, providerId: 'password' };
  } catch (err) {
    if (!isBackendUnavailable(err)) throw err;
  }
  const credential = demoSignIn(email, password);
  setCurrent(credential.user);
  return credential;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  throw new Error('Google sign-in is not available. Please sign in with your email and password.');
}

export async function signOutUser(): Promise<void> {
  try {
    await apiPost('/api/auth/logout');
  } catch {
    // Signed out locally either way.
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
  setCurrent(null);
}

/**
 * Creates a real login for someone an admin is onboarding (driver or
 * operator) without signing the admin out. `extra` is merged into their
 * users/{uid} profile (e.g. an operator's company details).
 */
async function createManagedAccount(
  role: Extract<UserRole, 'driver' | 'operator'>,
  email: string,
  password: string,
  profile: { firstName: string; lastName: string; phone: string },
  extra: Record<string, unknown> = {}
): Promise<{ uid: string }> {
  return apiPost<{ uid: string }>('/api/auth/create-account', { role, email, password, profile, extra });
}

export async function createDriverAccount(
  email: string,
  password: string,
  profile: { firstName: string; lastName: string; phone: string }
): Promise<{ uid: string }> {
  return createManagedAccount('driver', email, password, profile);
}

export async function createOperatorAccount(
  email: string,
  password: string,
  profile: { firstName: string; lastName: string; phone: string },
  company: {
    companyName: string;
    description: string;
    fleetSize: number;
    commission: { percent: number; flatFee: number };
  }
): Promise<{ uid: string }> {
  return createManagedAccount('operator', email, password, profile, {
    ...company,
    rating: 0,
    totalReviews: 0,
    isVerified: false,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiPost('/api/auth/change-password', { currentPassword, newPassword });
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await apiPost('/api/auth/reset-request', { email });
  } catch (err) {
    if (isBackendUnavailable(err)) throw new Error('Password reset is not available in demo mode.');
    throw err;
  }
}

/** Sets a new password using the token from a password-reset email. */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await apiPost('/api/auth/reset-confirm', { token, password: newPassword });
}

export async function updateProfile(data: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> {
  try {
    const { user } = await apiPost<{ user: ServerUser }>('/api/auth/profile', data);
    setCurrent(toUser(user));
    return;
  } catch (err) {
    if (!isBackendUnavailable(err)) throw err;
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
  listeners.add(callback);
  if (current !== undefined) {
    const known = current;
    setTimeout(() => {
      if (listeners.has(callback)) callback(known);
    }, 0);
  } else {
    void loadCurrent();
  }
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Makes sure the visitor has a session so the public quotes/checkout flow
 * can read prices and save their booking without an account: returns the
 * signed-in user, or starts a guest session.
 */
export async function ensureAuthSession(): Promise<User | null> {
  const existing = current !== undefined ? current : await loadCurrent();
  if (existing) return existing;
  try {
    const { user } = await apiPost<{ user: ServerUser }>('/api/auth/guest');
    const u = toUser(user);
    setCurrent(u);
    return u;
  } catch (err) {
    console.error('ensureAuthSession: could not start a guest session —', err);
    return null;
  }
}

export function getCurrentUser(): User | null {
  if (current) return current;
  const session = getDemoSession();
  return session ? createDemoUserCredential(session).user : null;
}

export async function getUserData(uid: string): Promise<AppUser | null> {
  if (uid.startsWith('demo-')) return demoUserData(uid);
  try {
    const doc = await getDocument<AppUser & { id: string }>('users', uid);
    if (!doc) return null;
    const { id, ...rest } = doc;
    return { ...rest, uid: id } as AppUser;
  } catch (err) {
    if (isBackendUnavailable(err)) return demoUserData(uid);
    return null;
  }
}

export async function createGuestBooking(
  bookingData: Record<string, unknown>
): Promise<string> {
  try {
    return await addDocument('guest_bookings', bookingData);
  } catch {
    return `guest-${Date.now()}`;
  }
}
