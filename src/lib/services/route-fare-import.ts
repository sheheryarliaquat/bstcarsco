import { UK_AIRPORTS } from '@/constants';
import type { RouteFare, VehicleType } from '@/types';

export interface WorkbookSheet {
  sheet: string;
  data: unknown[][];
}

export interface RouteFareImportResult {
  routes: RouteFare[];
  zones: number;
  prices: number;
  warnings: string[];
}

function cell(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(cell(v).replace(/[£,\s]/g, ''));
  return cell(v) && Number.isFinite(n) ? n : null;
}

function findSheet(sheets: WorkbookSheet[], ...names: string[]): WorkbookSheet | undefined {
  const wanted = names.map((n) => n.toLowerCase());
  return sheets.find((s) => wanted.includes(s.sheet.trim().toLowerCase()));
}

/** "Heathrow Airport" → "LHR", "London City Airport" → "LCY". */
function airportCodeFor(zone: string): string | null {
  const z = zone.toLowerCase();
  if (!z.includes('airport') && !UK_AIRPORTS.some((a) => a.code.toLowerCase() === z)) return null;
  const direct = UK_AIRPORTS.find((a) => a.code.toLowerCase() === z);
  if (direct) return direct.code;
  // Most specific name first so "London City" doesn't fall through to a shorter match.
  const byName = [...UK_AIRPORTS]
    .map((a) => ({ a, key: a.name.toLowerCase().replace(/\b(london|airport|international)\b/g, '').trim() }))
    .filter((x) => x.key && z.includes(x.key))
    .sort((x, y) => y.key.length - x.key.length)[0];
  return byName?.a.code ?? null;
}

/**
 * Turn a "zone to zone" rates workbook into route fares.
 *
 * Expects a "Postcodes" sheet (postcode district or place → zone name) and a
 * "Rate List" sheet (From zone, To zone, Rate) — the layout of the London
 * postcode rates template. A "Rate Matrix" sheet (From = row, To = column)
 * is used when there is no Rate List. Airport zones are recognised by name.
 */
export function parseRouteFareWorkbook(
  sheets: WorkbookSheet[],
  vehicleType: VehicleType,
  newId: () => string
): RouteFareImportResult {
  const warnings: string[] = [];

  // Zone → area tokens
  const zoneAreas = new Map<string, Set<string>>();
  const postcodes = findSheet(sheets, 'Postcodes', 'Zones');
  if (postcodes) {
    for (const row of postcodes.data) {
      const place = cell(row[0]);
      const zone = cell(row[1]);
      if (!place || !zone || /^postcode/i.test(place)) continue;
      if (!zoneAreas.has(zone)) zoneAreas.set(zone, new Set());
      zoneAreas.get(zone)!.add(place.toUpperCase().length <= 4 ? place.toUpperCase() : place);
    }
  } else {
    warnings.push('No "Postcodes" sheet found, so zones only match by their airport code.');
  }

  // Pair → price
  const prices = new Map<string, { from: string; to: string; price: number }>();
  const addPrice = (from: string, to: string, price: number | null) => {
    if (!from || !to || price === null || price <= 0) return;
    prices.set(`${from}\u0000${to}`, { from, to, price: Math.round(price * 100) / 100 });
  };

  const list = findSheet(sheets, 'Rate List', 'Rates');
  const matrix = findSheet(sheets, 'Rate Matrix', 'Matrix');
  if (list) {
    const header = list.data.findIndex((r) => cell(r[0]).toLowerCase() === 'from' && cell(r[1]).toLowerCase() === 'to');
    for (const row of list.data.slice(header + 1)) addPrice(cell(row[0]), cell(row[1]), num(row[2]));
  } else if (matrix) {
    const header = matrix.data.findIndex((r) => /from/i.test(cell(r[0])) && r.slice(1).some((c) => cell(c)));
    const cols = (matrix.data[header] ?? []).map(cell);
    for (const row of matrix.data.slice(header + 1)) {
      const from = cell(row[0]);
      for (let i = 1; i < cols.length; i++) addPrice(from, cols[i], num(row[i]));
    }
  } else {
    throw new Error('The workbook needs a "Rate List" or "Rate Matrix" sheet.');
  }
  if (prices.size === 0) throw new Error('No prices found in the workbook.');

  const areasFor = (zone: string): string[] => {
    const tokens = new Set(zoneAreas.get(zone) ?? []);
    const code = airportCodeFor(zone);
    if (code) tokens.add(code);
    if (tokens.size === 0) warnings.push(`Zone "${zone}" has no postcodes listed, so it will never match.`);
    return [...tokens];
  };

  // One route per pair; a pair priced the same both ways becomes a single two-way route.
  const routes: RouteFare[] = [];
  const done = new Set<string>();
  for (const { from, to, price } of prices.values()) {
    const key = `${from}\u0000${to}`;
    if (done.has(key)) continue;
    done.add(key);
    const reverse = prices.get(`${to}\u0000${from}`);
    const bothWays = from === to || (reverse !== undefined && reverse.price === price);
    if (bothWays) done.add(`${to}\u0000${from}`);
    routes.push({
      id: newId(),
      fromLabel: from,
      fromAreas: areasFor(from),
      toLabel: to,
      toAreas: areasFor(to),
      prices: { [vehicleType]: price },
      bothWays,
      active: true,
    });
  }

  // Airport routes first, so an airport inside a London zone (e.g. London City in E16) uses its own fare.
  const isAirport = (r: RouteFare) => Boolean(airportCodeFor(r.fromLabel) || airportCodeFor(r.toLabel));
  routes.sort((a, b) => Number(isAirport(b)) - Number(isAirport(a)));

  return { routes, zones: new Set([...prices.values()].flatMap((p) => [p.from, p.to])).size, prices: prices.size, warnings: [...new Set(warnings)] };
}

/**
 * Merge imported routes into the existing list: a route with the same two
 * zones (either direction) gets this car type's price; anything else is added.
 */
export function mergeRouteFares(existing: RouteFare[], imported: RouteFare[], vehicleType: VehicleType): RouteFare[] {
  const result = existing.map((r) => ({ ...r, prices: { ...r.prices } }));
  const keyOf = (a: string, b: string) => `${a.toLowerCase()}\u0000${b.toLowerCase()}`;
  for (const route of imported) {
    const match = result.find(
      (r) =>
        keyOf(r.fromLabel, r.toLabel) === keyOf(route.fromLabel, route.toLabel) ||
        (r.bothWays && route.bothWays && keyOf(r.fromLabel, r.toLabel) === keyOf(route.toLabel, route.fromLabel))
    );
    if (match) {
      match.prices[vehicleType] = route.prices[vehicleType];
      match.fromAreas = route.fromAreas;
      match.toAreas = route.toAreas;
    } else {
      result.push(route);
    }
  }
  const isAirportRoute = (r: RouteFare) =>
    [...r.fromAreas, ...r.toAreas].some((t) => UK_AIRPORTS.some((a) => a.code === t.toUpperCase()));
  return result.sort((a, b) => Number(isAirportRoute(b)) - Number(isAirportRoute(a)));
}
