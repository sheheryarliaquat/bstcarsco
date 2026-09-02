import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  onSnapshot,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Query,
  type Unsubscribe,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db as getDb } from './config';

export interface QueryCondition {
  field: string;
  operator: string;
  value: unknown;
}

const operatorMap: Record<string, Function> = {
  '==': where,
  '!=': where,
  '<': where,
  '<=': where,
  '>': where,
  '>=': where,
  'array-contains': where,
  'array-contains-any': where,
  in: where,
  'not-in': where,
};

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), collectionName), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docSnap = await getDoc(doc(getDb(), collectionName, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(getDb(), collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Writes to a fixed-ID document, creating it if it doesn't exist yet
 * (unlike updateDocument, which throws on a missing doc). Used for
 * singleton config docs like settings/pricingRates.
 */
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>,
  merge: boolean = true
): Promise<void> {
  const docRef = doc(getDb(), collectionName, id);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: new Date().toISOString(),
    },
    { merge }
  );
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(getDb(), collectionName, id));
}

export async function queryDocuments<T>(
  collectionName: string,
  conditions: QueryCondition[] = []
): Promise<T[]> {
  const constraints: QueryConstraint[] = [];

  for (const condition of conditions) {
    const opFn = operatorMap[condition.operator];
    if (opFn) {
      constraints.push(opFn(condition.field, condition.operator, condition.value));
    }
  }

  const q = query(collection(getDb(), collectionName), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T)
  );
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
  const constraints: QueryConstraint[] = [];

  for (const condition of conditions) {
    const opFn = operatorMap[condition.operator];
    if (opFn) {
      constraints.push(opFn(condition.field, condition.operator, condition.value));
    }
  }

  constraints.push(orderBy(orderField, 'desc'));
  constraints.push(firestoreLimit(pageSize + 1));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collection(getDb(), collectionName), ...constraints);
  const querySnapshot = await getDocs(q);

  const docs = querySnapshot.docs;
  const hasMore = docs.length > pageSize;
  const data = docs.slice(0, pageSize).map(
    (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T)
  );
  const lastVisible = hasMore ? docs[pageSize - 1] : null;

  return { data, lastVisible, hasMore };
}

export function onSnapshotListener<T>(
  collectionName: string,
  conditions: QueryCondition[] = [],
  callback: (data: T[]) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe {
  const constraints: QueryConstraint[] = [];

  for (const condition of conditions) {
    const opFn = operatorMap[condition.operator];
    if (opFn) {
      constraints.push(opFn(condition.field, condition.operator, condition.value));
    }
  }

  const q = query(collection(getDb(), collectionName), ...constraints);

  return onSnapshot(
    q,
    (querySnapshot: QuerySnapshot) => {
      const data = querySnapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T)
      );
      callback(data);
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    }
  );
}

export function onDocumentSnapshot<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void,
  errorCallback?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(getDb(), collectionName, id);

  return onSnapshot(
    docRef,
    (docSnap: DocumentSnapshot) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    }
  );
}

export function createBatch(): ReturnType<typeof writeBatch> {
  return writeBatch(getDb());
}

export async function batchSet<T extends DocumentData>(
  operations: {
    collectionName: string;
    id?: string;
    data: T;
  }[]
): Promise<void> {
  const batch = writeBatch(getDb());

  for (const op of operations) {
    if (op.id) {
      const docRef = doc(getDb(), op.collectionName, op.id);
      batch.set(docRef, {
        ...op.data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const colRef = collection(getDb(), op.collectionName);
      batch.set(doc(colRef), {
        ...op.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  await batch.commit();
}

export async function batchUpdate(
  operations: {
    collectionName: string;
    id: string;
    data: Partial<DocumentData>;
  }[]
): Promise<void> {
  const batch = writeBatch(getDb());

  for (const op of operations) {
    const docRef = doc(getDb(), op.collectionName, op.id);
    batch.update(docRef, {
      ...op.data,
      updatedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
}

export async function batchDelete(
  operations: {
    collectionName: string;
    id: string;
  }[]
): Promise<void> {
  const batch = writeBatch(getDb());

  for (const op of operations) {
    const docRef = doc(getDb(), op.collectionName, op.id);
    batch.delete(docRef);
  }

  await batch.commit();
}
