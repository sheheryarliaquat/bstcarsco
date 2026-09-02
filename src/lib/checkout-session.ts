'use client';

import type { BookingSearchParams } from '@/components/booking/BookingSearch';
import type { Quote } from '@/types';

const KEY = 'bst_checkout_selection';

export interface CheckoutSelection {
  quote: Quote;
  search: BookingSearchParams;
}

export function saveCheckoutSelection(selection: CheckoutSelection): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(selection));
  } catch {
    // sessionStorage unavailable — checkout page will redirect back to /quotes.
  }
}

export function getCheckoutSelection(): CheckoutSelection | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutSelection;
    if (parsed.search.date) {
      parsed.search.date = new Date(parsed.search.date);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutSelection(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
