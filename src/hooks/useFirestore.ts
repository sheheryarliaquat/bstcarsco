'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDocument,
  queryDocuments,
  onDocumentSnapshot,
  onSnapshotListener,
  queryDocumentsWithPagination,
  type QueryCondition,
} from '@/lib/firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export function useDocument<T>(
  collectionName: string,
  id: string | null
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onDocumentSnapshot<T>(
      collectionName,
      id,
      (docData) => {
        setData(docData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, id]);

  return { data, loading, error };
}

export function useCollection<T>(
  collectionName: string,
  conditions: QueryCondition[] = []
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshotListener<T>(
      collectionName,
      conditions,
      (docs) => {
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(conditions)]);

  return { data, loading, error };
}

export function usePagination<T>(
  collectionName: string,
  conditions: QueryCondition[] = [],
  pageSize: number = 20
): {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchData = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const startAfterDoc = reset ? undefined : lastDoc || undefined;

      const result = await queryDocumentsWithPagination<T>(
        collectionName,
        conditions,
        'createdAt',
        pageSize,
        startAfterDoc
      );

      if (reset) {
        setData(result.data);
      } else {
        setData((prev) => [...prev, ...result.data]);
      }

      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(conditions), pageSize, lastDoc]);

  useEffect(() => {
    fetchData(true);
  }, [collectionName, JSON.stringify(conditions), pageSize]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchData(false);
    }
  }, [loading, hasMore, fetchData]);

  const refresh = useCallback(async () => {
    setLastDoc(null);
    await fetchData(true);
  }, [fetchData]);

  return { data, loading, error, hasMore, loadMore, refresh };
}
