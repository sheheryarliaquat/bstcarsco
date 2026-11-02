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

// ---------------------------------------------------------------------------
// Covered places — used by the booking search to only offer priced journeys.
// ---------------------------------------------------------------------------

/** A zone that appears in the admin's route fares, e.g. "Central London" → [SW1, W1]. */
export interface PricedPlace {
  label: string;
  areas: string[];
}

function hasAnyPrice(route: RouteFare): boolean {
  return Object.values(route.prices ?? {}).some((p) => typeof p === 'number' && p > 0);
}

function usableRoutes(routes: RouteFare[]): RouteFare[] {
  return routes.filter((r) => r.active && hasAnyPrice(r) && r.fromAreas?.length && r.toAreas?.length);
}

function addPlace(list: PricedPlace[], label: string, areas: string[]): void {
  const name = (label || areas.join(', ')).trim();
  const existing = list.find((p) => p.label.toLowerCase() === name.toLowerCase());
  if (existing) {
    for (const a of areas) if (!existing.areas.includes(a)) existing.areas.push(a);
  } else {
    list.push({ label: name, areas: [...areas] });
  }
}

/** Every zone a journey can start from. Empty when no route fares are set up. */
export function getPickupPlaces(routes: RouteFare[]): PricedPlace[] {
  const places: PricedPlace[] = [];
  for (const r of usableRoutes(routes)) {
    addPlace(places, r.fromLabel, r.fromAreas);
    if (r.bothWays) addPlace(places, r.toLabel, r.toAreas);
  }
  return places;
}

/** Zones that have a fixed fare from this pick-up. */
export function getDropoffPlaces(routes: RouteFare[], pickup: Location): PricedPlace[] {
  const places: PricedPlace[] = [];
  for (const r of usableRoutes(routes)) {
    if (sideMatches(pickup, r.fromAreas)) addPlace(places, r.toLabel, r.toAreas);
    if (r.bothWays && sideMatches(pickup, r.toAreas)) addPlace(places, r.fromLabel, r.fromAreas);
  }
  return places;
}

/** Is this location inside one of the given zones? */
export function locationInPlaces(loc: Location, places: PricedPlace[]): boolean {
  return places.some((p) => sideMatches(loc, p.areas));
}
