'use client';

import { getDocument } from '@/lib/firebase/firestore';
import { getAllVehicles, getVehicleRates, type VehicleRate } from './vehicle-service';
import { calculateDistance, estimateDuration } from './pricing';
import type { Location, Operator, Quote, Vehicle } from '@/types';

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
  const [vehicles, rates] = await Promise.all([getAllVehicles(), getVehicleRates()]);

  const eligible = vehicles.filter(
    (v) =>
      v.isApproved &&
      (v.availabilityStatus ?? 'available') === 'available' &&
      v.passengerCapacity >= search.passengers &&
      v.luggageCapacity >= search.luggage &&
      (!search.wheelchairAccessible || v.wheelchairAccessible)
  );

  if (eligible.length === 0) return [];

  const distanceMiles = calculateDistance(search.pickup, search.destination);
  const operatorCache = new Map<string, Operator | null>();

  const quotes: Quote[] = [];
  for (const vehicle of eligible) {
    const rate = rates?.find((r) => r.vehicleType === vehicle.vehicleType);
    const durationMinutes = estimateDuration(distanceMiles, vehicle.vehicleType);

    const baseFare = rate?.baseFare ?? DEFAULT_RATE.baseFare;
    const perMile = rate?.perMile ?? DEFAULT_RATE.perMile;
    const perMinute = rate?.perMinute ?? DEFAULT_RATE.perMinute;
    const minimumFare = rate?.minimumFare ?? DEFAULT_RATE.minimumFare;
    const bookingFee = rate?.bookingFee ?? DEFAULT_RATE.bookingFee;

    const subtotal = baseFare + distanceMiles * perMile + durationMinutes * perMinute + bookingFee;
    const price = roundTo2(Math.max(subtotal, minimumFare));

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
      features: [],
      isLowestPrice: false,
    });
  }

  const lowest = quotes.reduce(
    (min, q) => (q.price < min ? q.price : min),
    quotes[0]?.price ?? 0
  );
  return quotes.map((q) => ({ ...q, isLowestPrice: q.price === lowest }));
}
