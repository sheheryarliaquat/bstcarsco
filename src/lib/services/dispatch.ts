import type { Location, DriverStatus } from '@/types'
import { haversineDistance } from '@/lib/utils/distance'

interface DriverSearchParams {
  pickupLocation: Location
  vehicleType?: string
  passengerCapacity?: number
  wheelchairAccessible?: boolean
  maxDistanceMiles?: number
  operatorId?: string
}

interface DriverSearchResult {
  driverId: string
  operatorId: string
  distanceMiles: number
  vehicleType: string
  passengerCapacity: number
  rating: number
  vehicleId: string
}

function findAvailableDrivers(params: DriverSearchParams): DriverSearchResult[] {
  const { pickupLocation, maxDistanceMiles = 15 } = params
  const results: DriverSearchResult[] = []

  return results.filter(r => r.distanceMiles <= maxDistanceMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
}

function calculateDriverDistance(driverLocation: Location, pickupLocation: Location): number {
  return haversineDistance(
    driverLocation.latitude,
    driverLocation.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  )
}

function assignDriverToBooking(bookingId: string, driverId: string): { success: boolean; message: string } {
  if (!bookingId || !driverId) {
    return { success: false, message: 'Booking ID and Driver ID are required' }
  }
  return { success: true, message: `Driver ${driverId} assigned to booking ${bookingId}` }
}

function offerJobToDrivers(
  bookingId: string,
  driverIds: string[],
  timeoutMs: number = 30000
): { offered: string[]; timeoutMs: number } {
  return {
    offered: driverIds,
    timeoutMs,
  }
}

function updateDriverStatus(driverId: string, status: DriverStatus): { success: boolean } {
  return { success: true }
}

export {
  findAvailableDrivers,
  calculateDriverDistance,
  assignDriverToBooking,
  offerJobToDrivers,
  updateDriverStatus,
}

export type { DriverSearchParams, DriverSearchResult }
