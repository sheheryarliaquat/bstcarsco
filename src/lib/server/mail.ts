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

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  if (!isMailConfigured()) {
    console.warn(`[mail] SMTP is not configured; email "${subject}" to ${to} was not sent.`);
    return false;
  }
  const port = Number(process.env.SMTP_PORT || "587");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return true;
}
