import { ProcessedGPSRow } from '../types';
import { createProcessedWorkbook } from './excel-processor';
import * as XLSX from 'xlsx';

// Type definitions for File System Access API
export interface ClientDirectoryHandle {
  name: string;
  kind: 'directory';
  queryPermission: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<ClientFileHandle>;
}

export interface ClientFileHandle {
  name: string;
  kind: 'file';
  createWritable: () => Promise<ClientWritableFileStream>;
}

export interface ClientWritableFileStream {
  write: (data: unknown) => Promise<void>;
  close: () => Promise<void>;
}

const DB_NAME = 'SatelBackupDB';
const STORE_NAME = 'FolderHandles';
const HANDLE_KEY = 'backupDirectoryHandle';

/**
 * Returns true if the browser supports the File System Access API (Chrome, Edge, Opera, etc.)
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    typeof (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker === 'function'
  );
}

/**
 * Opens or initializes the local IndexedDB database to persist directory handles
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB no está disponible en este entorno.'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves the stored directory handle from IndexedDB
 */
export async function getSavedDirectoryHandle(): Promise<ClientDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => {
        resolve((req.result as ClientDirectoryHandle) || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('No se pudo recuperar el directorio desde IndexedDB:', err);
    return null;
  }
}

/**
 * Saves a directory handle in IndexedDB for reuse
 */
export async function saveDirectoryHandle(handle: ClientDirectoryHandle): Promise<void> {
  if (!isFileSystemAccessSupported()) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(handle, HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('No se pudo guardar el directorio en IndexedDB:', err);
  }
}

/**
 * Removes the stored directory handle from IndexedDB
 */
export async function clearSavedDirectoryHandle(): Promise<void> {
  if (!isFileSystemAccessSupported()) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('No se pudo limpiar el directorio en IndexedDB:', err);
  }
}

/**
 * Prompts the user to pick a folder on their computer
 */
export async function pickBackupDirectory(): Promise<ClientDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Tu navegador no soporta selección directa de carpetas. Usa "Descargar Backup".');
  }

  try {
    const win = window as unknown as {
      showDirectoryPicker: (opts?: {
        id?: string;
        mode?: 'read' | 'readwrite';
        startIn?: string;
      }) => Promise<ClientDirectoryHandle>;
    };

    const handle = await win.showDirectoryPicker({
      id: 'satel-backup-folder',
      mode: 'readwrite',
      startIn: 'desktop',
    });

    if (handle) {
      await saveDirectoryHandle(handle);
    }
    return handle;
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      return null; // Usuario canceló el diálogo
    }
    throw error;
  }
}

/**
 * Verifies or requests readwrite permission for the directory handle
 */
export async function verifyPermission(handle: ClientDirectoryHandle): Promise<boolean> {
  try {
    if (typeof handle.queryPermission === 'function') {
      const status = await handle.queryPermission({ mode: 'readwrite' });
      if (status === 'granted') return true;
    }

    if (typeof handle.requestPermission === 'function') {
      const requestStatus = await handle.requestPermission({ mode: 'readwrite' });
      return requestStatus === 'granted';
    }

    return true;
  } catch (err) {
    console.warn('Error verificando permisos de carpeta:', err);
    return false;
  }
}

/**
 * Saves processed GPS rows into the specified directory handle directly from the browser
 */
export async function saveToClientDirectory(
  handle: ClientDirectoryHandle,
  rows: ProcessedGPSRow[],
  baseFileName: string
): Promise<{ success: boolean; fileName: string; folderName: string }> {
  const hasPermission = await verifyPermission(handle);
  if (!hasPermission) {
    throw new Error('Se requiere permiso de escritura para guardar en la carpeta seleccionada.');
  }

  const wb = createProcessedWorkbook(rows);
  const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanBase = baseFileName.replace(/\.xlsx$/i, '');
  let finalFileName = `${cleanBase}.xlsx`;
  let counter = 1;

  // Manejo de colisiones de nombres si el archivo ya existe
  while (counter <= 99) {
    try {
      const existing = await handle.getFileHandle(finalFileName);
      if (existing) {
        finalFileName = `${cleanBase}_(${counter}).xlsx`;
        counter++;
      }
    } catch {
      // Si lanza error significa que el archivo no existe aún, nombre disponible
      break;
    }
  }

  const fileHandle = await handle.getFileHandle(finalFileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  return {
    success: true,
    fileName: finalFileName,
    folderName: handle.name,
  };
}
