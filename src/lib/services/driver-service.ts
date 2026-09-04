'use client';

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  onSnapshotListener,
  batchSet,
} from '@/lib/firebase/firestore';
import type { Driver } from '@/types';

const COLLECTION = 'drivers';

export async function createDriver(
  data: Omit<Driver, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = await addDocument<Driver>(COLLECTION, data as Driver & Record<string, unknown>);
  // The Driver type's identity field is `uid` (it extends User), but a
  // freshly created Firestore doc only knows its own id after the write —
  // patch it in so every consumer can rely on driver.uid being populated,
  // same as every other Driver record.
  await updateDocument<Driver>(COLLECTION, id, { uid: id } as Partial<Driver>);
  return id;
}

/**
 * Writes a driver profile at a caller-chosen document id — used when the
 * driver already has a real Firebase Auth uid (see createDriverAccount in
 * lib/firebase/auth.ts) so the drivers/{uid} doc can be looked up directly
 * from the signed-in driver's own session instead of needing a separate
 * lookup/link step.
 */
export async function setDriverProfile(
  uid: string,
  data: Omit<Driver, 'createdAt' | 'updatedAt'>
): Promise<void> {
  await batchSet([{ collectionName: COLLECTION, id: uid, data }]);
}

export async function getDriver(id: string): Promise<Driver | null> {
  return getDocument<Driver>(COLLECTION, id);
}

export async function updateDriver(
  id: string,
  data: Partial<Driver>
): Promise<void> {
  await updateDocument<Driver>(COLLECTION, id, data);
}

export async function deleteDriver(id: string): Promise<void> {
  await deleteDocument(COLLECTION, id);
}

export async function getDriversByOperator(operatorId: string): Promise<Driver[]> {
  return queryDocuments<Driver>(COLLECTION, [
    { field: 'operatorId', operator: '==', value: operatorId },
  ]);
}

export async function getAllDrivers(): Promise<Driver[]> {
  return queryDocuments<Driver>(COLLECTION);
}

export function listenToDrivers(
  callback: (drivers: Driver[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Driver>(COLLECTION, [], callback, errorCallback);
}
