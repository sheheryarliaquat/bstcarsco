'use client';

import { getDocument, batchSet } from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import type { BookingExtrasPricing } from '@/types';

const SETTINGS_COLLECTION = 'settings';
const EXTRAS_DOC_ID = 'bookingExtras';
const LOCAL_EXTRAS_KEY = 'bst_booking_extras';

/** Extras are free until an admin sets a price. */
export const DEFAULT_EXTRAS_PRICING: BookingExtrasPricing = {
  meetAndGreet: 0,
  childSeat: 0,
  returnDiscountPercent: 0,
};

function normalise(p: Partial<BookingExtrasPricing> | null | undefined): BookingExtrasPricing {
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback);
  return {
    meetAndGreet: num(p?.meetAndGreet, DEFAULT_EXTRAS_PRICING.meetAndGreet),
    childSeat: num(p?.childSeat, DEFAULT_EXTRAS_PRICING.childSeat),
    returnDiscountPercent: Math.min(num(p?.returnDiscountPercent, 0), 100),
  };
}

function readLocal(): BookingExtrasPricing {
  if (typeof window === 'undefined') return DEFAULT_EXTRAS_PRICING;
  try {
    return normalise(JSON.parse(localStorage.getItem(LOCAL_EXTRAS_KEY) || 'null'));
  } catch {
    return DEFAULT_EXTRAS_PRICING;
  }
}

function writeLocal(p: BookingExtrasPricing): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_EXTRAS_KEY, JSON.stringify(p));
  } catch {
    // Ignore — pricing still applies for this page view.
  }
}

export async function getExtrasPricing(): Promise<BookingExtrasPricing> {
  if (!isFirebaseConfigured()) return readLocal();
  try {
    const doc = await getDocument<Partial<BookingExtrasPricing>>(SETTINGS_COLLECTION, EXTRAS_DOC_ID);
    const pricing = normalise(doc);
    writeLocal(pricing);
    return pricing;
  } catch (err) {
    console.error('getExtrasPricing: using local copy —', err);
    return readLocal();
  }
}

export async function saveExtrasPricing(pricing: BookingExtrasPricing): Promise<void> {
  const clean = normalise(pricing);
  writeLocal(clean);
  if (!isFirebaseConfigured()) return;
  await batchSet([{ collectionName: SETTINGS_COLLECTION, id: EXTRAS_DOC_ID, data: { ...clean } }]);
}

export interface ExtrasChoice {
  isReturn: boolean;
  meetAndGreet: boolean;
  childSeat: boolean;
}

export interface JourneyPriceLine {
  label: string;
  amount: number;
}

export interface JourneyPrice {
  /** Price of one trip, before extras. */
  fare: number;
  lines: JourneyPriceLine[];
  /** Fare (both legs for a return) plus extras, before VAT. */
  subtotal: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Work out the price of a journey including return leg and extras. */
export function calculateJourneyPrice(
  fare: number,
  choice: ExtrasChoice,
  pricing: BookingExtrasPricing
): JourneyPrice {
  const lines: JourneyPriceLine[] = [];
  if (choice.isReturn) {
    lines.push({ label: 'Outward journey', amount: round2(fare) });
    lines.push({ label: 'Return journey', amount: round2(fare) });
    if (pricing.returnDiscountPercent > 0) {
      lines.push({
        label: `Return discount (${pricing.returnDiscountPercent}%)`,
        amount: -round2(fare * 2 * (pricing.returnDiscountPercent / 100)),
      });
    }
  } else {
    lines.push({ label: 'Journey fare', amount: round2(fare) });
  }
  // Extras are charged on each leg of the trip.
  const legs = choice.isReturn ? 2 : 1;
  if (choice.meetAndGreet) {
    lines.push({ label: legs > 1 ? 'Meet & greet (×2)' : 'Meet & greet', amount: round2(pricing.meetAndGreet * legs) });
  }
  if (choice.childSeat) {
    lines.push({ label: legs > 1 ? 'Child seat (×2)' : 'Child seat', amount: round2(pricing.childSeat * legs) });
  }
  const subtotal = round2(lines.reduce((n, l) => n + l.amount, 0));
  return { fare: round2(fare), lines, subtotal };
}
