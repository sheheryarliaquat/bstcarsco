// Outgoing email (server only), used for password-reset links.
//
// Sends through any SMTP server (e.g. GoDaddy / Microsoft 365 / Gmail
// mailbox) when these are set in GoDaddy -> Settings -> Secrets:
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_FROM
// Without them, emails are not sent and a warning is logged instead.

import nodemailer from "nodemailer";

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
  if (!isMailConfigured()) {
    console.warn(`[mail] SMTP is not configured; email "${subject}" to ${to} was not sent.`);
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
