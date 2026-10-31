'use client';

import { getDocument, batchSet } from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { UK_AIRPORTS } from '@/constants';
import type { Location, RouteFare, VehicleType } from '@/types';

const SETTINGS_COLLECTION = 'settings';
const ROUTE_FARES_DOC_ID = 'routeFares';
const LOCAL_ROUTE_FARES_KEY = 'bst_route_fares';

function readLocal(): RouteFare[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ROUTE_FARES_KEY) || '[]') as RouteFare[];
  } catch {
    return [];
  }
}

function writeLocal(routes: RouteFare[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ROUTE_FARES_KEY, JSON.stringify(routes));
  } catch {
    // Storage full or blocked — the in-memory list is still returned to the caller.
  }
}

/** Load the admin's fixed route fares. Falls back to the local copy when Firebase is unavailable. */
export async function getRouteFares(): Promise<RouteFare[]> {
  if (!isFirebaseConfigured()) return readLocal();
  try {
    const doc = await getDocument<{ routes: RouteFare[] }>(SETTINGS_COLLECTION, ROUTE_FARES_DOC_ID);
    const routes = doc?.routes ?? [];
    writeLocal(routes);
    return routes;
  } catch (err) {
    console.error('getRouteFares: using local copy —', err);
    return readLocal();
  }
}

/** Save the full list of route fares. Always keeps a local copy so demo mode works. */
export async function saveRouteFares(routes: RouteFare[]): Promise<void> {
  writeLocal(routes);
  if (!isFirebaseConfigured()) return;
  await batchSet([
    { collectionName: SETTINGS_COLLECTION, id: ROUTE_FARES_DOC_ID, data: { routes } },
  ]);
}

export function newRouteFareId(): string {
  return `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Split "SW1, W1; Oxford" into clean tokens. */
export function parseAreas(input: string): string[] {
  return input
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const AIRPORT_ONLY_DISTRICTS = new Set(['TW6']);

function outwardCode(postcode: string): string {
  const compact = (postcode || '').toUpperCase().replace(/\s+/g, '');
  if (compact.length < 5) return compact;
  return compact.slice(0, -3);
}

function airportKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !['london', 'airport', 'international'].includes(w));
}

/** Does a location fall inside one area token (postcode prefix, airport code or town name)? */
export function locationMatchesArea(loc: Location, token: string): boolean {
  const t = token.trim().toUpperCase();
  if (!t) return false;
  const address = `${loc.formattedAddress ?? ''} ${loc.city ?? ''}`.toLowerCase();
  const outward = outwardCode(loc.postcode);

  const airport = UK_AIRPORTS.find((a) => a.code === t);
  if (airport) {
    // Only districts that contain nothing but the airport can match on postcode alone
    // (E16, RH6, LU2 and CM24 also cover homes and towns near the airport).
    if (outward && AIRPORT_ONLY_DISTRICTS.has(outward) && outward === airport.postcode.toUpperCase()) return true;
    if (new RegExp(`\\b${airport.code.toLowerCase()}\\b`).test(address)) return true;
    // Name match needs "airport" too, so "City of London" isn't taken for London City Airport.
    const words = airportKeywords(airport.name);
    return words.length > 0 && address.includes('airport') && words.every((w) => address.includes(w));
  }

  if (/^[A-Z]{1,2}\d/.test(t)) {
    // District prefix such as "SW1" or "RG4": SW1A matches SW1, SW10 does not.
    if (!outward) return false;
    if (outward === t) return true;
    return outward.startsWith(t) && /^[A-Z]$/.test(outward.charAt(t.length));
  }

  if (/^[A-Z]{1,2}$/.test(t)) {
    // Postcode area letters such as "W" or "RG".
    const letters = outward.match(/^[A-Z]{1,2}/)?.[0] ?? '';
    if (letters === t) return true;
  }

  // Otherwise treat it as a town or place name.
  return t.length > 2 && address.includes(token.trim().toLowerCase());
}

function sideMatches(loc: Location, areas: string[]): boolean {
  return areas.some((a) => locationMatchesArea(loc, a));
}

/** Find the fixed fare for this journey and car type, if the admin has set one. */
export function findRouteFare(
  routes: RouteFare[],
  pickup: Location,
  destination: Location,
  vehicleType: VehicleType
): { route: RouteFare; price: number } | null {
  for (const route of routes) {
    if (!route.active) continue;
    const price = route.prices?.[vehicleType];
    if (typeof price !== 'number' || !(price > 0)) continue;
    const forward = sideMatches(pickup, route.fromAreas) && sideMatches(destination, route.toAreas);
    const reverse =
      route.bothWays && sideMatches(pickup, route.toAreas) && sideMatches(destination, route.fromAreas);
    if (forward || reverse) return { route, price };
  }
  return null;
}
