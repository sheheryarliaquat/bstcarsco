// Document storage for the site — now backed by the GoDaddy MySQL database
// through /api/db (see src/app/api/db/[action]/route.ts), not Firestore.
//
// The file keeps its old path and function names so the rest of the site
// is unchanged. Real-time listeners (onSnapshotListener/onDocumentSnapshot)
// now poll the server every few seconds while the tab is visible.

import { apiPost } from '@/lib/api-client';

// Same shape as Firebase's DocumentData, so existing typed models still fit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DocumentData = { [field: string]: any };

export interface QueryCondition {
  field: string;
  operator: string;
  value: unknown;
}

/** Where a page of results ended; pass it back to get the next page. */
export interface QueryDocumentSnapshot<T = DocumentData> {
  id: string;
  data?: T;
}

export type Unsubscribe = () => void;

const POLL_MS = 4000;

function toPlain(value: unknown): unknown {
  // Dates become ISO strings, matching how documents were written before.
  return JSON.parse(JSON.stringify(value ?? null));
}

async function write(ops: unknown[]): Promise<string[]> {
  const { ids } = await apiPost<{ ids: string[] }>('/api/db/write', { ops: toPlain(ops) });
  return ids;
}

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const now = new Date().toISOString();
  const [id] = await write([
    { type: 'add', collection: collectionName, data: { ...data, createdAt: now, updatedAt: now } },
  ]);
  return id;
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const { doc } = await apiPost<{ doc: (T & { id: string }) | null }>('/api/db/get', {
    collection: collectionName,
    id,
  });
  return doc;
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  await write([
    { type: 'update', collection: collectionName, id, data: { ...data, updatedAt: new Date().toISOString() } },
  ]);
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  await write([{ type: 'delete', collection: collectionName, id }]);
}

export async function queryDocuments<T>(
  collectionName: string,
  conditions: QueryCondition[] = []
): Promise<T[]> {
  const { docs } = await apiPost<{ docs: T[] }>('/api/db/query', {
    collection: collectionName,
    conditions: toPlain(conditions),
  });
  return docs;
}

export async function queryDocumentsWithPagination<T>(
  collectionName: string,
  conditions: QueryCondition[] = [],
  orderField: string = 'createdAt',
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  data: T[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  const { docs, hasMore } = await apiPost<{ docs: (T & { id: string })[]; hasMore: boolean }>('/api/db/query', {
    collection: collectionName,
    conditions: toPlain(conditions),
    orderBy: orderField,
    direction: 'desc',
    limit: pageSize,
    startAfterId: lastDoc?.id,
  });
  const last = docs[docs.length - 1];
  return {
    data: docs,
    lastVisible: hasMore && last ? { id: last.id } : null,
    hasMore,
  };
}

/** Calls `load` now and then every few seconds; `callback` runs only when the result changes. */
function poll<R>(
  load: () => Promise<R>,
  callback: (data: R) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let last: string | null = null;

  const tick = async () => {
    if (stopped) return;
    const visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    if (visible || last === null) {
      try {
        const data = await load();
        const snapshot = JSON.stringify(data);
        if (!stopped && snapshot !== last) {
          last = snapshot;
          callback(data);
        }
      } catch (err) {
        if (!stopped && errorCallback) errorCallback(err instanceof Error ? err : new Error(String(err)));
      }
    }
    if (!stopped) timer = setTimeout(tick, POLL_MS);
  };

  const onVisible = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && timer) {
      clearTimeout(timer);
      void tick();
    }
  };

  void tick();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
  };
}

export function onSnapshotListener<T>(
  collectionName: string,
  conditions: QueryCondition[] = [],
  callback: (data: T[]) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe {
  return poll(() => queryDocuments<T>(collectionName, conditions), callback, errorCallback);
}

export function onDocumentSnapshot<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe {
  return poll(() => getDocument<T>(collectionName, id), callback, errorCallback);
}

/** Collects writes and saves them together (all-or-nothing) on commit(). */
export function createBatch() {
  const ops: unknown[] = [];
  return {
    set(collectionName: string, id: string, data: DocumentData) {
      ops.push({ type: 'set', collection: collectionName, id, data });
    },
    update(collectionName: string, id: string, data: DocumentData) {
      ops.push({ type: 'update', collection: collectionName, id, data });
    },
    delete(collectionName: string, id: string) {
      ops.push({ type: 'delete', collection: collectionName, id });
    },
    async commit(): Promise<void> {
      if (ops.length) await write(ops);
    },
  };
}

export async function batchSet<T extends DocumentData>(
  operations: {
    collectionName: string;
    id?: string;
    data: T;
  }[]
): Promise<void> {
  const now = new Date().toISOString();
  await write(
    operations.map((op) =>
      op.id
        ? { type: 'set', collection: op.collectionName, id: op.id, data: { ...op.data, updatedAt: now } }
        : { type: 'add', collection: op.collectionName, data: { ...op.data, createdAt: now, updatedAt: now } }
    )
  );
}

export async function batchUpdate(
  operations: {
    collectionName: string;
    id: string;
    data: Partial<DocumentData>;
  }[]
): Promise<void> {
  const now = new Date().toISOString();
  await write(
    operations.map((op) => ({
      type: 'update',
      collection: op.collectionName,
      id: op.id,
      data: { ...op.data, updatedAt: now },
    }))
  );
}

export async function batchDelete(
  operations: {
    collectionName: string;
    id: string;
  }[]
): Promise<void> {
  await write(operations.map((op) => ({ type: 'delete', collection: op.collectionName, id: op.id })));
}
