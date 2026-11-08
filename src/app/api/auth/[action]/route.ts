// Login API (replaces Firebase Auth). Called by src/lib/firebase/auth.ts.
//
//   GET  /api/auth/me               current user, or null
//   GET  /api/auth/status           setup check: admin secrets present? (no secret values)
//   POST /api/auth/signup           { email, password, firstName, lastName, phone, role? (passenger|driver) }
//   POST /api/auth/login            { email, password }
//   POST /api/auth/logout
//   POST /api/auth/guest            guest session for booking without an account
//   POST /api/auth/change-password  { currentPassword, newPassword }
//   POST /api/auth/profile          { displayName?, photoURL? }
//   POST /api/auth/create-account   admin only: { role: driver|operator, email, password, profile, extra }
//   POST /api/auth/reset-request    { email }
//   POST /api/auth/reset-confirm    { token, password }

import crypto from "node:crypto";
import { inTransaction, type Db } from "@/lib/mysql/db";
import { Access } from "@/lib/server/access";
import {
  checkLoginAllowed,
  checkNewPassword,
  clearLoginFailures,
  clearSessionCookie,
  createAccount,
  endAllSessions,
  endSession,
  ensureOwnerAdmin,
  MIN_PASSWORD_LENGTH,
  ownerEmailSecret,
  findAuthByEmail,
  findAuthByUid,
  getSession,
  normalizeEmail,
  recordLoginFailure,
  setPassword,
  sha256,
  startSession,
  userPayload,
  verifyPassword,
  type Session,
} from "@/lib/server/auth";
import { ensureAppTables, getDoc, newId, putDoc, StoreError } from "@/lib/server/docstore";
import { handle, json, readJson } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ action: string }> };

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function siteOrigin(request: Request): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  return host ? `${proto}://${host.split(",")[0].trim()}` : new URL(request.url).origin;
}

function nowUtc(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString().replace("T", " ").replace("Z", "");
}

async function requireUser(db: Db, request: Request): Promise<Session> {
  const session = await getSession(db, request);
  if (!session || session.anonymous) throw new StoreError(401, "unauthenticated", "Please sign in.");
  return session;
}

async function touchLogin(db: Db, uid: string): Promise<void> {
  const profile = await getDoc(db, "users", uid);
  if (profile) {
    const now = new Date().toISOString();
    await putDoc(db, "users", uid, { ...profile, lastLoginAt: now, updatedAt: now });
  }
}

export async function GET(request: Request, { params }: Params) {
  const { action } = await params;
  return handle(request, async (db) => {
    if (action === "status") {
      // Setup check for the owner: is this code live, and are the admin secrets
      // set? Never reveals the password; the email is masked.
      const owner = ownerEmailSecret();
      const rawEmail = owner.source === "ADMIN_LOGIN_EMAIL" ? process.env.ADMIN_LOGIN_EMAIL ?? "" : process.env.ADMIN_EMAIL ?? "";
      const rawPassword = process.env.ADMIN_PASSWORD ?? "";
      const email = rawEmail.trim().toLowerCase();
      const at = email.indexOf("@");
      const masked = at > 0 ? `${email[0]}***${email.slice(at)}` : email ? "(not a valid email)" : null;
      const account = at > 0 ? await findAuthByEmail(db, email) : null;
      const profile = account ? await getDoc(db, "users", account.uid) : null;
      return json({
        code: "admin-secrets-v4",
        adminEmailFrom: owner.source,
        adminEmail: masked,
        adminEmailHadSpaces: rawEmail !== rawEmail.trim(),
        adminPasswordSet: rawPassword.trim().length > 0,
        adminPasswordLongEnough: rawPassword.trim().length >= MIN_PASSWORD_LENGTH,
        adminAccountExists: Boolean(account),
        adminAccountRole: (profile?.role as string | undefined) ?? null,
      });
    }
    if (action !== "me") throw new StoreError(404, "not-found", "Unknown action.");
    const session = await getSession(db, request);
    return json({ user: session ? await userPayload(db, session) : null });
  });
}

export async function POST(request: Request, { params }: Params) {
  const { action } = await params;
  return handle(request, async (db) => {
    await ensureAppTables(db);
    const body = await readJson(request);

    switch (action) {
      case "signup": {
        const uid = await inTransaction(db, () =>
          createAccount(db, {
            email: str(body.email),
            password: str(body.password),
            // The register page offers passenger or driver; anything else becomes passenger.
            role: body.role === "driver" ? "driver" : "passenger",
            firstName: str(body.firstName),
            lastName: str(body.lastName),
            phone: str(body.phone),
          })
        );
        await endSession(db, request);
        const session = { uid, anonymous: false };
        const cookie = await startSession(db, request, uid, false);
        return json({ user: await userPayload(db, session) }, 200, [cookie]);
      }

      case "login": {
        const email = normalizeEmail(body.email);
        const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
        const key = `${email}|${ip}`;
        checkLoginAllowed(key);
        // The owner's admin login from GoDaddy Secrets (ADMIN_EMAIL / ADMIN_PASSWORD).
        await ensureOwnerAdmin(db, email, str(body.password));
        const auth = await findAuthByEmail(db, email);
        const ok = auth ? await verifyPassword(str(body.password), auth.password_hash) : false;
        if (!auth || !ok) {
          recordLoginFailure(key);
          throw new StoreError(401, "invalid-credential", "Invalid email or password. Please try again.");
        }
        if (auth.disabled) throw new StoreError(403, "user-disabled", "This account has been disabled.");
        const profile = await getDoc(db, "users", auth.uid);
        if (profile && (profile.status === "suspended" || profile.status === "disabled" || profile.active === false)) {
          throw new StoreError(403, "user-disabled", "This account has been disabled.");
        }
        clearLoginFailures(key);
        await endSession(db, request);
        const cookie = await startSession(db, request, auth.uid, false);
        await db.query("UPDATE `auth_users` SET `last_sign_in_at` = ? WHERE `uid` = ?", [nowUtc(), auth.uid]);
        await touchLogin(db, auth.uid);
        return json({ user: await userPayload(db, { uid: auth.uid, anonymous: false }) }, 200, [cookie]);
      }

      case "logout": {
        await endSession(db, request);
        return json({ ok: true }, 200, [clearSessionCookie(request)]);
      }

      case "guest": {
        const existing = await getSession(db, request);
        if (existing) return json({ user: await userPayload(db, existing) });
        const uid = `anon-${newId(24)}`;
        const cookie = await startSession(db, request, uid, true);
        return json({ user: await userPayload(db, { uid, anonymous: true }) }, 200, [cookie]);
      }

      case "change-password": {
        const session = await requireUser(db, request);
        const auth = await findAuthByUid(db, session.uid);
        if (!auth || !(await verifyPassword(str(body.currentPassword), auth.password_hash))) {
          throw new StoreError(400, "wrong-password", "Your current password is incorrect.");
        }
        await setPassword(db, session.uid, checkNewPassword(body.newPassword));
        await endAllSessions(db, session.uid, request);
        return json({ ok: true });
      }

      case "profile": {
        const session = await requireUser(db, request);
        const profile = await getDoc(db, "users", session.uid);
        if (!profile) throw new StoreError(404, "not-found", "Profile not found.");
        const changes: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        if (typeof body.displayName === "string") {
          const name = body.displayName.trim().slice(0, 200);
          changes.displayName = name;
          await db.query("UPDATE `auth_users` SET `display_name` = ? WHERE `uid` = ?", [name, session.uid]);
        }
        if (typeof body.photoURL === "string") changes.photoURL = body.photoURL.slice(0, 2000);
        await putDoc(db, "users", session.uid, { ...profile, ...changes });
        return json({ user: await userPayload(db, session) });
      }

      case "create-account": {
        const session = await requireUser(db, request);
        if (!(await new Access(db, session).isAdmin())) {
          throw new StoreError(403, "permission-denied", "Only an admin can create driver or operator logins.");
        }
        const role = body.role === "operator" ? "operator" : body.role === "driver" ? "driver" : null;
        if (!role) throw new StoreError(400, "invalid-argument", "Role must be driver or operator.");
        const profile = (body.profile ?? {}) as Record<string, unknown>;
        const extra = body.extra && typeof body.extra === "object" ? (body.extra as Record<string, unknown>) : {};
        const uid = await inTransaction(db, () =>
          createAccount(db, {
            email: str(body.email),
            password: str(body.password),
            role,
            firstName: str(profile.firstName),
            lastName: str(profile.lastName),
            phone: str(profile.phone),
            extra,
          })
        );
        return json({ uid });
      }

      case "reset-request": {
        // Always answer the same way, so this can't be used to find out which emails have accounts.
        let email: string;
        try {
          email = normalizeEmail(body.email);
        } catch {
          return json({ ok: true });
        }
        const auth = await findAuthByEmail(db, email);
        if (auth && !auth.disabled) {
          const token = crypto.randomBytes(32).toString("base64url");
          await db.query(
            "INSERT INTO `password_resets` (`token_hash`, `uid`, `created_at`, `expires_at`) VALUES (?, ?, ?, ?)",
            [sha256(token), auth.uid, nowUtc(), nowUtc(60 * 60 * 1000)]
          );
          const link = `${siteOrigin(request)}/reset-password?token=${encodeURIComponent(token)}`;
          try {
            await sendMail(
              email,
              "Reset your BST Cars password",
              `Use this link to choose a new password (valid for 1 hour):\n\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
              `<p>Use this link to choose a new password (valid for 1 hour):</p><p><a href="${link}">Reset my password</a></p><p>If you didn't ask for this, you can ignore this email.</p>`
            );
          } catch (err) {
            console.error("[auth] could not send reset email:", err);
          }
        }
        return json({ ok: true });
      }

      case "reset-confirm": {
        const token = str(body.token);
        const password = checkNewPassword(body.password);
        const [rows] = await db.query(
          "SELECT `uid` FROM `password_resets` WHERE `token_hash` = ? AND `expires_at` > ? AND `used_at` IS NULL",
          [sha256(token), nowUtc()]
        );
        const row = (rows as { uid: string }[])[0];
        if (!token || !row) {
          throw new StoreError(400, "invalid-token", "This reset link is invalid or has expired. Please request a new one.");
        }
        await setPassword(db, row.uid, password);
        await db.query("UPDATE `password_resets` SET `used_at` = ? WHERE `uid` = ? AND `used_at` IS NULL", [nowUtc(), row.uid]);
        await endAllSessions(db, row.uid);
        return json({ ok: true });
      }

      default:
        throw new StoreError(404, "not-found", "Unknown action.");
    }
  });
}
