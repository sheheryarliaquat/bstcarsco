'use client';

import { getDocument } from '@/lib/firebase/firestore';
import { getAllVehicles, getVehicleRates, type VehicleRate } from './vehicle-service';
import { calculateDistance, estimateDuration } from './pricing';
import { getRouteFares, findRouteFare } from './route-fare-service';
import { VEHICLE_TYPES } from '@/constants';
import type { Location, Operator, Quote, VehicleType } from '@/types';

const DEFAULT_RATE: Omit<VehicleRate, 'vehicleType' | 'label'> = {
  baseFare: 4.0,
  perMile: 2.0,
  perMinute: 0.3,
  minimumFare: 6.0,
  bookingFee: 1.0,
};

interface QuoteSearch {
  pickup: Location;
  destination: Location;
  passengers: number;
  luggage: number;
  wheelchairAccessible?: boolean;
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getAvailableQuotes(search: QuoteSearch): Promise<Quote[]> {
  const [vehicles, rates, routeFares] = await Promise.all([
    getAllVehicles(),
    getVehicleRates(),
    // A failure to read route fares must not block quotes — mileage pricing still applies.
    getRouteFares().catch(() => []),
  ]);

  const eligible = vehicles.filter(
    (v) =>
      v.isApproved &&
      (v.availabilityStatus ?? 'available') === 'available' &&
      v.passengerCapacity >= search.passengers &&
      v.luggageCapacity >= search.luggage &&
      (!search.wheelchairAccessible || v.wheelchairAccessible)
  );

  const distanceMiles = calculateDistance(search.pickup, search.destination);

  // Fixed fares the admin set for this journey, per car type.
  const fixedByType = new Map<VehicleType, number>();
  for (const t of VEHICLE_TYPES) {
    const f = findRouteFare(routeFares, search.pickup, search.destination, t.value);
    if (f) fixedByType.set(t.value, roundTo2(f.price));
  }

  if (eligible.length === 0 && fixedByType.size === 0) return [];
  const operatorCache = new Map<string, Operator | null>();

  const quotes: Quote[] = [];
  const fixedIds = new Set<string>();
  for (const vehicle of eligible) {
    const rate = rates?.find((r) => r.vehicleType === vehicle.vehicleType);
    const durationMinutes = estimateDuration(distanceMiles, vehicle.vehicleType);

    const baseFare = rate?.baseFare ?? DEFAULT_RATE.baseFare;
    const perMile = rate?.perMile ?? DEFAULT_RATE.perMile;
    const perMinute = rate?.perMinute ?? DEFAULT_RATE.perMinute;
    const minimumFare = rate?.minimumFare ?? DEFAULT_RATE.minimumFare;
    const bookingFee = rate?.bookingFee ?? DEFAULT_RATE.bookingFee;

    // An admin-set fixed fare for this route and car type wins over mileage pricing.
    const fixedPrice = fixedByType.get(vehicle.vehicleType);
    const fixed = fixedPrice !== undefined;
    const subtotal = baseFare + distanceMiles * perMile + durationMinutes * perMinute + bookingFee;
    const price = fixed ? fixedPrice : roundTo2(Math.max(subtotal, minimumFare));
    if (fixed) fixedIds.add(vehicle.id);

    let operator = operatorCache.get(vehicle.operatorId);
    if (operator === undefined) {
      // The `users` collection only allows the owner or an admin to read a
      // profile, so a signed-out/anonymous visitor gets permission-denied
      // here for most operators — that must not take the whole quote list
      // down with it, just fall back to an unnamed operator for this quote.
      operator = vehicle.operatorId
        ? await getDocument<Operator>('users', vehicle.operatorId).catch(() => null)
        : null;
      operatorCache.set(vehicle.operatorId, operator);
    }

    quotes.push({
      id: vehicle.id,
      bookingId: '',
      operatorId: vehicle.operatorId,
      operatorName: operator?.companyName ?? 'Unknown Operator',
      operatorLogo: operator?.companyLogo,
      vehicleType: vehicle.vehicleType,
      vehicleDescription: `${vehicle.make} ${vehicle.model} - ${vehicle.passengerCapacity} Seats`,
      vehicleImage: vehicle.photoURL,
      passengerCapacity: vehicle.passengerCapacity,
      luggageCapacity: vehicle.luggageCapacity,
      rating: operator?.rating ?? 0,
      totalReviews: operator?.totalReviews ?? 0,
      estimatedJourneyTime: durationMinutes,
      isElectric: vehicle.isElectric,
      isHybrid: vehicle.isHybrid,
      price,
      paymentTypes: ['card', 'cash'],
      features: fixed ? ['Fixed fare'] : [],
      isLowestPrice: false,
    });
  }

  // When this route has fixed fares, offer exactly the car types the admin priced for it.
  // A priced type with no registered vehicle is still offered; the booking is made for
  // that car type and a driver is assigned later from the dispatch board.
  let offered = quotes;
  if (fixedByType.size > 0) {
    offered = quotes.filter((q) => fixedIds.has(q.id));
    for (const [vehicleType, price] of fixedByType) {
      if (offered.some((q) => q.vehicleType === vehicleType)) continue;
      const meta = VEHICLE_TYPES.find((t) => t.value === vehicleType);
      if (!meta) continue;
      if (search.wheelchairAccessible && vehicleType !== 'wheelchair_accessible') continue;
      if (meta.passengerCapacity < search.passengers || meta.luggageCapacity < search.luggage) continue;
      offered.push({
        id: `type-${vehicleType}`,
        bookingId: '',
        operatorId: '',
        operatorName: 'BST Cars',
        vehicleType,
        vehicleDescription: `${meta.label} - ${meta.passengerCapacity} Seats`,
        passengerCapacity: meta.passengerCapacity,
        luggageCapacity: meta.luggageCapacity,
        rating: 0,
        totalReviews: 0,
        estimatedJourneyTime: estimateDuration(distanceMiles, vehicleType),
        isElectric: vehicleType === 'electric',
        isHybrid: false,
        price,
        paymentTypes: ['card', 'cash'],
        features: ['Fixed fare'],
        isLowestPrice: false,
      });
    }
  }

  const lowest = offered.reduce(
    (min, q) => (q.price < min ? q.price : min),
    offered[0]?.price ?? 0
  );
  return offered.map((q) => ({ ...q, isLowestPrice: q.price === lowest }));
}
