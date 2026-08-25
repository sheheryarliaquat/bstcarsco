/**
 * Firebase Seed Script for UK Taxi Booking Platform
 *
 * Usage:
 *   npx tsx scripts/seed-data.ts
 *
 * Requires:
 *   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *     environment variables (or a service account JSON in the project root).
 *   - firebase-admin SDK installed:
 *       npm install firebase-admin
 *
 * This script uses the Firebase Admin SDK to seed demo data into Firestore.
 * It will NOT overwrite existing documents that already have the same ID.
 */

import { initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

let app: App

try {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
} catch {
  app = initializeApp()
}

const db = getFirestore(app)

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function seedCollection<T extends Record<string, unknown>>(
  collectionName: string,
  docs: { id: string; data: T }[]
): Promise<void> {
  const batch = db.batch()
  for (const { id, data } of docs) {
    const ref = db.collection(collectionName).doc(id)
    batch.set(ref, {
      ...data,
      createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  console.log(`  ✓ ${collectionName}: ${docs.length} documents`)
}

// ---------------------------------------------------------------------------
// Users – Admin
// ---------------------------------------------------------------------------

const adminUsers = [
  {
    id: 'admin-001',
    data: {
      uid: 'admin-001',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@bstcars.co',
      phone: '+442071234567',
      photoURL: '',
      status: 'active',
      lastLoginAt: '2026-08-26T08:00:00Z',
    },
  },
]

// ---------------------------------------------------------------------------
// Users – Passengers
// ---------------------------------------------------------------------------

const passengers = [
  {
    id: 'pass-001',
    data: {
      uid: 'pass-001',
      role: 'passenger',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@example.com',
      phone: '+447700900100',
      photoURL: '',
      status: 'active',
      lastLoginAt: '2026-08-25T08:45:00Z',
      savedLocations: [],
      preferences: {
        defaultVehicleType: 'saloon',
        notifications: true,
        emailUpdates: true,
        defaultLuggage: 2,
        defaultPassengers: 1,
      },
    },
  },
  {
    id: 'pass-002',
    data: {
      uid: 'pass-002',
      role: 'passenger',
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma.thompson@example.com',
      phone: '+447700900200',
      photoURL: '',
      status: 'active',
      lastLoginAt: '2026-08-24T17:20:00Z',
      savedLocations: [],
      preferences: {
        defaultVehicleType: 'executive',
        notifications: true,
        emailUpdates: false,
        defaultLuggage: 1,
        defaultPassengers: 1,
      },
    },
  },
  {
    id: 'pass-003',
    data: {
      uid: 'pass-003',
      role: 'passenger',
      firstName: 'Raj',
      lastName: 'Patel',
      email: 'raj.patel@example.com',
      phone: '+447700900300',
      status: 'active',
      lastLoginAt: '2026-08-25T07:10:00Z',
      savedLocations: [],
      preferences: {
        notifications: true,
        emailUpdates: true,
        defaultLuggage: 3,
        defaultPassengers: 2,
      },
    },
  },
  {
    id: 'pass-004',
    data: {
      uid: 'pass-004',
      role: 'passenger',
      firstName: 'Sophie',
      lastName: 'Clarkson',
      email: 'sophie.clarkson@example.com',
      phone: '+447700900400',
      status: 'active',
      lastLoginAt: '2026-08-25T09:30:00Z',
      savedLocations: [],
      preferences: {
        defaultVehicleType: 'mpv',
        notifications: true,
        emailUpdates: true,
        defaultLuggage: 4,
        defaultPassengers: 4,
      },
    },
  },
  {
    id: 'pass-005',
    data: {
      uid: 'pass-005',
      role: 'passenger',
      firstName: 'David',
      lastName: 'Morgan',
      email: 'david.morgan@example.com',
      phone: '+447700900500',
      status: 'active',
      lastLoginAt: '2026-08-24T20:15:00Z',
      savedLocations: [],
      preferences: {
        defaultVehicleType: 'electric',
        notifications: true,
        emailUpdates: false,
        defaultLuggage: 1,
        defaultPassengers: 1,
      },
    },
  },
]

// ---------------------------------------------------------------------------
// Users – Drivers
// ---------------------------------------------------------------------------

const driverAvailability = {
  monday: [{ start: '06:00', end: '22:00' }],
  tuesday: [{ start: '06:00', end: '22:00' }],
  wednesday: [{ start: '06:00', end: '22:00' }],
  thursday: [{ start: '06:00', end: '22:00' }],
  friday: [{ start: '06:00', end: '23:00' }],
  saturday: [{ start: '08:00', end: '23:00' }],
  sunday: [{ start: '08:00', end: '21:00' }],
}

const drivers = [
  {
    id: 'drv-001',
    data: {
      uid: 'drv-001',
      role: 'driver',
      firstName: 'Mohammed',
      lastName: 'Hassan',
      email: 'mohammed.hassan@driver.uk',
      phone: '+447700901100',
      status: 'online',
      operatorId: 'op-001',
      vehicleId: 'veh-001',
      rating: 4.9,
      totalReviews: 847,
      licenceNumber: 'MOH1234567890',
      documents: [],
      lastLocation: { latitude: 51.5074, longitude: -0.1278, updatedAt: '2026-08-25T08:45:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T08:00:00Z',
    },
  },
  {
    id: 'drv-002',
    data: {
      uid: 'drv-002',
      role: 'driver',
      firstName: "Sarah",
      lastName: "O'Brien",
      email: "sarah.obrien@driver.uk",
      phone: '+447700901200',
      status: 'online',
      operatorId: 'op-001',
      vehicleId: 'veh-002',
      rating: 4.8,
      totalReviews: 623,
      licenceNumber: 'SAR9876543210',
      documents: [],
      lastLocation: { latitude: 51.5139, longitude: -0.1431, updatedAt: '2026-08-25T07:50:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-24T19:30:00Z',
    },
  },
  {
    id: 'drv-003',
    data: {
      uid: 'drv-003',
      role: 'driver',
      firstName: 'Amit',
      lastName: 'Sharma',
      email: 'amit.sharma@driver.uk',
      phone: '+447700901300',
      status: 'busy',
      operatorId: 'op-002',
      vehicleId: 'veh-003',
      rating: 4.7,
      totalReviews: 312,
      licenceNumber: 'AMI4567890123',
      documents: [],
      lastLocation: { latitude: 53.4794, longitude: -2.2453, updatedAt: '2026-08-25T08:40:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T07:45:00Z',
    },
  },
  {
    id: 'drv-004',
    data: {
      uid: 'drv-004',
      role: 'driver',
      firstName: 'Peter',
      lastName: 'Davies',
      email: 'peter.davies@driver.uk',
      phone: '+447700901400',
      status: 'offline',
      operatorId: 'op-002',
      vehicleId: 'veh-004',
      rating: 4.6,
      totalReviews: 189,
      licenceNumber: 'PET7890123456',
      documents: [],
      lastLocation: { latitude: 52.4862, longitude: -1.8904, updatedAt: '2026-08-23T15:00:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-23T15:00:00Z',
    },
  },
  {
    id: 'drv-005',
    data: {
      uid: 'drv-005',
      role: 'driver',
      firstName: 'Linda',
      lastName: 'Nguyen',
      email: 'linda.nguyen@driver.uk',
      phone: '+447700901500',
      status: 'online',
      operatorId: 'op-003',
      vehicleId: 'veh-005',
      rating: 4.9,
      totalReviews: 456,
      licenceNumber: 'LIN3210987654',
      documents: [],
      lastLocation: { latitude: 55.9533, longitude: -3.1883, updatedAt: '2026-08-25T08:42:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T06:30:00Z',
    },
  },
  {
    id: 'drv-006',
    data: {
      uid: 'drv-006',
      role: 'driver',
      firstName: 'Tom',
      lastName: 'Bradley',
      email: 'tom.bradley@driver.uk',
      phone: '+447700901600',
      status: 'online',
      operatorId: 'op-001',
      vehicleId: 'veh-006',
      rating: 4.5,
      totalReviews: 142,
      licenceNumber: 'TOM6543210987',
      documents: [],
      lastLocation: { latitude: 51.5098, longitude: -0.1337, updatedAt: '2026-08-25T08:30:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T08:00:00Z',
    },
  },
  {
    id: 'drv-007',
    data: {
      uid: 'drv-007',
      role: 'driver',
      firstName: 'Priya',
      lastName: 'Kaur',
      email: 'priya.kaur@driver.uk',
      phone: '+447700901700',
      status: 'online',
      operatorId: 'op-002',
      vehicleId: 'veh-007',
      rating: 4.8,
      totalReviews: 278,
      licenceNumber: 'PRI1122334455',
      documents: [],
      lastLocation: { latitude: 53.4808, longitude: -2.2425, updatedAt: '2026-08-25T08:35:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T07:55:00Z',
    },
  },
  {
    id: 'drv-008',
    data: {
      uid: 'drv-008',
      role: 'driver',
      firstName: 'Callum',
      lastName: 'Ross',
      email: 'callum.ross@driver.uk',
      phone: '+447700901800',
      status: 'online',
      operatorId: 'op-003',
      vehicleId: 'veh-008',
      rating: 4.6,
      totalReviews: 198,
      licenceNumber: 'CAL5566778899',
      documents: [],
      lastLocation: { latitude: 55.9521, longitude: -3.189, updatedAt: '2026-08-25T08:20:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T08:10:00Z',
    },
  },
  {
    id: 'drv-009',
    data: {
      uid: 'drv-009',
      role: 'driver',
      firstName: 'Karen',
      lastName: 'Bennett',
      email: 'karen.bennett@driver.uk',
      phone: '+447700901900',
      status: 'online',
      operatorId: 'op-001',
      vehicleId: 'veh-009',
      rating: 4.7,
      totalReviews: 356,
      licenceNumber: 'KAR9988776655',
      documents: [],
      lastLocation: { latitude: 51.5155, longitude: -0.1415, updatedAt: '2026-08-25T08:50:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-25T08:25:00Z',
    },
  },
  {
    id: 'drv-010',
    data: {
      uid: 'drv-010',
      role: 'driver',
      firstName: 'Daniel',
      lastName: 'Obi',
      email: 'daniel.obi@driver.uk',
      phone: '+447700902000',
      status: 'offline',
      operatorId: 'op-002',
      vehicleId: 'veh-010',
      rating: 4.4,
      totalReviews: 89,
      licenceNumber: 'DAN4433221100',
      documents: [],
      lastLocation: { latitude: 53.4756, longitude: -2.2389, updatedAt: '2026-08-24T18:00:00Z' },
      isVerified: true,
      availability: driverAvailability,
      lastLoginAt: '2026-08-24T18:00:00Z',
    },
  },
]

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

const operators = [
  {
    id: 'op-001',
    data: {
      uid: 'op-001',
      role: 'operator',
      firstName: 'Richard',
      lastName: 'Kingsley',
      email: 'richard@kingsleytravel.co.uk',
      phone: '+442071234567',
      status: 'active',
      companyName: 'Kingsley Travel',
      description: 'Premium taxi operator serving Central and Greater London.',
      rating: 4.8,
      totalReviews: 3245,
      fleetSize: 45,
      isVerified: true,
      commission: { percent: 15, flatFee: 0.5 },
      lastLoginAt: '2026-08-25T07:30:00Z',
    },
  },
  {
    id: 'op-002',
    data: {
      uid: 'op-002',
      role: 'operator',
      firstName: 'Fiona',
      lastName: 'McGregor',
      email: 'fiona@northerntaxi.co.uk',
      phone: '+441619876543',
      status: 'active',
      companyName: 'Northern Taxi Services',
      description: 'Reliable taxi services across Manchester and the North West.',
      rating: 4.6,
      totalReviews: 1890,
      fleetSize: 32,
      isVerified: true,
      commission: { percent: 18, flatFee: 0.25 },
      lastLoginAt: '2026-08-24T18:00:00Z',
    },
  },
  {
    id: 'op-003',
    data: {
      uid: 'op-003',
      role: 'operator',
      firstName: 'Ewan',
      lastName: 'Campbell',
      email: 'ewan@capitaltaxis.edinburgh.co.uk',
      phone: '+441315551234',
      status: 'active',
      companyName: 'Capital Taxis Edinburgh',
      description: "Edinburgh's trusted taxi operator, providing wheelchair accessible and standard vehicles.",
      rating: 4.7,
      totalReviews: 987,
      fleetSize: 22,
      isVerified: true,
      commission: { percent: 12, flatFee: 0.75 },
      lastLoginAt: '2026-08-25T06:00:00Z',
    },
  },
]

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

const vehicles = [
  { id: 'veh-001', data: { operatorId: 'op-001', driverId: 'drv-001', make: 'Toyota', model: 'Prius', year: 2024, registration: 'LN24 TCO', colour: 'White', vehicleType: 'electric', passengerCapacity: 3, luggageCapacity: 2, wheelchairAccessible: false, isElectric: true, isHybrid: true, isApproved: true } },
  { id: 'veh-002', data: { operatorId: 'op-001', driverId: 'drv-002', make: 'Mercedes-Benz', model: 'E-Class', year: 2023, registration: 'LN23 MBC', colour: 'Black', vehicleType: 'executive', passengerCapacity: 3, luggageCapacity: 2, wheelchairAccessible: false, isElectric: false, isHybrid: false, isApproved: true } },
  { id: 'veh-003', data: { operatorId: 'op-002', driverId: 'drv-003', make: 'Ford', model: 'Mondeo Estate', year: 2024, registration: 'MN24 FME', colour: 'Silver', vehicleType: 'estate', passengerCapacity: 3, luggageCapacity: 4, wheelchairAccessible: false, isElectric: false, isHybrid: true, isApproved: true } },
  { id: 'veh-004', data: { operatorId: 'op-002', driverId: 'drv-004', make: 'Volkswagen', model: 'Touran', year: 2023, registration: 'BM23 VWT', colour: 'Grey', vehicleType: 'mpv', passengerCapacity: 6, luggageCapacity: 4, wheelchairAccessible: false, isElectric: false, isHybrid: false, isApproved: true } },
  { id: 'veh-005', data: { operatorId: 'op-003', driverId: 'drv-005', make: 'Citroen', model: 'Berlingo', year: 2024, registration: 'ED24 CBL', colour: 'Blue', vehicleType: 'wheelchair_accessible', passengerCapacity: 2, luggageCapacity: 1, wheelchairAccessible: true, isElectric: false, isHybrid: false, isApproved: true } },
  { id: 'veh-006', data: { operatorId: 'op-001', driverId: 'drv-006', make: 'Hyundai', model: 'Ioniq 5', year: 2025, registration: 'LN25 HYE', colour: 'Titan Grey', vehicleType: 'electric', passengerCapacity: 3, luggageCapacity: 2, wheelchairAccessible: false, isElectric: true, isHybrid: false, isApproved: true } },
  { id: 'veh-007', data: { operatorId: 'op-002', driverId: 'drv-007', make: 'Kia', model: 'Niro', year: 2024, registration: 'MN24 KNV', colour: 'Green', vehicleType: 'electric', passengerCapacity: 3, luggageCapacity: 2, wheelchairAccessible: false, isElectric: true, isHybrid: true, isApproved: true } },
  { id: 'veh-008', data: { operatorId: 'op-003', driverId: 'drv-008', make: 'Toyota', model: 'Verso', year: 2023, registration: 'ED23 TVS', colour: 'White', vehicleType: 'mpv', passengerCapacity: 5, luggageCapacity: 3, wheelchairAccessible: false, isElectric: false, isHybrid: false, isApproved: true } },
  { id: 'veh-009', data: { operatorId: 'op-001', driverId: 'drv-009', make: 'Ford', model: 'Galaxy', year: 2024, registration: 'LN24 FGD', colour: 'Navy', vehicleType: 'mpv', passengerCapacity: 6, luggageCapacity: 4, wheelchairAccessible: false, isElectric: false, isHybrid: false, isApproved: true } },
  { id: 'veh-010', data: { operatorId: 'op-002', driverId: 'drv-010', make: 'Peugeot', model: 'Partner', year: 2023, registration: 'MN23 PPV', colour: 'Red', vehicleType: 'saloon', passengerCapacity: 3, luggageCapacity: 2, wheelchairAccessible: false, isElectric: false, isHybrid: false, isApproved: true } },
]

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

const bookings = [
  { id: 'bk-001', data: { bookingNumber: 'UKTB-2026-000001', passengerId: 'pass-001', operatorId: 'op-001', driverId: 'drv-001', vehicleId: 'veh-001', tripType: 'one_way', pickup: { formattedAddress: '221B Baker Street, London NW1 6XE', latitude: 51.5238, longitude: -0.1585, placeId: '', postcode: 'NW1 6XE', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: 'Heathrow Airport T5, London UB6 8JH', latitude: 51.47, longitude: -0.4543, placeId: '', postcode: 'UB6 8JH', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-08-26', pickupTime: '06:30', passengers: 1, luggage: 2, vehicleType: 'executive', distanceMiles: 18.4, estimatedDuration: 45, price: 42.5, discount: 0, tax: 8.5, total: 51.0, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'trip_completed' } },
  { id: 'bk-002', data: { bookingNumber: 'UKTB-2026-000002', passengerId: 'pass-002', operatorId: 'op-001', driverId: 'drv-002', vehicleId: 'veh-002', tripType: 'one_way', pickup: { formattedAddress: '1 Manchester Square, London W1U 3PH', latitude: 51.5141, longitude: -0.1535, placeId: '', postcode: 'W1U 3PH', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: '10 Downing Street, London SW1A 2AA', latitude: 51.5034, longitude: -0.1276, placeId: '', postcode: 'SW1A 2AA', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-08-25', pickupTime: '14:00', passengers: 2, luggage: 1, vehicleType: 'executive', distanceMiles: 2.3, estimatedDuration: 15, price: 12.0, discount: 2.4, tax: 1.92, total: 11.52, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'driver_en_route' } },
  { id: 'bk-003', data: { bookingNumber: 'UKTB-2026-000003', passengerId: 'pass-003', operatorId: 'op-002', driverId: 'drv-003', vehicleId: 'veh-003', tripType: 'return', pickup: { formattedAddress: 'Birmingham New Street, Birmingham B2 4QA', latitude: 52.4776, longitude: -1.9081, placeId: '', postcode: 'B2 4QA', city: 'Birmingham', country: 'United Kingdom' }, destination: { formattedAddress: 'Manchester Airport, Manchester M90 1QX', latitude: 53.4794, longitude: -2.2453, placeId: '', postcode: 'M90 1QX', city: 'Manchester', country: 'United Kingdom' }, viaStops: [], date: '2026-08-27', pickupTime: '10:00', returnDate: '2026-08-30', returnTime: '18:00', passengers: 1, luggage: 3, vehicleType: 'estate', distanceMiles: 86.2, estimatedDuration: 120, price: 95.0, discount: 9.5, tax: 17.1, total: 102.6, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-004', data: { bookingNumber: 'UKTB-2026-000004', passengerId: 'pass-004', operatorId: 'op-001', driverId: '', vehicleId: '', tripType: 'one_way', pickup: { formattedAddress: 'The O2 Arena, London SE10 0DX', latitude: 51.5031, longitude: 0.0032, placeId: '', postcode: 'SE10 0DX', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: 'Heathrow Airport T5, London UB6 8JH', latitude: 51.47, longitude: -0.4543, placeId: '', postcode: 'UB6 8JH', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-08-28', pickupTime: '15:30', passengers: 5, luggage: 6, vehicleType: 'minibus', distanceMiles: 12.1, estimatedDuration: 35, price: 38.0, discount: 0, tax: 7.6, total: 45.6, currency: 'GBP', paymentStatus: 'pending', bookingStatus: 'pending_payment' } },
  { id: 'bk-005', data: { bookingNumber: 'UKTB-2026-000005', passengerId: 'pass-005', operatorId: 'op-003', driverId: 'drv-005', vehicleId: 'veh-005', tripType: 'one_way', pickup: { formattedAddress: 'Waverley Station, Edinburgh EH1 1BZ', latitude: 55.9521, longitude: -3.189, placeId: '', postcode: 'EH1 1BZ', city: 'Edinburgh', country: 'United Kingdom' }, destination: { formattedAddress: 'Glasgow Central Station, Glasgow G1 1AE', latitude: 55.8596, longitude: -4.2581, placeId: '', postcode: 'G1 1AE', city: 'Glasgow', country: 'United Kingdom' }, viaStops: [], date: '2026-08-25', pickupTime: '09:00', passengers: 1, luggage: 1, vehicleType: 'wheelchair_accessible', distanceMiles: 46.2, estimatedDuration: 65, price: 55.0, discount: 5.5, tax: 9.9, total: 59.4, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'trip_started' } },
  { id: 'bk-006', data: { bookingNumber: 'UKTB-2026-000006', passengerId: 'pass-001', operatorId: 'op-001', driverId: 'drv-006', vehicleId: 'veh-006', tripType: 'one_way', pickup: { formattedAddress: '221B Baker Street, London NW1 6XE', latitude: 51.5238, longitude: -0.1585, placeId: '', postcode: 'NW1 6XE', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: '10 Downing Street, London SW1A 2AA', latitude: 51.5034, longitude: -0.1276, placeId: '', postcode: 'SW1A 2AA', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-08-25', pickupTime: '18:30', passengers: 1, luggage: 0, vehicleType: 'saloon', distanceMiles: 3.1, estimatedDuration: 18, price: 11.5, discount: 0, tax: 2.3, total: 13.8, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-007', data: { bookingNumber: 'UKTB-2026-000007', passengerId: 'pass-002', operatorId: 'op-003', driverId: 'drv-008', vehicleId: 'veh-008', tripType: 'one_way', pickup: { formattedAddress: 'Waverley Station, Edinburgh EH1 1BZ', latitude: 55.9521, longitude: -3.189, placeId: '', postcode: 'EH1 1BZ', city: 'Edinburgh', country: 'United Kingdom' }, destination: { formattedAddress: 'Edinburgh Airport, Edinburgh EH12 9DN', latitude: 55.95, longitude: -3.3725, placeId: '', postcode: 'EH12 9DN', city: 'Edinburgh', country: 'United Kingdom' }, viaStops: [], date: '2026-08-27', pickupTime: '05:15', passengers: 2, luggage: 3, vehicleType: 'mpv', distanceMiles: 8.5, estimatedDuration: 22, price: 22.0, discount: 0, tax: 4.4, total: 26.4, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-008', data: { bookingNumber: 'UKTB-2026-000008', passengerId: 'pass-003', operatorId: 'op-001', driverId: 'drv-009', vehicleId: 'veh-009', tripType: 'one_way', pickup: { formattedAddress: 'Liverpool ONE, Liverpool L1 8JQ', latitude: 53.4026, longitude: -2.9913, placeId: '', postcode: 'L1 8JQ', city: 'Liverpool', country: 'United Kingdom' }, destination: { formattedAddress: 'Manchester Airport, Manchester M90 1QX', latitude: 53.4794, longitude: -2.2453, placeId: '', postcode: 'M90 1QX', city: 'Manchester', country: 'United Kingdom' }, viaStops: [], date: '2026-08-29', pickupTime: '11:00', passengers: 4, luggage: 4, vehicleType: 'mpv', distanceMiles: 34.0, estimatedDuration: 50, price: 58.0, discount: 5.8, tax: 10.44, total: 62.64, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-009', data: { bookingNumber: 'UKTB-2026-000009', passengerId: 'pass-004', operatorId: 'op-002', driverId: 'drv-007', vehicleId: 'veh-007', tripType: 'one_way', pickup: { formattedAddress: 'Birmingham New Street, Birmingham B2 4QA', latitude: 52.4776, longitude: -1.9081, placeId: '', postcode: 'B2 4QA', city: 'Birmingham', country: 'United Kingdom' }, destination: { formattedAddress: 'Birmingham Airport, Birmingham B26 3QJ', latitude: 52.4539, longitude: -1.748, placeId: '', postcode: 'B26 3QJ', city: 'Birmingham', country: 'United Kingdom' }, viaStops: [], date: '2026-08-26', pickupTime: '07:00', passengers: 1, luggage: 1, vehicleType: 'saloon', distanceMiles: 7.8, estimatedDuration: 20, price: 18.0, discount: 0, tax: 3.6, total: 21.6, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
  { id: 'bk-010', data: { bookingNumber: 'UKTB-2026-000010', passengerId: 'pass-005', operatorId: 'op-001', driverId: 'drv-001', vehicleId: 'veh-001', tripType: 'one_way', pickup: { formattedAddress: 'Cardiff Central Station, Cardiff CF10 1EP', latitude: 51.4736, longitude: -3.1717, placeId: '', postcode: 'CF10 1EP', city: 'Cardiff', country: 'United Kingdom' }, destination: { formattedAddress: 'Bristol Temple Meads, Bristol BS1 6QF', latitude: 51.449, longitude: -2.5813, placeId: '', postcode: 'BS1 6QF', city: 'Bristol', country: 'United Kingdom' }, viaStops: [], date: '2026-08-24', pickupTime: '13:30', passengers: 1, luggage: 2, vehicleType: 'saloon', distanceMiles: 44.0, estimatedDuration: 55, price: 52.0, discount: 5.2, tax: 9.36, total: 56.16, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
  { id: 'bk-011', data: { bookingNumber: 'UKTB-2026-000011', passengerId: 'pass-001', operatorId: 'op-002', driverId: 'drv-010', vehicleId: 'veh-010', tripType: 'one_way', pickup: { formattedAddress: 'Manchester Airport, Manchester M90 1QX', latitude: 53.4794, longitude: -2.2453, placeId: '', postcode: 'M90 1QX', city: 'Manchester', country: 'United Kingdom' }, destination: { formattedAddress: 'Birmingham New Street, Birmingham B2 4QA', latitude: 52.4776, longitude: -1.9081, placeId: '', postcode: 'B2 4QA', city: 'Birmingham', country: 'United Kingdom' }, viaStops: [], date: '2026-08-30', pickupTime: '16:45', passengers: 2, luggage: 3, vehicleType: 'saloon', distanceMiles: 86.0, estimatedDuration: 115, price: 105.0, discount: 0, tax: 21.0, total: 126.0, currency: 'GBP', paymentStatus: 'pending', bookingStatus: 'pending_payment' } },
  { id: 'bk-012', data: { bookingNumber: 'UKTB-2026-000012', passengerId: 'pass-002', operatorId: 'op-001', driverId: 'drv-002', vehicleId: 'veh-002', tripType: 'return', pickup: { formattedAddress: '1 Manchester Square, London W1U 3PH', latitude: 51.5141, longitude: -0.1535, placeId: '', postcode: 'W1U 3PH', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: 'London Gatwick Airport, RH6 0NN', latitude: 51.1537, longitude: -0.1821, placeId: '', postcode: 'RH6 0NN', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-09-01', pickupTime: '04:30', returnDate: '2026-09-05', returnTime: '20:00', passengers: 1, luggage: 2, vehicleType: 'executive', distanceMiles: 30.2, estimatedDuration: 55, price: 68.0, discount: 0, tax: 13.6, total: 81.6, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-013', data: { bookingNumber: 'UKTB-2026-000013', passengerId: 'pass-003', operatorId: 'op-003', driverId: 'drv-005', vehicleId: 'veh-005', tripType: 'one_way', pickup: { formattedAddress: 'Glasgow Central Station, Glasgow G1 1AE', latitude: 55.8596, longitude: -4.2581, placeId: '', postcode: 'G1 1AE', city: 'Glasgow', country: 'United Kingdom' }, destination: { formattedAddress: 'Edinburgh Airport, Edinburgh EH12 9DN', latitude: 55.95, longitude: -3.3725, placeId: '', postcode: 'EH12 9DN', city: 'Edinburgh', country: 'United Kingdom' }, viaStops: [], date: '2026-08-28', pickupTime: '08:00', passengers: 1, luggage: 1, vehicleType: 'wheelchair_accessible', distanceMiles: 47.0, estimatedDuration: 60, price: 52.0, discount: 5.2, tax: 9.36, total: 56.16, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-014', data: { bookingNumber: 'UKTB-2026-000014', passengerId: 'pass-004', operatorId: 'op-001', driverId: 'drv-009', vehicleId: 'veh-009', tripType: 'one_way', pickup: { formattedAddress: 'Bristol Temple Meads, Bristol BS1 6QF', latitude: 51.449, longitude: -2.5813, placeId: '', postcode: 'BS1 6QF', city: 'Bristol', country: 'United Kingdom' }, destination: { formattedAddress: 'Cardiff Central Station, Cardiff CF10 1EP', latitude: 51.4736, longitude: -3.1717, placeId: '', postcode: 'CF10 1EP', city: 'Cardiff', country: 'United Kingdom' }, viaStops: [], date: '2026-08-25', pickupTime: '19:00', passengers: 3, luggage: 2, vehicleType: 'mpv', distanceMiles: 44.0, estimatedDuration: 55, price: 62.0, discount: 0, tax: 12.4, total: 74.4, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'confirmed' } },
  { id: 'bk-015', data: { bookingNumber: 'UKTB-2026-000015', passengerId: 'pass-005', operatorId: 'op-003', driverId: 'drv-008', vehicleId: 'veh-008', tripType: 'one_way', pickup: { formattedAddress: 'Edinburgh Airport, Edinburgh EH12 9DN', latitude: 55.95, longitude: -3.3725, placeId: '', postcode: 'EH12 9DN', city: 'Edinburgh', country: 'United Kingdom' }, destination: { formattedAddress: 'Waverley Station, Edinburgh EH1 1BZ', latitude: 55.9521, longitude: -3.189, placeId: '', postcode: 'EH1 1BZ', city: 'Edinburgh', country: 'United Kingdom' }, viaStops: [], date: '2026-08-25', pickupTime: '21:30', passengers: 2, luggage: 2, vehicleType: 'mpv', distanceMiles: 8.5, estimatedDuration: 22, price: 20.0, discount: 0, tax: 4.0, total: 24.0, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
  { id: 'bk-016', data: { bookingNumber: 'UKTB-2026-000016', passengerId: 'pass-001', operatorId: 'op-001', driverId: 'drv-006', vehicleId: 'veh-006', tripType: 'one_way', pickup: { formattedAddress: 'Liverpool ONE, Liverpool L1 8JQ', latitude: 53.4026, longitude: -2.9913, placeId: '', postcode: 'L1 8JQ', city: 'Liverpool', country: 'United Kingdom' }, destination: { formattedAddress: 'Birmingham New Street, Birmingham B2 4QA', latitude: 52.4776, longitude: -1.9081, placeId: '', postcode: 'B2 4QA', city: 'Birmingham', country: 'United Kingdom' }, viaStops: [], date: '2026-09-02', pickupTime: '10:00', passengers: 1, luggage: 1, vehicleType: 'electric', distanceMiles: 87.0, estimatedDuration: 110, price: 88.0, discount: 0, tax: 17.6, total: 105.6, currency: 'GBP', paymentStatus: 'pending', bookingStatus: 'pending_payment' } },
  { id: 'bk-017', data: { bookingNumber: 'UKTB-2026-000017', passengerId: 'pass-002', operatorId: 'op-002', driverId: 'drv-003', vehicleId: 'veh-003', tripType: 'one_way', pickup: { formattedAddress: 'Birmingham New Street, Birmingham B2 4QA', latitude: 52.4776, longitude: -1.9081, placeId: '', postcode: 'B2 4QA', city: 'Birmingham', country: 'United Kingdom' }, destination: { formattedAddress: 'Birmingham Airport, Birmingham B26 3QJ', latitude: 52.4539, longitude: -1.748, placeId: '', postcode: 'B26 3QJ', city: 'Birmingham', country: 'United Kingdom' }, viaStops: [], date: '2026-08-23', pickupTime: '06:00', passengers: 1, luggage: 1, vehicleType: 'estate', distanceMiles: 7.8, estimatedDuration: 20, price: 19.0, discount: 0, tax: 3.8, total: 22.8, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
  { id: 'bk-018', data: { bookingNumber: 'UKTB-2026-000018', passengerId: 'pass-003', operatorId: 'op-001', driverId: 'drv-001', vehicleId: 'veh-001', tripType: 'one_way', pickup: { formattedAddress: '10 Downing Street, London SW1A 2AA', latitude: 51.5034, longitude: -0.1276, placeId: '', postcode: 'SW1A 2AA', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: 'London City Airport, London E16 2PX', latitude: 51.5053, longitude: 0.0553, placeId: '', postcode: 'E16 2PX', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-08-22', pickupTime: '12:00', passengers: 1, luggage: 0, vehicleType: 'saloon', distanceMiles: 6.2, estimatedDuration: 22, price: 16.0, discount: 0, tax: 3.2, total: 19.2, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
  { id: 'bk-019', data: { bookingNumber: 'UKTB-2026-000019', passengerId: 'pass-004', operatorId: 'op-003', driverId: 'drv-005', vehicleId: 'veh-005', tripType: 'one_way', pickup: { formattedAddress: 'Cardiff Central Station, Cardiff CF10 1EP', latitude: 51.4736, longitude: -3.1717, placeId: '', postcode: 'CF10 1EP', city: 'Cardiff', country: 'United Kingdom' }, destination: { formattedAddress: 'Bristol Temple Meads, Bristol BS1 6QF', latitude: 51.449, longitude: -2.5813, placeId: '', postcode: 'BS1 6QF', city: 'Bristol', country: 'United Kingdom' }, viaStops: [], date: '2026-08-20', pickupTime: '14:30', passengers: 1, luggage: 2, vehicleType: 'wheelchair_accessible', distanceMiles: 44.0, estimatedDuration: 55, price: 48.0, discount: 4.8, tax: 8.64, total: 51.84, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
  { id: 'bk-020', data: { bookingNumber: 'UKTB-2026-000020', passengerId: 'pass-005', operatorId: 'op-001', driverId: 'drv-002', vehicleId: 'veh-002', tripType: 'one_way', pickup: { formattedAddress: '1 Manchester Square, London W1U 3PH', latitude: 51.5141, longitude: -0.1535, placeId: '', postcode: 'W1U 3PH', city: 'London', country: 'United Kingdom' }, destination: { formattedAddress: 'London Heathrow Airport T5, London UB6 8JH', latitude: 51.47, longitude: -0.4543, placeId: '', postcode: 'UB6 8JH', city: 'London', country: 'United Kingdom' }, viaStops: [], date: '2026-08-21', pickupTime: '22:30', passengers: 2, luggage: 4, vehicleType: 'executive', distanceMiles: 18.4, estimatedDuration: 45, price: 55.0, discount: 0, tax: 11.0, total: 66.0, currency: 'GBP', paymentStatus: 'completed', bookingStatus: 'completed' } },
]

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

const quotes = [
  { id: 'qt-001', data: { bookingId: 'UKTB-2026-000004', operatorId: 'op-001', operatorName: 'Kingsley Travel', vehicleType: 'minibus', vehicleDescription: 'VW Caravelle Minibus - 7 Seats', passengerCapacity: 7, luggageCapacity: 6, rating: 4.8, totalReviews: 3245, estimatedJourneyTime: 35, isElectric: false, isHybrid: false, price: 45.6, paymentTypes: ['card', 'cash'], features: ['Free waiting time', 'Meet and greet'], isLowestPrice: true } },
  { id: 'qt-002', data: { bookingId: 'UKTB-2026-000004', operatorId: 'op-002', operatorName: 'Northern Taxi Services', vehicleType: 'mpv', vehicleDescription: 'Ford Galaxy MPV - 6 Seats', passengerCapacity: 6, luggageCapacity: 5, rating: 4.6, totalReviews: 1890, estimatedJourneyTime: 40, isElectric: false, isHybrid: true, price: 48.2, originalPrice: 52.0, discountPercent: 7, paymentTypes: ['card', 'cash'], features: ['Free waiting time', 'Hybrid vehicle'], isLowestPrice: false } },
  { id: 'qt-003', data: { bookingId: 'UKTB-2026-000004', operatorId: 'op-003', operatorName: 'Capital Taxis Edinburgh', vehicleType: 'minibus', vehicleDescription: 'Mercedes Vito Minibus - 8 Seats', passengerCapacity: 8, luggageCapacity: 7, rating: 4.7, totalReviews: 987, estimatedJourneyTime: 32, isElectric: false, isHybrid: false, price: 51.0, paymentTypes: ['card', 'cash', 'apple_pay'], features: ['Free waiting time', 'Meet and greet'], isLowestPrice: false } },
  { id: 'qt-004', data: { bookingId: 'UKTB-2026-000002', operatorId: 'op-001', operatorName: 'Kingsley Travel', vehicleType: 'executive', vehicleDescription: 'Mercedes E-Class', passengerCapacity: 3, luggageCapacity: 2, rating: 4.8, totalReviews: 3245, estimatedJourneyTime: 15, isElectric: false, isHybrid: false, price: 11.52, paymentTypes: ['card', 'cash'], features: ['Free waiting time'], isLowestPrice: true } },
  { id: 'qt-005', data: { bookingId: 'UKTB-2026-000006', operatorId: 'op-001', operatorName: 'Kingsley Travel', vehicleType: 'saloon', vehicleDescription: 'Toyota Prius Electric', passengerCapacity: 3, luggageCapacity: 2, rating: 4.9, totalReviews: 847, estimatedJourneyTime: 18, isElectric: true, isHybrid: true, price: 13.8, paymentTypes: ['card', 'cash', 'apple_pay'], features: ['Zero emissions', 'Free waiting time'], isLowestPrice: true } },
  { id: 'qt-006', data: { bookingId: 'UKTB-2026-000003', operatorId: 'op-002', operatorName: 'Northern Taxi Services', vehicleType: 'estate', vehicleDescription: 'Ford Mondeo Estate', passengerCapacity: 3, luggageCapacity: 4, rating: 4.7, totalReviews: 312, estimatedJourneyTime: 120, isElectric: false, isHybrid: true, price: 102.6, paymentTypes: ['card', 'cash'], features: ['Free waiting time', 'Hybrid vehicle', 'Large luggage space'], isLowestPrice: true } },
  { id: 'qt-007', data: { bookingId: 'UKTB-2026-000005', operatorId: 'op-003', operatorName: 'Capital Taxis Edinburgh', vehicleType: 'wheelchair_accessible', vehicleDescription: 'Citroen Berlingo WAV', passengerCapacity: 2, luggageCapacity: 1, rating: 4.9, totalReviews: 456, estimatedJourneyTime: 65, isElectric: false, isHybrid: false, price: 59.4, paymentTypes: ['card', 'cash', 'apple_pay'], features: ['Wheelchair ramp', 'Free waiting time'], isLowestPrice: true } },
  { id: 'qt-008', data: { bookingId: 'UKTB-2026-000007', operatorId: 'op-003', operatorName: 'Capital Taxis Edinburgh', vehicleType: 'mpv', vehicleDescription: 'Toyota Verso MPV - 5 Seats', passengerCapacity: 5, luggageCapacity: 3, rating: 4.6, totalReviews: 198, estimatedJourneyTime: 22, isElectric: false, isHybrid: false, price: 26.4, paymentTypes: ['card', 'cash'], features: ['Free waiting time'], isLowestPrice: true } },
  { id: 'qt-009', data: { bookingId: 'UKTB-2026-000001', operatorId: 'op-001', operatorName: 'Kingsley Travel', vehicleType: 'executive', vehicleDescription: 'Mercedes E-Class', passengerCapacity: 3, luggageCapacity: 2, rating: 4.8, totalReviews: 3245, estimatedJourneyTime: 45, isElectric: false, isHybrid: false, price: 51.0, paymentTypes: ['card', 'cash'], features: ['Meet and greet', 'Free waiting time', 'Flight tracking'], isLowestPrice: true } },
  { id: 'qt-010', data: { bookingId: 'UKTB-2026-000008', operatorId: 'op-001', operatorName: 'Kingsley Travel', vehicleType: 'mpv', vehicleDescription: 'Ford Galaxy MPV - 6 Seats', passengerCapacity: 6, luggageCapacity: 4, rating: 4.7, totalReviews: 356, estimatedJourneyTime: 50, isElectric: false, isHybrid: false, price: 62.64, paymentTypes: ['card', 'cash'], features: ['Free waiting time'], isLowestPrice: true } },
  { id: 'qt-011', data: { bookingId: 'UKTB-2026-000008', operatorId: 'op-002', operatorName: 'Northern Taxi Services', vehicleType: 'mpv', vehicleDescription: 'VW Touran MPV', passengerCapacity: 6, luggageCapacity: 4, rating: 4.6, totalReviews: 1890, estimatedJourneyTime: 55, isElectric: false, isHybrid: false, price: 68.5, paymentTypes: ['card', 'cash'], features: ['Free waiting time'], isLowestPrice: false } },
  { id: 'qt-012', data: { bookingId: 'UKTB-2026-000012', operatorId: 'op-001', operatorName: 'Kingsley Travel', vehicleType: 'executive', vehicleDescription: 'Mercedes E-Class', passengerCapacity: 3, luggageCapacity: 2, rating: 4.8, totalReviews: 3245, estimatedJourneyTime: 55, isElectric: false, isHybrid: false, price: 81.6, paymentTypes: ['card', 'cash'], features: ['Meet and greet', 'Free waiting time'], isLowestPrice: true } },
  { id: 'qt-013', data: { bookingId: 'UKTB-2026-000012', operatorId: 'op-002', operatorName: 'Northern Taxi Services', vehicleType: 'executive', vehicleDescription: 'BMW 5 Series', passengerCapacity: 3, luggageCapacity: 2, rating: 4.5, totalReviews: 410, estimatedJourneyTime: 60, isElectric: false, isHybrid: false, price: 88.0, paymentTypes: ['card', 'cash'], features: ['Free waiting time'], isLowestPrice: false } },
  { id: 'qt-014', data: { bookingId: 'UKTB-2026-000001', operatorId: 'op-003', operatorName: 'Capital Taxis Edinburgh', vehicleType: 'saloon', vehicleDescription: 'Toyota Prius', passengerCapacity: 3, luggageCapacity: 2, rating: 4.7, totalReviews: 987, estimatedJourneyTime: 50, isElectric: true, isHybrid: true, price: 45.0, paymentTypes: ['card', 'cash', 'apple_pay'], features: ['Zero emissions', 'Free waiting time'], isLowestPrice: false } },
  { id: 'qt-015', data: { bookingId: 'UKTB-2026-000003', operatorId: 'op-003', operatorName: 'Capital Taxis Edinburgh', vehicleType: 'estate', vehicleDescription: 'Kia Niro Estate', passengerCapacity: 3, luggageCapacity: 4, rating: 4.7, totalReviews: 987, estimatedJourneyTime: 130, isElectric: true, isHybrid: true, price: 98.0, paymentTypes: ['card', 'cash', 'apple_pay'], features: ['Zero emissions', 'Free waiting time'], isLowestPrice: false } },
]

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const reviews = [
  { id: 'rev-001', data: { bookingId: 'UKTB-2026-000001', passengerId: 'pass-001', driverId: 'drv-001', operatorId: 'op-001', rating: 5, comment: 'Brilliant service. Mohammed was on time, car spotless, helped with bags to terminal.', createdAt: '2026-08-26T08:00:00Z', isApproved: true } },
  { id: 'rev-002', data: { bookingId: 'UKTB-2026-000003', passengerId: 'pass-003', driverId: 'drv-003', operatorId: 'op-002', rating: 4, comment: 'Good trip to Manchester Airport. Driver friendly and knew the route well.', createdAt: '2026-08-20T12:30:00Z', isApproved: true } },
  { id: 'rev-003', data: { bookingId: 'UKTB-2026-000005', passengerId: 'pass-005', driverId: 'drv-005', operatorId: 'op-003', rating: 5, comment: 'Linda was incredible on the Edinburgh-Glasgow journey. Very patient with my wheelchair.', createdAt: '2026-08-24T15:00:00Z', isApproved: true } },
  { id: 'rev-004', data: { bookingId: 'UKTB-2026-000009', passengerId: 'pass-004', driverId: 'drv-007', operatorId: 'op-002', rating: 5, comment: 'Priya was fantastic. Professional, courteous, car beautifully clean. Highly recommend.', createdAt: '2026-08-26T09:30:00Z', isApproved: true } },
  { id: 'rev-005', data: { bookingId: 'UKTB-2026-000010', passengerId: 'pass-005', driverId: 'drv-001', operatorId: 'op-001', rating: 4, comment: 'Reliable Cardiff to Bristol trip. Comfortable car, minor traffic delay but happy overall.', createdAt: '2026-08-24T16:00:00Z', isApproved: true } },
  { id: 'rev-006', data: { bookingId: 'UKTB-2026-000015', passengerId: 'pass-005', driverId: 'drv-008', operatorId: 'op-003', rating: 4, comment: 'Quick airport transfer. Clean MPV, friendly driver. Would use again.', createdAt: '2026-08-25T22:30:00Z', isApproved: true } },
  { id: 'rev-007', data: { bookingId: 'UKTB-2026-000017', passengerId: 'pass-002', driverId: 'drv-003', operatorId: 'op-002', rating: 5, comment: 'Excellent Birmingham airport run. On time and very professional.', createdAt: '2026-08-23T08:00:00Z', isApproved: true } },
  { id: 'rev-008', data: { bookingId: 'UKTB-2026-000018', passengerId: 'pass-003', driverId: 'drv-001', operatorId: 'op-001', rating: 4, comment: 'Good short trip across London. Driver knew the back streets to avoid traffic.', createdAt: '2026-08-22T13:30:00Z', isApproved: true } },
  { id: 'rev-009', data: { bookingId: 'UKTB-2026-000019', passengerId: 'pass-004', driverId: 'drv-005', operatorId: 'op-003', rating: 5, comment: 'Linda made the wheelchair accessible transfer seamless. Outstanding service.', createdAt: '2026-08-20T16:00:00Z', isApproved: true } },
  { id: 'rev-010', data: { bookingId: 'UKTB-2026-000020', passengerId: 'pass-005', driverId: 'drv-002', operatorId: 'op-001', rating: 5, comment: 'Late night Heathrow transfer. Sarah was superb, smooth ride, luxury car. Worth every penny.', createdAt: '2026-08-21T23:45:00Z', isApproved: true } },
]

// ---------------------------------------------------------------------------
// Pricing Rules
// ---------------------------------------------------------------------------

const pricingRules = [
  { id: 'pr-001', data: { operatorId: 'op-001', vehicleType: 'saloon', baseFare: 3.0, perMile: 1.6, perMinute: 0.25, minimumFare: 5.0, bookingFee: 1.0, airportFee: 5.0, nightSurchargePercent: 20, weekendSurchargePercent: 10, peakTimeSurchargePercent: 25, congestionCharge: 15.0 } },
  { id: 'pr-002', data: { operatorId: 'op-001', vehicleType: 'executive', baseFare: 5.0, perMile: 2.2, perMinute: 0.35, minimumFare: 8.0, bookingFee: 1.5, airportFee: 5.0, nightSurchargePercent: 20, weekendSurchargePercent: 15, peakTimeSurchargePercent: 25, congestionCharge: 15.0 } },
  { id: 'pr-003', data: { operatorId: 'op-001', vehicleType: 'electric', baseFare: 2.5, perMile: 1.4, perMinute: 0.2, minimumFare: 4.5, bookingFee: 1.0, airportFee: 5.0, nightSurchargePercent: 15, weekendSurchargePercent: 10, peakTimeSurchargePercent: 20, congestionCharge: 0 } },
  { id: 'pr-004', data: { operatorId: 'op-002', vehicleType: 'saloon', baseFare: 3.5, perMile: 1.8, perMinute: 0.3, minimumFare: 5.0, bookingFee: 1.5, airportFee: 7.5, nightSurchargePercent: 25, weekendSurchargePercent: 10, peakTimeSurchargePercent: 20, congestionCharge: 0 } },
  { id: 'pr-005', data: { operatorId: 'op-002', vehicleType: 'mpv', baseFare: 4.5, perMile: 2.0, perMinute: 0.35, minimumFare: 7.0, bookingFee: 2.0, airportFee: 10.0, nightSurchargePercent: 20, weekendSurchargePercent: 15, peakTimeSurchargePercent: 25, congestionCharge: 0 } },
  { id: 'pr-006', data: { operatorId: 'op-002', vehicleType: 'estate', baseFare: 3.5, perMile: 1.8, perMinute: 0.3, minimumFare: 5.5, bookingFee: 1.5, airportFee: 7.5, nightSurchargePercent: 20, weekendSurchargePercent: 10, peakTimeSurchargePercent: 20, congestionCharge: 0 } },
  { id: 'pr-007', data: { operatorId: 'op-003', vehicleType: 'saloon', baseFare: 3.0, perMile: 1.5, perMinute: 0.25, minimumFare: 4.5, bookingFee: 1.0, airportFee: 5.0, nightSurchargePercent: 15, weekendSurchargePercent: 10, peakTimeSurchargePercent: 20, congestionCharge: 0 } },
  { id: 'pr-008', data: { operatorId: 'op-003', vehicleType: 'wheelchair_accessible', baseFare: 3.0, perMile: 1.5, perMinute: 0.25, minimumFare: 4.5, bookingFee: 0, airportFee: 5.0, nightSurchargePercent: 15, weekendSurchargePercent: 5, peakTimeSurchargePercent: 15, congestionCharge: 0 } },
  { id: 'pr-009', data: { operatorId: 'op-001', vehicleType: 'mpv', baseFare: 4.0, perMile: 2.0, perMinute: 0.3, minimumFare: 6.0, bookingFee: 2.0, airportFee: 7.5, nightSurchargePercent: 20, weekendSurchargePercent: 15, peakTimeSurchargePercent: 25, congestionCharge: 15.0 } },
  { id: 'pr-010', data: { operatorId: 'op-001', vehicleType: 'minibus', baseFare: 5.0, perMile: 2.5, perMinute: 0.4, minimumFare: 8.0, bookingFee: 2.5, airportFee: 10.0, nightSurchargePercent: 20, weekendSurchargePercent: 15, peakTimeSurchargePercent: 25, congestionCharge: 15.0 } },
  { id: 'pr-011', data: { operatorId: 'op-001', vehicleType: 'wheelchair_accessible', baseFare: 3.0, perMile: 1.5, perMinute: 0.25, minimumFare: 4.5, bookingFee: 0, airportFee: 5.0, nightSurchargePercent: 15, weekendSurchargePercent: 5, peakTimeSurchargePercent: 15, congestionCharge: 15.0 } },
  { id: 'pr-012', data: { operatorId: 'op-001', vehicleType: 'estate', baseFare: 3.5, perMile: 1.8, perMinute: 0.3, minimumFare: 5.5, bookingFee: 1.5, airportFee: 5.0, nightSurchargePercent: 20, weekendSurchargePercent: 10, peakTimeSurchargePercent: 25, congestionCharge: 15.0 } },
  { id: 'pr-013', data: { operatorId: 'op-003', vehicleType: 'mpv', baseFare: 3.5, perMile: 1.7, perMinute: 0.28, minimumFare: 5.0, bookingFee: 1.5, airportFee: 5.0, nightSurchargePercent: 15, weekendSurchargePercent: 10, peakTimeSurchargePercent: 20, congestionCharge: 0 } },
  { id: 'pr-014', data: { operatorId: 'op-003', vehicleType: 'electric', baseFare: 2.5, perMile: 1.4, perMinute: 0.2, minimumFare: 4.0, bookingFee: 1.0, airportFee: 5.0, nightSurchargePercent: 10, weekendSurchargePercent: 10, peakTimeSurchargePercent: 15, congestionCharge: 0 } },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Seeding Firebase Firestore...\n')

  console.log('Admin Users...')
  await seedCollection('users', adminUsers)

  console.log('Passengers...')
  await seedCollection('users', passengers)

  console.log('Drivers...')
  await seedCollection('users', drivers)

  console.log('Operators...')
  await seedCollection('users', operators)

  console.log('Vehicles...')
  await seedCollection('vehicles', vehicles)

  console.log('Bookings...')
  await seedCollection('bookings', bookings)

  console.log('Quotes...')
  await seedCollection('quotes', quotes)

  console.log('Reviews...')
  await seedCollection('reviews', reviews)

  console.log('Pricing Rules...')
  await seedCollection('pricingRules', pricingRules)

  console.log('\nSeeding complete.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
