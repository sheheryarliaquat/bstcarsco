'use client';

import { getDocument, batchSet } from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';

const SETTINGS_COLLECTION = 'settings';
const PRICING_DOC_ID = 'pricingSettings';
const LOCAL_KEY = 'bst_pricing_settings';

export interface PricingSettings {
  commission: {
    percent: number;
    flatFee: number;
  };
  surcharges: {
    night: number;
    weekend: number;
    peak: number;
    airport: number;
    congestion: number;
  };
  globalMinimumFare: number;
}

/** Values shown until an admin saves their own on the Pricing page. */
export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  commission: { percent: 15, flatFee: 0.5 },
  surcharges: { night: 20, weekend: 10, peak: 25, airport: 5, congestion: 15 },
  globalMinimumFare: 5,
};

function num(v: unknown, fallback: number, max?: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return fallback;
  return max !== undefined ? Math.min(v, max) : v;
}

function normalise(p: Partial<PricingSettings> | null | undefined): PricingSettings {
  const d = DEFAULT_PRICING_SETTINGS;
  const c = p?.commission ?? ({} as Partial<PricingSettings['commission']>);
  const s = p?.surcharges ?? ({} as Partial<PricingSettings['surcharges']>);
  return {
    commission: {
      percent: num(c.percent, d.commission.percent, 100),
      flatFee: num(c.flatFee, d.commission.flatFee),
    },
    surcharges: {
      night: num(s.night, d.surcharges.night, 100),
      weekend: num(s.weekend, d.surcharges.weekend, 100),
      peak: num(s.peak, d.surcharges.peak, 100),
      airport: num(s.airport, d.surcharges.airport),
      congestion: num(s.congestion, d.surcharges.congestion),
    },
    globalMinimumFare: num(p?.globalMinimumFare, d.globalMinimumFare),
  };
}

function readLocal(): PricingSettings {
  if (typeof window === 'undefined') return DEFAULT_PRICING_SETTINGS;
  try {
    return normalise(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'));
  } catch {
    return DEFAULT_PRICING_SETTINGS;
  }
}

function writeLocal(p: PricingSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  } catch {
    // Ignore — the database copy is the one that matters.
  }
}

export async function getPricingSettings(): Promise<PricingSettings> {
  if (!isFirebaseConfigured()) return readLocal();
  try {
    const doc = await getDocument<Partial<PricingSettings>>(SETTINGS_COLLECTION, PRICING_DOC_ID);
    const settings = normalise(doc);
    writeLocal(settings);
    return settings;
  } catch (err) {
    console.error('getPricingSettings: using local copy —', err);
    return readLocal();
  }
}

export async function savePricingSettings(settings: PricingSettings): Promise<PricingSettings> {
  const clean = normalise(settings);
  writeLocal(clean);
  if (isFirebaseConfigured()) {
    await batchSet([{ collectionName: SETTINGS_COLLECTION, id: PRICING_DOC_ID, data: { ...clean } }]);
  }
  return clean;
}
