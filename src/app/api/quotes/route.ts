import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { calculateQuote, calculateDistance, estimateDuration, type PriceBreakdown } from '@/lib/services/pricing';
import type { Location, Vehicle, Operator, Quote, VehicleType } from '@/types';
import type { VehicleTypeRate } from '@/lib/services/pricing-rates-service';

/**
 * Built-in fallback rates, mirrored from the Admin Vehicles page's
 * DEFAULT_RATES — used for any vehicle type the admin hasn't saved a
 * real rate for yet in settings/pricingRates.
 */
const DEFAULT_RATES: Record<VehicleType, VehicleTypeRate> = {
  saloon: { baseFare: 3.0, perMile: 1.8, perMinute: 0.25, minimumFare: 5.0, bookingFee: 1.0 },
  executive: { baseFare: 5.0, perMile: 2.5, perMinute: 0.35, minimumFare: 8.0, bookingFee: 1.5 },
  estate: { baseFare: 3.5, perMile: 2.0, perMinute: 0.28, minimumFare: 6.0, bookingFee: 1.0 },
  mpv: { baseFare: 5.0, perMile: 2.2, perMinute: 0.3, minimumFare: 8.0, bookingFee: 1.5 },
  minibus: { baseFare: 7.0, perMile: 2.8, perMinute: 0.4, minimumFare: 12.0, bookingFee: 2.0 },
  electric: { baseFare: 3.0, perMile: 1.6, perMinute: 0.22, minimumFare: 5.0, bookingFee: 1.0 },
  wheelchair_accessible: { baseFare: 4.0, perMile: 2.0, perMinute: 0.28, minimumFare: 6.0, bookingFee: 1.0 },
};

export interface RealQuote extends Quote {
  vehicleId: string;
  breakdown: PriceBreakdown;
}

interface QuotesRequestBody {
  pickup?: Location;
  destination?: Location;
  date?: string;
  time?: string;
  passengers?: number;
  luggage?: number;
}

function isValidLocation(loc: unknown): loc is Location {
  return (
    !!loc &&
    typeof loc === 'object' &&
    typeof (loc as Location).latitude === 'number' &&
    typeof (loc as Location).longitude === 'number' &&
    typeof (loc as Location).formattedAddress === 'string' &&
    (loc as Location).formattedAddress.length > 0
  );
}

/**
 * Computes real quotes from real Firestore data (vehicles + operators +
 * admin-configured rates) using the Admin SDK, so it works for signed-out
 * guests browsing /quotes without opening Firestore reads to the public.
 * No auth required — this is the customer-facing quote engine.
 */
export async function POST(request: NextRequest) {
  let body: QuotesRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isValidLocation(body.pickup) || !isValidLocation(body.destination)) {
    return NextResponse.json({ error: 'A valid pickup and destination are required.' }, { status: 400 });
  }
  const pickup = body.pickup;
  const destination = body.destination;

  const passengers = Number.isFinite(body.passengers) && Number(body.passengers) > 0 ? Number(body.passengers) : 1;
  const luggage = Number.isFinite(body.luggage) && Number(body.luggage) >= 0 ? Number(body.luggage) : 0;
  const dateStr = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : new Date().toISOString().slice(0, 10);
  const timeStr = body.time && /^\d{2}:\d{2}$/.test(body.time) ? body.time : '09:00';
  const pickupDateTime = new Date(`${dateStr}T${timeStr}:00`);

  try {
    const adminDb = getAdminDb();

    const [vehiclesSnap, operatorsSnap, ratesSnap] = await Promise.all([
      adminDb.collection('vehicles').where('isApproved', '==', true).get(),
      adminDb.collection('users').where('role', '==', 'operator').get(),
      adminDb.collection('settings').doc('pricingRates').get(),
    ]);

    const activeOperators = new Map<string, Operator>();
    operatorsSnap.forEach((doc) => {
      const data = doc.data() as Operator;
      if (data.status === 'active') {
        activeOperators.set(doc.id, { ...data, uid: doc.id });
      }
    });

    const savedRates = (ratesSnap.exists ? ratesSnap.data()?.rates : null) as
      | Partial<Record<VehicleType, VehicleTypeRate>>
      | null
      | undefined;

    const distanceMiles = calculateDistance(pickup, destination);

    const quotes: RealQuote[] = [];

    vehiclesSnap.forEach((doc) => {
      const vehicle = { id: doc.id, ...(doc.data() as Omit<Vehicle, 'id'>) } as Vehicle;

      if ((vehicle.availabilityStatus ?? 'available') !== 'available') return;
      if (vehicle.passengerCapacity < passengers) return;
      if (vehicle.luggageCapacity < luggage) return;

      const operator = activeOperators.get(vehicle.operatorId);
      if (!operator) return;

      const rateOverride = savedRates?.[vehicle.vehicleType] ?? DEFAULT_RATES[vehicle.vehicleType];

      const breakdown = calculateQuote({
        pickup,
        destination,
        distanceMiles,
        vehicleType: vehicle.vehicleType,
        pickupDateTime,
        operatorId: vehicle.operatorId,
        passengerCount: passengers,
        rateOverride,
      });

      const estimatedJourneyTime = estimateDuration(distanceMiles, vehicle.vehicleType);

      const features: string[] = ['Meet and greet available', 'Flight tracking'];
      if (vehicle.wheelchairAccessible) features.unshift('Wheelchair accessible');

      quotes.push({
        id: `q-${vehicle.id}`,
        bookingId: '',
        vehicleId: vehicle.id,
        operatorId: vehicle.operatorId,
        operatorName: operator.companyName || `${operator.firstName} ${operator.lastName}`.trim() || 'Operator',
        operatorLogo: operator.companyLogo,
        vehicleType: vehicle.vehicleType,
        vehicleDescription: `${vehicle.make} ${vehicle.model}`.trim(),
        passengerCapacity: vehicle.passengerCapacity,
        luggageCapacity: vehicle.luggageCapacity,
        rating: operator.rating || 0,
        totalReviews: operator.totalReviews || 0,
        estimatedJourneyTime,
        isElectric: vehicle.isElectric,
        isHybrid: vehicle.isHybrid,
        price: breakdown.total,
        paymentTypes: ['card', 'cash'],
        features,
        isLowestPrice: false,
        breakdown,
      });
    });

    if (quotes.length > 0) {
      const minPrice = Math.min(...quotes.map((q) => q.price));
      quotes.forEach((q) => {
        q.isLowestPrice = q.price === minPrice;
      });
      quotes.sort((a, b) => a.price - b.price);
    }

    return NextResponse.json({
      quotes,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
    });
  } catch (err) {
    console.error('POST /api/quotes failed —', err);
    return NextResponse.json({ error: 'Could not calculate quotes. Please try again.' }, { status: 500 });
  }
}
