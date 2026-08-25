'use client';

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  onSnapshotListener,
} from '@/lib/firebase/firestore';
import type { Vehicle } from '@/types';

const COLLECTION = 'vehicles';

export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return addDocument<Vehicle>(COLLECTION, data as Vehicle & Record<string, unknown>);
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  return getDocument<Vehicle>(COLLECTION, id);
}

export async function updateVehicle(
  id: string,
  data: Partial<Vehicle>
): Promise<void> {
  await updateDocument<Vehicle>(COLLECTION, id, data);
}

export async function deleteVehicle(id: string): Promise<void> {
  await deleteDocument(COLLECTION, id);
}

export async function getVehiclesByOperator(
  operatorId: string
): Promise<Vehicle[]> {
  return queryDocuments<Vehicle>(COLLECTION, [
    { field: 'operatorId', operator: '==', value: operatorId },
  ]);
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  return queryDocuments<Vehicle>(COLLECTION);
}

export function listenToVehicles(
  callback: (vehicles: Vehicle[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Vehicle>(
    COLLECTION,
    [],
    callback,
    errorCallback
  );
}

export function listenToVehiclesByOperator(
  operatorId: string,
  callback: (vehicles: Vehicle[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Vehicle>(
    COLLECTION,
    [{ field: 'operatorId', operator: '==', value: operatorId }],
    callback,
    errorCallback
  );
}
