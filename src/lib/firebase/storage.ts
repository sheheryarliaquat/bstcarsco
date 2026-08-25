import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  type UploadTask,
} from 'firebase/storage';
import { storage as getStorage } from './config';

export async function uploadFile(
  path: string,
  file: File | Blob | ArrayBuffer
): Promise<string> {
  const storageRef = ref(getStorage(), path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export function uploadFileWithProgress(
  path: string,
  file: File | Blob | ArrayBuffer,
  onProgress?: (progress: { bytesTransferred: number; totalBytes: number; percentage: number }) => void,
  onError?: (error: Error) => void,
  onComplete?: (downloadURL: string) => void
): UploadTask {
  const storageRef = ref(getStorage(), path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      if (onProgress) {
        const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage,
        });
      }
    },
    (error) => {
      if (onError) onError(error);
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      if (onComplete) onComplete(downloadURL);
    }
  );

  return uploadTask;
}

export async function getFileURL(path: string): Promise<string> {
  const storageRef = ref(getStorage(), path);
  return getDownloadURL(storageRef);
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(getStorage(), path);
  await deleteObject(storageRef);
}

export interface FileItem {
  name: string;
  fullPath: string;
  size: number;
  timeCreated: string;
}

export async function listFiles(folder: string): Promise<FileItem[]> {
  const storageRef = ref(getStorage(), folder);
  const result = await listAll(storageRef);

  const files: FileItem[] = await Promise.all(
    result.items.map(async (itemRef) => {
      const metadata = await getMetadata(itemRef);
      return {
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        size: metadata.size,
        timeCreated: metadata.timeCreated,
      };
    })
  );

  return files;
}
