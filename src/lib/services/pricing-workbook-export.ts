// Builds the all-in-one pricing workbook (same layout that
// parsePricingWorkbook reads), so the admin can download the current prices,
// edit them in Excel and upload the file again.

import { VEHICLE_TYPES } from '@/constants';
import type { RouteFare } from '@/types';
import type { MileageRate } from './route-fare-import';

type Cell = string | number | null | { value: string | number | null; fontWeight?: 'bold'; format?: string; type?: NumberConstructor | StringConstructor };
type Row = Cell[];

export interface PricingSheet {
  sheet: string;
  data: Row[];
  columns: { width: number }[];
}

const bold = (value: string): Cell => ({ value, fontWeight: 'bold' });
const money = (value: number | undefined): Cell =>
  value === undefined ? null : { value, type: Number, format: '£#,##0.00' };

export function buildPricingWorkbookSheets(routes: RouteFare[], rates: MileageRate[]): PricingSheet[] {
  const types = VEHICLE_TYPES;

  // Route Fares: one row per direction (a route that works both ways gets both rows).
  const fareRows: Row[] = [[bold('From'), bold('To'), ...types.map((t) => bold(t.label))]];
  for (const r of routes) {
    if (r.active === false) continue;
    const prices = types.map((t) => money(r.prices[t.value]));
    fareRows.push([r.fromLabel, r.toLabel, ...prices]);
    if (r.bothWays && r.fromLabel !== r.toLabel) fareRows.push([r.toLabel, r.fromLabel, ...prices]);
  }

  // Postcodes: every area token of every zone, plus the zone list for dropdowns.
  const zoneOf = new Map<string, string>();
  const zones: string[] = [];
  const addZone = (label: string, areas: string[]) => {
    if (!zones.includes(label)) zones.push(label);
    for (const a of areas) if (!zoneOf.has(a)) zoneOf.set(a, label);
  };
  for (const r of routes) {
    addZone(r.fromLabel, r.fromAreas);
    addZone(r.toLabel, r.toAreas);
  }
  zones.sort((a, b) => a.localeCompare(b));
  const postcodeRows: Row[] = [[bold('Postcode / Place'), bold('Zone'), null, bold('Zones (dropdown list)')]];
  const entries = [...zoneOf.entries()];
  const height = Math.max(entries.length, zones.length);
  for (let i = 0; i < height; i++) {
    const e = entries[i];
    postcodeRows.push([e?.[0] ?? null, e?.[1] ?? null, null, zones[i] ?? null]);
  }

  // Per Mile Rates.
  const rateRows: Row[] = [
    ['Car type', 'Base fare', 'Per mile', 'Per minute', 'Minimum fare', 'Booking fee'].map(bold),
    ...types.map((t) => {
      const r = rates.find((x) => x.vehicleType === t.value);
      return [t.label, money(r?.baseFare), money(r?.perMile), money(r?.perMinute), money(r?.minimumFare), money(r?.bookingFee)];
    }),
  ];

  const howTo: Row[] = [
    [bold('BST Cars – pricing workbook (all car types, whole UK)')],
    [`Downloaded ${new Date().toISOString().slice(0, 10)} from Admin → Pricing.`],
    [''],
    ['• London: a journey between two zones in "Route Fares" gets that fixed fare for the chosen car type.'],
    ['• Everywhere else in the UK: priced per mile using "Per Mile Rates".'],
    ['• Each direction is its own row in "Route Fares" (A → B and B → A). Leave a price blank if that car type is not offered.'],
    ['• Add areas in "Postcodes": postcode district (e.g. SW19) or place name, and its zone.'],
    ['• Upload this file in Admin → Pricing → Import from a spreadsheet, check the summary, then click "Save route fares".'],
    ['• Uploading REPLACES all fixed route fares and per-mile rates with what is in the file.'],
    ["• Don't rename the sheets or header rows."],
  ];

  return [
    { sheet: 'How to use', data: howTo, columns: [{ width: 110 }] },
    { sheet: 'Route Fares', data: fareRows, columns: [{ width: 28 }, { width: 28 }, ...types.map(() => ({ width: 13 }))] },
    { sheet: 'Postcodes', data: postcodeRows, columns: [{ width: 24 }, { width: 28 }, { width: 3 }, { width: 30 }] },
    { sheet: 'Per Mile Rates', data: rateRows, columns: [{ width: 24 }, ...Array.from({ length: 5 }, () => ({ width: 13 }))] },
  ];
}

/** Downloads the current prices as an .xlsx file (browser only). */
export async function downloadPricingWorkbook(routes: RouteFare[], rates: MileageRate[]): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const sheets = buildPricingWorkbookSheets(routes, rates);
  const name = `BST_Cars_Pricing_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await writeXlsxFile(
    sheets.map((s) => ({ sheet: s.sheet, data: s.data as never, columns: s.columns })),
    { fontFamily: 'Arial' }
  ).toFile(name);
}
