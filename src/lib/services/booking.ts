import { formatPostcode, validateUKPostcode } from '@/lib/utils/uk-postcode'

export interface BookingTimelineEntry {
  status: string
  timestamp: string
  updatedBy: string
  role: string
  note?: string
}

const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['confirmed', 'payment_failed', 'cancelled_by_passenger'],
  payment_failed: ['pending_payment', 'cancelled_by_passenger'],
  confirmed: ['operator_pending', 'driver_searching', 'cancelled_by_passenger', 'cancelled_by_operator'],
  operator_pending: ['driver_searching', 'cancelled_by_operator'],
  driver_searching: ['driver_assigned', 'cancelled_by_passenger', 'cancelled_by_operator'],
  driver_assigned: ['driver_accepted', 'cancelled_by_driver', 'cancelled_by_passenger'],
  driver_accepted: ['driver_en_route', 'cancelled_by_driver'],
  driver_en_route: ['driver_arrived', 'cancelled_by_driver'],
  driver_arrived: ['passenger_onboard', 'no_show', 'cancelled_by_passenger'],
  passenger_onboard: ['trip_started', 'cancelled_by_passenger'],
  trip_started: ['trip_completed'],
  trip_completed: [],
  cancelled_by_passenger: [],
  cancelled_by_driver: ['driver_searching'],
  cancelled_by_operator: ['driver_searching'],
  cancelled_by_admin: [],
  no_show: [],
}

function generateBookingNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `UKTB-${year}-${random}`
}

function validateBookingData(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.pickup || typeof data.pickup !== 'object') errors.push('Pickup location is required')
  if (!data.destination || typeof data.destination !== 'object') errors.push('Destination location is required')
  if (!data.date || typeof data.date !== 'string') errors.push('Travel date is required')
  if (!data.pickupTime || typeof data.pickupTime !== 'string') errors.push('Pickup time is required')
  if (!data.vehicleType) errors.push('Vehicle type is required')

  const pickup = data.pickup as Record<string, unknown> | undefined
  const destination = data.destination as Record<string, unknown> | undefined

  if (pickup?.postcode && !validateUKPostcode(pickup.postcode as string)) {
    errors.push('Invalid pickup postcode')
  }
  if (destination?.postcode && !validateUKPostcode(destination.postcode as string)) {
    errors.push('Invalid destination postcode')
  }

  const passengers = Number(data.passengers)
  if (data.passengers !== undefined && (isNaN(passengers) || passengers < 1 || passengers > 16)) {
    errors.push('Passengers must be between 1 and 16')
  }

  return { valid: errors.length === 0, errors }
}

function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = BOOKING_STATUS_TRANSITIONS[currentStatus]
  if (!allowed) return false
  return allowed.includes(newStatus)
}

function getBookingTimeline(bookingId: string): BookingTimelineEntry[] {
  return [
    {
      status: 'pending_payment',
      timestamp: new Date().toISOString(),
      updatedBy: 'system',
      role: 'system',
      note: 'Booking created, awaiting payment',
    },
  ]
}

function calculateRefundAmount(total: number, cancellationReason: string, hoursBeforePickup: number): number {
  if (hoursBeforePickup >= 24) return total
  if (hoursBeforePickup >= 2) return total * 0.5
  return 0
}

export {
  generateBookingNumber,
  validateBookingData,
  validateStatusTransition,
  getBookingTimeline,
  calculateRefundAmount,
  BOOKING_STATUS_TRANSITIONS,
}
