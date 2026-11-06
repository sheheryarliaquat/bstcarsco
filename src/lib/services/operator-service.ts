'use client';

import { getDocument, updateDocument, onSnapshotListener } from '@/lib/firebase/firestore';
import type { Operator } from '@/types';

// Operators live in the shared `users` collection with role === 'operator'
// (the same docs the drivers/bookings/dispatch pages read for companyName).
const COLLECTION = 'users';

export type OperatorStatus = 'active' | 'suspended';

export async function getOperator(uid: string): Promise<Operator | null> {
  return getDocument<Operator>(COLLECTION, uid);
}

export async function updateOperator(uid: string, data: Partial<Operator>): Promise<void> {
  await updateDocument<Operator>(COLLECTION, uid, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function setOperatorStatus(uid: string, status: OperatorStatus): Promise<void> {
  await updateDocument<Operator>(COLLECTION, uid, {
    status,
    active: status === 'active',
    updatedAt: new Date().toISOString(),
  } as Partial<Operator>);
}

export function listenToOperators(
  callback: (operators: Operator[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Operator>(
    COLLECTION,
    [{ field: 'role', operator: '==', value: 'operator' }],
    callback,
    errorCallback
  );
}
