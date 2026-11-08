// File uploads for the site — now stored in the GoDaddy MySQL database
// through /api/files (see src/app/api/files/route.ts), not Firebase Storage.
// Same function names as before; returned URLs point at /api/files/<path>.

import { apiFetch, ApiError } from '@/lib/api-client';

function fileUrl(path: string): string {
  return '/api/files/' + path.split('/').map(encodeURIComponent).join('/');
}

function toBlob(file: File | Blob | ArrayBuffer): Blob {
  return file instanceof Blob ? file : new Blob([file]);
}

function formFor(path: string, file: File | Blob | ArrayBuffer): FormData {
  const form = new FormData();
  form.append('path', path);
  const name = file instanceof File ? file.name : path.split('/').pop() || 'file';
  form.append('file', toBlob(file), name);
  return form;
}

export async function uploadFile(
  path: string,
  file: File | Blob | ArrayBuffer
): Promise<string> {
  const { url } = await apiFetch<{ url: string }>('/api/files', { method: 'POST', body: formFor(path, file) });
  return url;
}

export interface UploadTask {
  cancel: () => boolean;
}

export function uploadFileWithProgress(
  path: string,
  file: File | Blob | ArrayBuffer,
  onProgress?: (progress: { bytesTransferred: number; totalBytes: number; percentage: number }) => void,
  onError?: (error: Error) => void,
  onComplete?: (downloadURL: string) => void
): UploadTask {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/files');
  xhr.withCredentials = true;

  xhr.upload.onprogress = (e) => {
    if (onProgress && e.lengthComputable) {
      onProgress({ bytesTransferred: e.loaded, totalBytes: e.total, percentage: (e.loaded / e.total) * 100 });
    }
  };
  xhr.onload = () => {
    let body: { url?: string; error?: { code?: string; message?: string } } = {};
    try {
      body = JSON.parse(xhr.responseText || '{}');
    } catch {
      // leave empty
    }
    if (xhr.status >= 200 && xhr.status < 300 && body.url) {
      onComplete?.(body.url);
    } else {
      onError?.(
        new ApiError(body.error?.code ?? `http-${xhr.status}`, body.error?.message ?? 'Upload failed.', xhr.status)
      );
    }
  };
  xhr.onerror = () => onError?.(new ApiError('network-request-failed', 'Upload failed — check your connection.', 0));
  xhr.onabort = () => onError?.(new ApiError('canceled', 'Upload cancelled.', 0));
  xhr.send(formFor(path, file));

  return {
    cancel: () => {
      xhr.abort();
      return true;
    },
  };
}

export async function getFileURL(path: string): Promise<string> {
  return fileUrl(path);
}

export async function deleteFile(path: string): Promise<void> {
  await apiFetch(`/api/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
}

export interface FileItem {
  name: string;
  fullPath: string;
  size: number;
  timeCreated: string;
}

export async function listFiles(folder: string): Promise<FileItem[]> {
  const { items } = await apiFetch<{ items: FileItem[] }>(`/api/files?folder=${encodeURIComponent(folder)}`);
  return items;
}
