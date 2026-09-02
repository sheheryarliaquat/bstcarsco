'use client';

import type { Location, TripType, VehicleType, SpecialRequirements } from '@/types';
import type { PriceBreakdown } from '@/lib/services/pricing';

/**
 * Hand-off between /quotes (where a real quote is generated and picked)
 * and /checkout (where it's paid for and turned into a real Booking).
 * There was previously no mechanism for this at all — "Continue to Book"
 * was a bare link passing zero data, so checkout always showed
 * DEMO_DATA regardless of what the customer actually searched/selected.
 * sessionStorage is enough: it only needs to survive the one navigation.
 */
export interface BookingDraftQuote {
  quoteId: string;
  vehicleId: string;
  operatorId: string;
  operatorName: string;
  vehicleType: VehicleType;
  vehicleDescription: string;
  passengerCapacity: number;
  luggageCapacity: number;
  rating: number;
  totalReviews: number;
  isElectric: boolean;
  isHybrid: boolean;
  paymentTypes: string[];
  estimatedDuration: number;
  /** Final, tax-inclusive price shown on the quote card. */
  price: number;
  breakdown: PriceBreakdown;
}

export interface BookingDraft {
  pickup: Location;
  destination: Location;
  tripType: TripType;
  date: string; // yyyy-MM-dd
  time: string;
  passengers: number;
  luggage: number;
  specialRequirements?: SpecialRequirements;
  distanceMiles: number;
  quote: BookingDraftQuote;
}

const KEY = 'bst_booking_draft';

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private-browsing / quota errors just mean checkout falls back to
    // its empty state — not worth crashing the quote selection over.
  }
}

export function getBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing more to do — a stale draft left behind is harmless.
  }
}
