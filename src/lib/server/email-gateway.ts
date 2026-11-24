// GoDaddy Node.js Hosting email gateway (server only).
//
// On GoDaddy's Node.js Hosting the app sends mail by posting JSON to a
// gateway that the platform runs on 127.0.0.1:2525 inside the app's own
// container (GoDaddy -> app -> Settings -> Email). No SMTP login is needed and
// the mail goes out from the app's address on bstcars.co, signed with the
// domain's DKIM/SPF/DMARC records. Outgoing SMTP connections from the app
// (e.g. to smtpout.secureserver.net) are not reliable there, so this is the
// primary way the site sends email. Adapted from GoDaddy's sendEmail helper.

import net from "node:net";

const GATEWAY_HOST = "127.0.0.1";
const GATEWAY_PORT = 2525;
const EMAIL_GATEWAY_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}/api/email/send`;
const REQUEST_TIMEOUT_MS = 30_000;

export type GatewayEmail = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  /** Must be an address on a verified domain (bstcars.co); omit to use the app's own sender. */
  from?: string;
};

type GatewayResponse = { success: boolean; messageId?: string; error?: string };

/** Thrown when nothing is listening on the gateway port (e.g. running locally). */
export class GatewayUnavailableError extends Error {}

/** True when the gateway port accepts connections (quick check, sends nothing). */
export function isGatewayReachable(timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: GATEWAY_HOST, port: GATEWAY_PORT });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

/** Sends one email through the gateway and returns the gateway's message id. */
export async function sendViaGateway(input: GatewayEmail): Promise<string> {
  const payload: Record<string, unknown> = {
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
  };
  if (input.text) payload.text = input.text;
  if (input.html) payload.html = input.html;
  if (input.replyTo) payload.replyTo = input.replyTo;
  if (input.from) payload.from = input.from;

  let response: Response;
  let body: GatewayResponse;
  try {
    response = await fetch(EMAIL_GATEWAY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new GatewayUnavailableError(`email gateway unreachable: ${describe(err)}`);
  }
  try {
    body = (await response.json()) as GatewayResponse;
  } catch {
    body = { success: false, error: `non-JSON response (HTTP ${response.status})` };
  }

  if (!response.ok || !body.success) {
    const id = body.messageId ? ` (messageId=${body.messageId})` : "";
    const err = new Error(`email send failed: ${body.error ?? `HTTP ${response.status}`}${id}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }
  if (!body.messageId) throw new Error("email send succeeded but gateway returned no messageId");
  return body.messageId;
}

function describe(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: { code?: string } }).cause;
    if (err.name === "AbortError" || err.name === "TimeoutError") return `timed out after ${REQUEST_TIMEOUT_MS}ms`;
    return cause?.code ? `${err.message} (${cause.code})` : err.message;
  }
  return String(err);
}
