'use client';

import {
  batchSet,
  deleteDocument,
  onSnapshotListener,
  updateDocument,
} from '@/lib/firebase/firestore';
import { deleteFile, uploadFileWithProgress } from '@/lib/firebase/storage';
import type { DocumentStatus, DriverDocument } from '@/types';

/**
 * Driver documents live in their own top-level collection (one record per
 * driver per document type) rather than in the drivers/{id}.documents array:
 * Firestore rules only let admins write driver profiles, while drivers need
 * to submit their own documents (as 'pending' only — see firestore.rules).
 */
const COLLECTION = 'driverDocuments';

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = 'application/pdf,image/*';

export function documentTypeSlug(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'other'
  );
}

export function driverDocumentId(driverId: string, documentType: string): string {
  return `${driverId}__${documentTypeSlug(documentType)}`;
}

/** 'expired' is derived from the expiry date, whatever the stored status. */
export function effectiveStatus(doc: Pick<DriverDocument, 'status' | 'expiryDate'>): DocumentStatus {
  if (doc.expiryDate && new Date(doc.expiryDate) < startOfToday()) return 'expired';
  return doc.status;
}

export function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - startOfToday().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function withId(docs: (DriverDocument & { id?: string })[]): DriverDocument[] {
  return docs.map((d) => ({ ...d, id: d.id }));
}

export function listenToDriverDocuments(
  driverId: string,
  callback: (docs: DriverDocument[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<DriverDocument>(
    COLLECTION,
    [{ field: 'driverId', operator: '==', value: driverId }],
    (docs) => callback(withId(docs)),
    errorCallback
  );
}

export function listenToAllDriverDocuments(
  callback: (docs: DriverDocument[]) => void,
  errorCallback?: (error: Error) => void
) {
  return onSnapshotListener<DriverDocument>(COLLECTION, [], (docs) => callback(withId(docs)), errorCallback);
}

export interface SaveDriverDocumentInput {
  driverId: string;
  driverName: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  /** New file to upload. Omit to keep the existing file (edit details only). */
  file?: File | null;
  /** The record being replaced, if any. */
  existing?: DriverDocument | null;
  /** Admin uploads are approved straight away; driver uploads go to review. */
  asAdmin: boolean;
  reviewerId?: string;
  onProgress?: (percentage: number) => void;
}

// If an upload makes no progress for this long, give up with a clear error
// instead of sitting at 0% forever (happens when Storage rules block the
// write, or Firebase Storage isn't enabled for the project).
const UPLOAD_STALL_MS = 30_000;

function friendlyUploadError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'storage/unauthorized') {
    return new Error('Upload blocked by Firebase Storage permissions. The latest storage.rules need to be deployed.');
  }
  if (code === 'storage/canceled') {
    return new Error('Upload stalled and was cancelled. Check that Firebase Storage is enabled and storage.rules are deployed, then try again.');
  }
  if (code === 'storage/quota-exceeded') {
    return new Error('Firebase Storage quota exceeded.');
  }
  return err instanceof Error ? err : new Error('Upload failed. Please try again.');
}

function uploadWithProgress(path: string, file: File, onProgress?: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = uploadFileWithProgress(
      path,
      file,
      (p) => {
        onProgress?.(Math.round(p.percentage));
        armTimer();
      },
      (err) => {
        clearTimeout(timer);
        reject(friendlyUploadError(err));
      },
      (url) => {
        clearTimeout(timer);
        resolve(url);
      }
    );
    function armTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => task.cancel(), UPLOAD_STALL_MS);
    }
    armTimer();
  });
}

export async function saveDriverDocument(input: SaveDriverDocumentInput): Promise<DriverDocument> {
  const { driverId, documentType, existing, file, asAdmin } = input;

  if (!file && !existing?.fileURL) {
    throw new Error('Please choose a file to upload.');
  }
  if (file && file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('File is too large — the limit is 10 MB.');
  }
  if (file && !(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
    throw new Error('Only PDF or image files can be uploaded.');
  }

  const slug = documentTypeSlug(documentType);
  const id = driverDocumentId(driverId, documentType);
  const now = new Date().toISOString();

  let fileURL = existing?.fileURL ?? '';
  let filePath = existing?.filePath ?? '';
  let fileName = existing?.fileName ?? '';
  let fileType = existing?.fileType ?? '';

  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
    filePath = `drivers/${driverId}/documents/${slug}/${Date.now()}-${safeName}`;
    fileURL = await uploadWithProgress(filePath, file, input.onProgress);
    fileName = file.name;
    fileType = file.type;
  }

  // Build the record without undefined values (Firestore rejects them).
  const record: Record<string, unknown> = {
    id,
    driverId,
    driverName: input.driverName,
    documentType,
    documentNumber: input.documentNumber.trim(),
    issueDate: input.issueDate,
    expiryDate: input.expiryDate,
    fileURL,
    filePath,
    fileName,
    fileType,
    uploadedAt: file ? now : existing?.uploadedAt ?? now,
    uploadedBy: asAdmin ? 'admin' : 'driver',
    status: asAdmin ? 'approved' : 'pending',
  };
  if (asAdmin) {
    record.reviewedAt = now;
    record.reviewedBy = input.reviewerId ?? 'admin';
  }

  await batchSet([{ collectionName: COLLECTION, id, data: record }]);

  // Clean up the replaced file (best effort — never block the save on it).
  if (file && existing?.filePath && existing.filePath !== filePath) {
    deleteFile(existing.filePath).catch(() => {});
  }

  return record as unknown as DriverDocument;
}

export async function reviewDriverDocument(
  docId: string,
  status: Extract<DocumentStatus, 'approved' | 'rejected'>,
  reviewerId: string,
  notes = ''
): Promise<void> {
  await updateDocument<DriverDocument>(COLLECTION, docId, {
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    notes: status === 'rejected' ? notes.trim() : '',
  });
}

export async function deleteDriverDocument(doc: DriverDocument): Promise<void> {
  await deleteDocument(COLLECTION, doc.id);
  if (doc.filePath) deleteFile(doc.filePath).catch(() => {});
}
