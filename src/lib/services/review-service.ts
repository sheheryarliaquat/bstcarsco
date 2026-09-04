'use client';

import {
  addDocument,
  queryDocuments,
  onSnapshotListener,
} from '@/lib/firebase/firestore';
import type { Review } from '@/types';

const COLLECTION = 'reviews';

export async function createReview(
  data: Omit<Review, 'id' | 'createdAt' | 'isApproved'>
): Promise<string> {
  return addDocument<Review>(COLLECTION, { ...data, isApproved: true } as Review & Record<string, unknown>);
}

export async function getReviewsByPassenger(passengerId: string): Promise<Review[]> {
  return queryDocuments<Review>(COLLECTION, [
    { field: 'passengerId', operator: '==', value: passengerId },
  ]);
}

export function listenToReviewsByPassenger(
  passengerId: string,
  callback: (reviews: Review[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<Review>(
    COLLECTION,
    [{ field: 'passengerId', operator: '==', value: passengerId }],
    callback,
    errorCallback
  );
}
