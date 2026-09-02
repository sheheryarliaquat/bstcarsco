import type { Location, VehicleType, PricingRule } from '@/types'
import { PRICING_DEFAULTS, UK_AIRPORTS } from '@/constants'
import { haversineDistance } from '@/lib/utils/distance'
import { isLondonPostcode, getAreaFromPostcode } from '@/lib/utils/uk-postcode'

const LONDON_CONGESTION_ZONES = [
  'EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'W1', 'SW1', 'SE1', 'N1', 'E1', 'NW1',
]

interface QuoteParams {
  pickup: Location
  destination: Location
  distanceMiles: number
  vehicleType: VehicleType
  pickupDateTime: Date
  operatorId: string
  passengerCount: number
  /** Real per-vehicle-type rates (from settings/pricingRates), merged over the built-in defaults. */
  rateOverride?: Partial<
    Pick<
      PricingRule,
      | 'baseFare'
      | 'perMile'
      | 'perMinute'
      | 'minimumFare'
      | 'bookingFee'
      | 'airportFee'
      | 'nightSurchargePercent'
      | 'weekendSurchargePercent'
      | 'peakTimeSurchargePercent'
      | 'congestionCharge'
    >
  >
}

export interface PriceBreakdown {
  baseFare: number
  distanceCharge: number
  timeCharge: number
  bookingFee: number
  airportFee: number
  nightSurcharge: number
  weekendSurcharge: number
  peakSurcharge: number
  congestionCharge: number
  subtotal: number
  tax: number
  total: number
  currency: string
}

export function calculateQuote(params: QuoteParams): PriceBreakdown {
  const { pickup, destination, distanceMiles, vehicleType, pickupDateTime, operatorId, rateOverride } = params
  const rules = getPricingRules(operatorId, vehicleType, rateOverride)

  const baseFare = rules.baseFare
  const distanceCharge = distanceMiles * rules.perMile

  const durationMinutes = estimateDuration(distanceMiles, vehicleType)
  const timeCharge = durationMinutes * rules.perMinute

  const bookingFee = rules.bookingFee

  const airportFee = calculateAirportFee(pickup, destination) ? rules.airportFee : 0

  const nightSurcharge = calculateNightSurcharge(pickupDateTime, baseFare + distanceCharge + timeCharge, rules.nightSurchargePercent)

  const weekendSurcharge = calculateWeekendSurcharge(pickupDateTime, baseFare + distanceCharge + timeCharge, rules.weekendSurchargePercent)

  const peakSurcharge = calculatePeakSurcharge(pickupDateTime, baseFare + distanceCharge + timeCharge, rules.peakTimeSurchargePercent)

  const congestionCharge = calculateCongestionCharge(pickup, destination) ? rules.congestionCharge : 0

  const subtotal = baseFare + distanceCharge + timeCharge + bookingFee + airportFee + nightSurcharge + weekendSurcharge + peakSurcharge + congestionCharge
  const totalBeforeMinimum = subtotal
  const finalSubtotal = Math.max(totalBeforeMinimum, rules.minimumFare)
  const tax = finalSubtotal * (PRICING_DEFAULTS.taxRate / 100)
  const total = finalSubtotal + tax

  return {
    baseFare,
    distanceCharge: roundTo2(distanceCharge),
    timeCharge: roundTo2(timeCharge),
    bookingFee,
    airportFee,
    nightSurcharge: roundTo2(nightSurcharge),
    weekendSurcharge: roundTo2(weekendSurcharge),
    peakSurcharge: roundTo2(peakSurcharge),
    congestionCharge,
    subtotal: roundTo2(finalSubtotal),
    tax: roundTo2(tax),
    total: roundTo2(total),
    currency: 'GBP',
  }
}

export function calculateDistance(pickup: Location, destination: Location): number {
  return haversineDistance(pickup.latitude, pickup.longitude, destination.latitude, destination.longitude)
}

export function estimateDuration(distanceMiles: number, vehicleType: VehicleType): number {
  const speedMap: Record<VehicleType, number> = {
    saloon: 20,
    executive: 22,
    estate: 20,
    mpv: 18,
    minibus: 16,
    electric: 20,
    wheelchair_accessible: 18,
  }
  const avgSpeedMph = speedMap[vehicleType] || 20
  return Math.max(Math.round((distanceMiles / avgSpeedMph) * 60), 5)
}

export function applyPromoCode(
  code: string,
  price: number,
  promoRules?: { discountType: 'percentage' | 'fixed'; discountValue: number; maximumDiscount?: number }
): { valid: boolean; discount: number; newTotal: number } {
  if (!promoRules) return { valid: false, discount: 0, newTotal: price }

  let discount = 0
  if (promoRules.discountType === 'percentage') {
    discount = price * (promoRules.discountValue / 100)
    if (promoRules.maximumDiscount) {
      discount = Math.min(discount, promoRules.maximumDiscount)
    }
  } else {
    discount = Math.min(promoRules.discountValue, price)
  }

  return {
    valid: true,
    discount: roundTo2(discount),
    newTotal: roundTo2(price - discount),
  }
}

export function getDefaultPricingRules(): PricingRule[] {
  return [
    {
      id: 'default-saloon',
      operatorId: 'default',
      vehicleType: 'saloon',
      baseFare: PRICING_DEFAULTS.baseFare,
      perMile: PRICING_DEFAULTS.perMile,
      perMinute: PRICING_DEFAULTS.perMinute,
      minimumFare: PRICING_DEFAULTS.minimumFare,
      bookingFee: PRICING_DEFAULTS.bookingFee,
      airportFee: PRICING_DEFAULTS.airportFee,
      nightSurchargePercent: PRICING_DEFAULTS.nightSurchargePercent,
      weekendSurchargePercent: PRICING_DEFAULTS.weekendSurchargePercent,
      peakTimeSurchargePercent: PRICING_DEFAULTS.peakTimeSurchargePercent,
      congestionCharge: PRICING_DEFAULTS.congestionCharge,
    },
  ]
}

function getPricingRules(
  operatorId: string,
  vehicleType: VehicleType,
  override?: QuoteParams['rateOverride']
): PricingRule {
  const defaults = getDefaultPricingRules()[0]
  return { ...defaults, ...override, operatorId, vehicleType }
}

function calculateAirportFee(pickup: Location, destination: Location): boolean {
  const allPostcodes = [pickup.postcode, destination.postcode]
  for (const postcode of allPostcodes) {
    const area = getAreaFromPostcode(postcode)
    for (const airport of UK_AIRPORTS) {
      if (postcode.startsWith(airport.postcode) || area === airport.postcode.slice(0, 2)) {
        return true
      }
    }
  }
  return false
}

function calculateNightSurcharge(dateTime: Date, baseAmount: number, percent: number): number {
  const hour = dateTime.getHours()
  if (hour >= 22 || hour < 6) {
    return baseAmount * (percent / 100)
  }
  return 0
}

function calculateWeekendSurcharge(dateTime: Date, baseAmount: number, percent: number): number {
  const day = dateTime.getDay()
  const hour = dateTime.getHours()

  if (day === 5 && hour >= 18) return baseAmount * (percent / 100)
  if (day === 6) return baseAmount * (percent / 100)
  if (day === 0) return baseAmount * (percent / 100)
  return 0
}

function calculatePeakSurcharge(dateTime: Date, baseAmount: number, percent: number): number {
  const hour = dateTime.getHours()
  const day = dateTime.getDay()

  if (day >= 1 && day <= 5) {
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
      return baseAmount * (percent / 100)
    }
  }
  return 0
}

function calculateCongestionCharge(pickup: Location, destination: Location): boolean {
  const pickupArea = getAreaFromPostcode(pickup.postcode)
  const destArea = getAreaFromPostcode(destination.postcode)
  return LONDON_CONGESTION_ZONES.includes(pickupArea) || LONDON_CONGESTION_ZONES.includes(destArea)
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100
}
