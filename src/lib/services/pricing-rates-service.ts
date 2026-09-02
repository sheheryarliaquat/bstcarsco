'use client';

import { getDocument, setDocument } from '@/lib/firebase/firestore';
import type { VehicleType } from '@/types';

export interface VehicleTypeRate {
  baseFare: number;
  perMile: number;
  perMinute: number;
  minimumFare: number;
  bookingFee: number;
}

export type VehicleRateMap = Partial<Record<VehicleType, VehicleTypeRate>>;

const COLLECTION = 'settings';
const DOC_ID = 'pricingRates';

/**
 * The single admin-configured pricing doc used by both the Admin Vehicles
 * page (to edit) and the public /api/quotes route (to price real quotes).
 * Missing vehicle types simply fall back to built-in defaults wherever
 * this is read — this doc only needs to hold overrides.
 */
export async function getPricingRates(): Promise<VehicleRateMap> {
  const doc = await getDocument<{ rates?: VehicleRateMap }>(COLLECTION, DOC_ID);
  return doc?.rates ?? {};
}

export async function savePricingRates(rates: VehicleRateMap): Promise<void> {
  await setDocument(COLLECTION, DOC_ID, { rates });
}
