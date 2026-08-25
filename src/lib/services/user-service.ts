'use client';

import {
  getDocument,
  updateDocument,
  queryDocuments,
  onSnapshotListener,
} from '@/lib/firebase/firestore';
import type { User, UserRole } from '@/types';

const COLLECTION = 'users';

export async function getUser(uid: string): Promise<User | null> {
  return getDocument<User>(COLLECTION, uid);
}

export async function updateUser(
  uid: string,
  data: Partial<User>
): Promise<void> {
  await updateDocument<User>(COLLECTION, uid, data);
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  return queryDocuments<User>(COLLECTION, [
    { field: 'role', operator: '==', value: role },
  ]);
}

export async function getAllUsers(): Promise<User[]> {
  return queryDocuments<User>(COLLECTION);
}

export function listenToUsers(
  callback: (users: User[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<User>(
    COLLECTION,
    [],
    callback,
    errorCallback
  );
}

export function listenToUsersByRole(
  role: UserRole,
  callback: (users: User[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<User>(
    COLLECTION,
    [{ field: 'role', operator: '==', value: role }],
    callback,
    errorCallback
  );
}
