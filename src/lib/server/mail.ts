// Outgoing email (server only): booking confirmations and password-reset links.
//
// On GoDaddy Node.js Hosting, mail goes through the platform's built-in email
// gateway (./email-gateway.ts) — no SMTP login needed, sent from the app's
// address on bstcars.co. Replies go to SMTP_FROM (e.g. booking@bstcars.co)
// when that secret is set.
//
// Where the gateway isn't available (e.g. running locally), it falls back to
// an SMTP server when these are set in GoDaddy -> Settings -> Secrets:
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_FROM
// With neither, emails are not sent and a warning is logged instead.

import nodemailer from "nodemailer";
import { GatewayUnavailableError, isGatewayReachable, sendViaGateway } from "@/lib/server/email-gateway";

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || "587");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER?.trim(), pass: process.env.SMTP_PASS },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });
}

/**
 * Setup check: connects and logs in to the SMTP server without sending
 * anything. Never returns the password.
 */
export async function checkMail(): Promise<Record<string, unknown>> {
  const user = process.env.SMTP_USER?.trim() ?? "";
  const at = user.indexOf("@");
  const info: Record<string, unknown> = {
    smtpHost: process.env.SMTP_HOST?.trim() || null,
    smtpPort: process.env.SMTP_PORT || "587 (default)",
    smtpUser: at > 0 ? `${user[0]}***${user.slice(at)}` : user ? "(set)" : null,
    smtpPassSet: Boolean(process.env.SMTP_PASS),
    smtpFrom: process.env.SMTP_FROM || null,
    configured: isMailConfigured(),
  };
  if (await isGatewayReachable()) {
    return { ...info, gateway: "reachable", sendsVia: "godaddy-email-gateway", login: "ok" };
  }
  info.gateway = "not reachable";
  info.sendsVia = isMailConfigured() ? "smtp" : "none";
  if (!isMailConfigured()) return { ...info, login: "skipped: SMTP_HOST, SMTP_USER or SMTP_PASS is missing" };
  try {
    await createTransport().verify();
    return { ...info, login: "ok" };
  } catch (err) {
    const e = err as { code?: string; responseCode?: number; response?: string; message?: string };
    return {
      ...info,
      login: "failed",
      error: [e.code, e.responseCode, e.response || e.message].filter(Boolean).join(" | "),
    };
  }
}

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const replyTo = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || undefined;
  try {
    try {
      await sendViaGateway({ to, subject, text, html, from: replyTo, replyTo });
    } catch (err) {
      // The gateway rejects a sender it hasn't verified with HTTP 400; retry
      // with the app's own sender address (replies still go to replyTo).
      if (replyTo && (err as { status?: number }).status === 400) {
        console.warn(`[mail] gateway rejected sender ${replyTo}; sending from the app's default address.`, err);
        await sendViaGateway({ to, subject, text, html, replyTo });
      } else {
        throw err;
      }
    }
    return true;
  } catch (err) {
    if (!(err instanceof GatewayUnavailableError)) throw err;
  }

  if (!isMailConfigured()) {
    console.warn(`[mail] No email gateway or SMTP settings; email "${subject}" to ${to} was not sent.`);
    return false;
  }
  await createTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER?.trim(),
    to,
    subject,
    text,
    html,
  });
  return true;
}
