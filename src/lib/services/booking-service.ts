'use client';

import {
  addDocument,
  getDocument,
  updateDocument,
  queryDocuments,
  onSnapshotListener,
} from '@/lib/firebase/firestore';
import type { Booking, BookingStatus, PaymentStatus } from '@/types';
import type { QueryCondition } from '@/lib/firebase/firestore';

const COLLECTION = 'bookings';

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `BSTC-${year}-${random}`;
}

export async function createBooking(
  data: Omit<Booking, 'bookingNumber' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const bookingNumber = generateBookingNumber();
  const id = await addDocument<Booking>(COLLECTION, {
    ...data,
    bookingNumber,
  } as Booking & Record<string, unknown>);
  return id;
}

export async function getBooking(id: string): Promise<Booking | null> {
  return getDocument<Booking>(COLLECTION, id);
}

export async function getBookingByNumber(
  bookingNumber: string
): Promise<Booking | null> {
  const results = await queryDocuments<Booking>(COLLECTION, [
    { field: 'bookingNumber', operator: '==', value: bookingNumber },
  ]);
  return results.length > 0 ? results[0] : null;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  extra?: Partial<Booking>
): Promise<void> {
  await updateDocument<Booking>(COLLECTION, id, {
    bookingStatus: status,
    ...extra,
  } as Partial<Booking>);
}

export async function updateBooking(
  id: string,
  data: Partial<Booking>
): Promise<void> {
  await updateDocument<Booking>(COLLECTION, id, data);
}

export async function getPassengerBookings(
  passengerId: string
): Promise<Booking[]> {
  return queryDocuments<Booking>(COLLECTION, [
    { field: 'passengerId', operator: '==', value: passengerId },
  ]);
}

export async function getDriverBookings(driverId: string): Promise<Booking[]> {
  return queryDocuments<Booking>(COLLECTION, [
    { field: 'driverId', operator: '==', value: driverId },
  ]);
}

export async function getAllBookings(): Promise<Booking[]> {
  return queryDocuments<Booking>(COLLECTION);
}

export async function getBookingsByStatus(
  status: BookingStatus
): Promise<Booking[]> {
  return queryDocuments<Booking>(COLLECTION, [
    { field: 'bookingStatus', operator: '==', value: status },
  ]);
}

export function listenToPassengerBookings(
  passengerId: string,
  callback: (bookings: Booking[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Booking>(
    COLLECTION,
    [{ field: 'passengerId', operator: '==', value: passengerId }],
    callback,
    errorCallback
  );
}

export function listenToDriverBookings(
  driverId: string,
  callback: (bookings: Booking[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Booking>(
    COLLECTION,
    [{ field: 'driverId', operator: '==', value: driverId }],
    callback,
    errorCallback
  );
}

export function listenToAllBookings(
  callback: (bookings: Booking[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Booking>(
    COLLECTION,
    [],
    callback,
    errorCallback
  );
}
