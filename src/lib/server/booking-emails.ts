// Booking emails to the customer (server only).
//
// Called by the data API (src/app/api/db/[action]/route.ts) after a write
// commits: when an admin accepts a booking (its status becomes "confirmed"),
// the customer gets a confirmation email with the journey and price.
// Uses the SMTP settings described in ./mail.ts; without them nothing is sent.

import type { Db } from "@/lib/mysql/db";
import { getDoc, putDoc, type DocData } from "@/lib/server/docstore";
import { isMailConfigured, sendMail } from "@/lib/server/mail";

const CONFIRMED = "confirmed";

/** True when this write moved the booking into "confirmed". */
export function becameConfirmed(before: DocData | null, after: DocData): boolean {
  return after.bookingStatus === CONFIRMED && before?.bookingStatus !== CONFIRMED;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(v: unknown): string {
  return `£${num(v).toFixed(2)}`;
}

function address(loc: unknown): string {
  if (!loc || typeof loc !== "object") return "";
  const l = loc as Record<string, unknown>;
  return str(l.formattedAddress) || [str(l.address), str(l.postcode)].filter(Boolean).join(", ");
}

function journeyDate(v: unknown): string {
  const d = new Date(str(v));
  if (!str(v) || Number.isNaN(d.getTime())) return str(v);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
}

function label(v: unknown): string {
  return str(v)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function recipient(db: Db, booking: DocData): Promise<{ email: string; name: string }> {
  const details = (booking.passengerDetails ?? {}) as Record<string, unknown>;
  let email = str(details.email).trim();
  let name = [str(details.firstName), str(details.lastName)].filter(Boolean).join(" ");
  const passengerId = str(booking.passengerId);
  if ((!email || !name) && passengerId && !passengerId.startsWith("guest-")) {
    const user = await getDoc(db, "users", passengerId);
    if (user) {
      if (!email) email = str(user.email).trim();
      if (!name) name = str(user.displayName) || [str(user.firstName), str(user.lastName)].filter(Boolean).join(" ");
    }
  }
  return { email, name };
}

function buildEmail(booking: DocData, name: string) {
  const ref = str(booking.bookingNumber);
  const req = (booking.specialRequirements ?? {}) as Record<string, unknown>;
  const rows: [string, string][] = [
    ["Booking reference", ref],
    ["Pickup", address(booking.pickup)],
    ["Destination", address(booking.destination)],
    ["Date", journeyDate(booking.date)],
    ["Pickup time", str(booking.pickupTime)],
  ];
  if (str(booking.returnDate)) {
    rows.push(["Return", `${journeyDate(booking.returnDate)} ${str(booking.returnTime)}`.trim()]);
  }
  rows.push(
    ["Vehicle", label(booking.vehicleType)],
    ["Passengers", String(num(booking.passengers))],
    ["Luggage", String(num(booking.luggage))]
  );
  if (str(req.flightNumber)) rows.push(["Flight number", str(req.flightNumber)]);
  if (str(req.notes)) rows.push(["Notes", str(req.notes)]);

  const priceRows: [string, string][] = [["Fare", money(booking.price)]];
  if (num(booking.discount) > 0) priceRows.push(["Discount", `-${money(booking.discount)}`]);
  if (num(booking.tax) > 0) priceRows.push(["Tax", money(booking.tax)]);
  priceRows.push(["Total", money(booking.total)]);

  const paid = booking.paymentStatus === "completed";
  const payment =
    booking.paymentMethod === "cash"
      ? `Payment: cash, ${money(booking.total)} to pay the driver.`
      : paid
        ? "Payment: paid by card."
        : `Payment: ${label(booking.paymentMethod) || "to be arranged"}.`;

  const greeting = name ? `Dear ${name},` : "Hello,";
  const intro = "Your booking with BST Cars has been accepted and confirmed. Your journey details are below.";
  const outro =
    "We'll send your driver's details before pickup. If anything needs changing, just reply to this email and quote your booking reference.";

  const text = [
    greeting,
    "",
    intro,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    ...priceRows.map(([k, v]) => `${k}: ${v}`),
    payment,
    "",
    outro,
    "",
    "BST Cars",
  ].join("\n");

  const tr = ([k, v]: [string, string], bold = false) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#5B6577;vertical-align:top;white-space:nowrap">${esc(k)}</td>` +
    `<td style="padding:6px 0;color:#0F1B2D;${bold ? "font-weight:bold" : ""}">${esc(v)}</td></tr>`;

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#F4F6F9;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#0F1B2D;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">Booking confirmed</h1>
    <p style="margin:4px 0 0;font-size:14px;color:#C9D3E6">Reference ${esc(ref)}</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;font-size:14px;line-height:1.5;color:#0F1B2D">
    <p style="margin-top:0">${esc(greeting)}</p>
    <p>${esc(intro)}</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">${rows.map((r) => tr(r)).join("")}</table>
    <table style="border-collapse:collapse;width:100%;margin:16px 0;border-top:1px solid #E5E7EB">
      ${priceRows.map((r, i) => tr(r, i === priceRows.length - 1)).join("")}
    </table>
    <p>${esc(payment)}</p>
    <p>${esc(outro)}</p>
    <p style="margin-bottom:0">BST Cars</p>
  </div>
</div></body></html>`;

  return { subject: `Booking confirmed – ${ref}`, text, html };
}

/**
 * Email the customer that their booking is confirmed, then stamp the booking
 * with `confirmationEmailSentAt`. Never throws — a mail failure must not undo
 * or fail the admin's action.
 */
export async function sendBookingConfirmedEmail(db: Db, bookingId: string): Promise<void> {
  try {
    if (!isMailConfigured()) {
      console.warn(`[booking-email] SMTP is not configured; no confirmation sent for booking ${bookingId}.`);
      return;
    }
    const booking = await getDoc(db, "bookings", bookingId);
    if (!booking || booking.bookingStatus !== CONFIRMED || booking.confirmationEmailSentAt) return;

    const { email, name } = await recipient(db, booking);
    if (!email) {
      console.warn(`[booking-email] booking ${bookingId} has no customer email; confirmation not sent.`);
      return;
    }

    const { subject, text, html } = buildEmail(booking, name);
    if (await sendMail(email, subject, text, html)) {
      await putDoc(db, "bookings", bookingId, { ...booking, confirmationEmailSentAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error(`[booking-email] could not send confirmation for booking ${bookingId}:`, err);
  }
}
