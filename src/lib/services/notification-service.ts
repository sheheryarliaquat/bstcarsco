'use client';

import {
  addDocument,
  updateDocument,
  queryDocuments,
  onSnapshotListener,
} from '@/lib/firebase/firestore';
import type { Notification } from '@/types';

const COLLECTION = 'notifications';

export async function createNotification(
  data: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> {
  return addDocument<Notification>(COLLECTION, data as Notification & Record<string, unknown>);
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDocument<Notification>(COLLECTION, id, { read: true });
}

export async function markAllNotificationsRead(
  userId: string
): Promise<void> {
  const notifications = await queryDocuments<Notification>(COLLECTION, [
    { field: 'userId', operator: '==', value: userId },
    { field: 'read', operator: '==', value: false },
  ]);
  const updates = notifications.map((n) =>
    updateDocument(COLLECTION, n.id, { read: true })
  );
  await Promise.all(updates);
}

export async function getUserNotifications(
  userId: string
): Promise<Notification[]> {
  return queryDocuments<Notification>(COLLECTION, [
    { field: 'userId', operator: '==', value: userId },
  ]);
}

export function listenToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Notification>(
    COLLECTION,
    [{ field: 'userId', operator: '==', value: userId }],
    callback,
    errorCallback
  );
}
