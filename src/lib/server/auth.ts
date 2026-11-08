// Logins and sessions on MySQL (server only). Replaces Firebase Auth.
//
// - Passwords are hashed with scrypt (Node's built-in crypto) and a random
//   salt per user, stored in `auth_users.password_hash`.
// - A session is a random token in an httpOnly cookie; only its SHA-256 hash
//   is stored in `sessions`, so a database leak doesn't expose live sessions.
// - "Guest" (anonymous) sessions replace Firebase anonymous sign-in, so
//   visitors can book without an account, as before.

import crypto from "node:crypto";
import { promisify } from "node:util";
import type { Db } from "@/lib/mysql/db";
import { ensureAppTables, getDoc, newId, putDoc, StoreError, type Doc } from "./docstore";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions
) => Promise<Buffer>;

export const SESSION_COOKIE = "bst_session";
const SESSION_DAYS = 30;
const GUEST_SESSION_DAYS = 7;
export const MIN_PASSWORD_LENGTH = 8;

export type Role = "passenger" | "driver" | "operator" | "admin" | "super_admin";
export const ROLES: Role[] = ["passenger", "driver", "operator", "admin", "super_admin"];

export interface Session {
  uid: string;
  anonymous: boolean;
}

export interface AuthUserPayload {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

export function checkNewPassword(password: unknown): string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new StoreError(400, "weak-password", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (password.length > 200) throw new StoreError(400, "weak-password", "Password is too long.");
  return password;
}

export function normalizeEmail(email: unknown): string {
  if (typeof email !== "string") throw new StoreError(400, "invalid-email", "Enter a valid email address.");
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 320) {
    throw new StoreError(400, "invalid-email", "Enter a valid email address.");
  }
  return e;
}

// ---------------------------------------------------------------------------
// Cookies and sessions
// ---------------------------------------------------------------------------

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function nowUtc(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString().replace("T", " ").replace("Z", "");
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0 && part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function isSecure(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export function sessionCookie(request: Request, token: string, days: number): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${days * 24 * 60 * 60}`,
    ...(isSecure(request) ? ["Secure"] : []),
  ].join("; ");
}

export function clearSessionCookie(request: Request): string {
  return [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", ...(isSecure(request) ? ["Secure"] : [])].join("; ");
}

/** Creates a session and returns the Set-Cookie header value. */
export async function startSession(db: Db, request: Request, uid: string, anonymous: boolean): Promise<string> {
  await ensureAppTables(db);
  const token = crypto.randomBytes(32).toString("base64url");
  const days = anonymous ? GUEST_SESSION_DAYS : SESSION_DAYS;
  await db.query(
    "INSERT INTO `sessions` (`token_hash`, `uid`, `anonymous`, `created_at`, `expires_at`) VALUES (?, ?, ?, ?, ?)",
    [sha256(token), uid, anonymous ? 1 : 0, nowUtc(), nowUtc(days * 86_400_000)]
  );
  // Occasionally clear out expired sessions.
  if (Math.random() < 0.05) {
    await db.query("DELETE FROM `sessions` WHERE `expires_at` < ?", [nowUtc()]);
  }
  return sessionCookie(request, token, days);
}

export async function getSession(db: Db, request: Request): Promise<Session | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length > 200) return null;
  await ensureAppTables(db);
  const [rows] = await db.query(
    "SELECT `uid`, `anonymous` FROM `sessions` WHERE `token_hash` = ? AND `expires_at` > ?",
    [sha256(token), nowUtc()]
  );
  const row = (rows as { uid: string; anonymous: number }[])[0];
  return row ? { uid: row.uid, anonymous: Boolean(row.anonymous) } : null;
}

export async function endSession(db: Db, request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await ensureAppTables(db);
  await db.query("DELETE FROM `sessions` WHERE `token_hash` = ?", [sha256(token)]);
}

export async function endAllSessions(db: Db, uid: string, exceptRequest?: Request): Promise<void> {
  const keep = exceptRequest ? readCookie(exceptRequest, SESSION_COOKIE) : null;
  if (keep) {
    await db.query("DELETE FROM `sessions` WHERE `uid` = ? AND `token_hash` <> ?", [uid, sha256(keep)]);
  } else {
    await db.query("DELETE FROM `sessions` WHERE `uid` = ?", [uid]);
  }
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface AuthRow {
  uid: string;
  email: string | null;
  password_hash: string | null;
  disabled: number;
  email_verified: number;
  display_name: string | null;
  photo_url: string | null;
}

export async function findAuthByEmail(db: Db, email: string): Promise<AuthRow | null> {
  await ensureAppTables(db);
  const [rows] = await db.query(
    "SELECT `uid`, `email`, `password_hash`, `disabled`, `email_verified`, `display_name`, `photo_url` FROM `auth_users` WHERE `email` = ? LIMIT 1",
    [email]
  );
  return (rows as AuthRow[])[0] ?? null;
}

export async function findAuthByUid(db: Db, uid: string): Promise<AuthRow | null> {
  await ensureAppTables(db);
  const [rows] = await db.query(
    "SELECT `uid`, `email`, `password_hash`, `disabled`, `email_verified`, `display_name`, `photo_url` FROM `auth_users` WHERE `uid` = ? LIMIT 1",
    [uid]
  );
  return (rows as AuthRow[])[0] ?? null;
}

export interface NewAccount {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  /** Extra fields for the users/{uid} profile (e.g. an operator's company). */
  extra?: Record<string, unknown>;
}

function cleanName(v: unknown, max = 100): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Creates the login (auth_users) and the users/{uid} profile together. */
export async function createAccount(db: Db, input: NewAccount): Promise<string> {
  const email = normalizeEmail(input.email);
  const password = checkNewPassword(input.password);
  if (!ROLES.includes(input.role)) throw new StoreError(400, "invalid-argument", "Invalid role.");
  if (await findAuthByEmail(db, email)) {
    throw new StoreError(409, "email-already-in-use", "An account with this email already exists.");
  }
  const uid = newId(28);
  const firstName = cleanName(input.firstName);
  const lastName = cleanName(input.lastName);
  const displayName = `${firstName} ${lastName}`.trim();
  const now = new Date().toISOString();
  await db.query(
    "INSERT INTO `auth_users` (`uid`, `email`, `email_verified`, `display_name`, `disabled`, `provider_ids`, `password_hash`, `created_at`, `data`, `synced_at`) VALUES (?, ?, 0, ?, 0, 'password', ?, ?, '{}', 'app')",
    [uid, email, displayName || null, await hashPassword(password), nowUtc()]
  );
  await putDoc(db, "users", uid, {
    ...(input.extra ?? {}),
    uid,
    email,
    firstName,
    lastName,
    displayName,
    phone: cleanName(input.phone, 40),
    role: input.role,
    status: "active",
    photoURL: "",
    emailVerified: false,
    active: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  });
  return uid;
}

export async function setPassword(db: Db, uid: string, password: string): Promise<void> {
  checkNewPassword(password);
  await db.query("UPDATE `auth_users` SET `password_hash` = ? WHERE `uid` = ?", [await hashPassword(password), uid]);
}

export async function userPayload(db: Db, session: Session): Promise<AuthUserPayload> {
  if (session.anonymous) {
    return { uid: session.uid, email: null, displayName: null, photoURL: null, isAnonymous: true, emailVerified: false };
  }
  const [auth, profile] = await Promise.all([findAuthByUid(db, session.uid), getDoc(db, "users", session.uid)]);
  const p = (profile ?? {}) as Doc;
  const name =
    (typeof p.displayName === "string" && p.displayName) ||
    `${(p.firstName as string) || ""} ${(p.lastName as string) || ""}`.trim() ||
    auth?.display_name ||
    null;
  return {
    uid: session.uid,
    email: auth?.email ?? ((p.email as string) || null),
    displayName: name,
    photoURL: (p.photoURL as string) || auth?.photo_url || null,
    isAnonymous: false,
    emailVerified: Boolean(auth?.email_verified),
  };
}

// ---------------------------------------------------------------------------
// Brute-force protection (per server process)
// ---------------------------------------------------------------------------

const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILURES = 8;
const LOCK_MS = 15 * 60 * 1000;

export function checkLoginAllowed(key: string): void {
  const f = failures.get(key);
  if (f && f.count >= MAX_FAILURES && f.until > Date.now()) {
    throw new StoreError(429, "too-many-requests", "Too many attempts. Please wait a few minutes or reset your password.");
  }
}

export function recordLoginFailure(key: string): void {
  const f = failures.get(key);
  const until = Date.now() + LOCK_MS;
  if (!f || f.until < Date.now()) failures.set(key, { count: 1, until });
  else failures.set(key, { count: f.count + 1, until });
  if (failures.size > 10_000) failures.clear();
}

export function clearLoginFailures(key: string): void {
  failures.delete(key);
}
