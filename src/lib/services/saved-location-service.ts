'use client';

import {
  addDocument,
  updateDocument,
  deleteDocument,
  onSnapshotListener,
} from '@/lib/firebase/firestore';
import type { SavedLocation } from '@/types';

const COLLECTION = 'saved_locations';

export async function createSavedLocation(
  data: Omit<SavedLocation, 'id'>
): Promise<string> {
  // The security rule (written for a different original schema) requires
  // `address` and `isDefault` keys to be present alongside this type's
  // actual fields — included here without changing SavedLocation itself.
  return addDocument<Omit<SavedLocation, 'id'> & Record<string, unknown>>(COLLECTION, {
    ...data,
    address: data.location.formattedAddress,
    isDefault: false,
  });
}

export async function updateSavedLocation(
  id: string,
  data: Partial<SavedLocation>
): Promise<void> {
  await updateDocument<SavedLocation>(COLLECTION, id, data);
}

export async function deleteSavedLocation(id: string): Promise<void> {
  await deleteDocument(COLLECTION, id);
}

export function listenToSavedLocations(
  userId: string,
  callback: (locations: SavedLocation[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<SavedLocation>(
    COLLECTION,
    [{ field: 'userId', operator: '==', value: userId }],
    callback,
    errorCallback
  );
}
