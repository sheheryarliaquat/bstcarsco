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
import type { Vehicle, VehicleType } from '@/types';

const COLLECTION = 'vehicles';
const SETTINGS_COLLECTION = 'settings';
const RATES_DOC_ID = 'vehicleRates';

export interface VehicleRate {
  vehicleType: VehicleType;
  label: string;
  baseFare: number;
  perMile: number;
  perMinute: number;
  minimumFare: number;
  bookingFee: number;
}

/** Per-mile rates used until the admin saves their own in Vehicles & Rates. */
export const DEFAULT_VEHICLE_RATES: VehicleRate[] = [
  { vehicleType: 'saloon', label: 'Saloon', baseFare: 3.0, perMile: 1.8, perMinute: 0.25, minimumFare: 5.0, bookingFee: 1.0 },
  { vehicleType: 'executive', label: 'Executive', baseFare: 5.0, perMile: 2.5, perMinute: 0.35, minimumFare: 8.0, bookingFee: 1.5 },
  { vehicleType: 'estate', label: 'Estate', baseFare: 3.5, perMile: 2.0, perMinute: 0.28, minimumFare: 6.0, bookingFee: 1.0 },
  { vehicleType: 'mpv', label: 'MPV (6 Seater)', baseFare: 5.0, perMile: 2.2, perMinute: 0.30, minimumFare: 8.0, bookingFee: 1.5 },
  { vehicleType: 'minibus', label: 'Minibus (8 Seater)', baseFare: 7.0, perMile: 2.8, perMinute: 0.40, minimumFare: 12.0, bookingFee: 2.0 },
  { vehicleType: 'electric', label: 'Electric', baseFare: 3.0, perMile: 1.6, perMinute: 0.22, minimumFare: 5.0, bookingFee: 1.0 },
  { vehicleType: 'wheelchair_accessible', label: 'Wheelchair Accessible', baseFare: 4.0, perMile: 2.0, perMinute: 0.28, minimumFare: 6.0, bookingFee: 1.0 },
]

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

export async function getVehicleRates(): Promise<VehicleRate[] | null> {
  const doc = await getDocument<{ rates: VehicleRate[] }>(SETTINGS_COLLECTION, RATES_DOC_ID);
  return doc?.rates ?? null;
}

export async function saveVehicleRates(rates: VehicleRate[]): Promise<void> {
  await batchSet([{ collectionName: SETTINGS_COLLECTION, id: RATES_DOC_ID, data: { rates } }]);
}
