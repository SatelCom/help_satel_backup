import fs from 'fs';
import path from 'path';
import os from 'os';
import * as XLSX from 'xlsx';
import { ProcessedGPSRow, SaveBackupResult } from '../types';
import { createProcessedWorkbook } from './excel-processor';

export const BACKUP_FOLDER_NAME = 'BACKUPS SATELCOM';

/**
 * Returns the absolute path of the user's Desktop folder.
 * Prioritizes OneDrive Desktop if active on Windows, falling back to local Desktop.
 */
export function getDesktopPath(): string {
  const home = os.homedir() || process.env.USERPROFILE || 'C:\\Users\\Fernando';
  const oneDriveDesktop = path.join(home, 'OneDrive', 'Desktop');

  if (fs.existsSync(oneDriveDesktop)) {
    return oneDriveDesktop;
  }

  const standardDesktop = path.join(home, 'Desktop');
  if (fs.existsSync(standardDesktop)) {
    return standardDesktop;
  }

  return oneDriveDesktop;
}

/**
 * Returns the defined backup directory: Desktop/BACKUPS SATELCOM
 * Automatically creates the folder if it does not yet exist.
 */
export function getDefaultBackupDirectory(): string {
  try {
    const desktop = getDesktopPath();
    const backupFolder = path.join(desktop, BACKUP_FOLDER_NAME);

    if (!fs.existsSync(backupFolder)) {
      try {
        fs.mkdirSync(backupFolder, { recursive: true });
      } catch {
        // Ignorar si el sistema de archivos es de solo lectura (como Vercel/Cloud)
      }
    }

    return backupFolder;
  } catch {
    return path.join('Desktop', BACKUP_FOLDER_NAME);
  }
}

/**
 * Writes the processed GPS records to an Excel file on disk.
 * Handles locked files gracefully (e.g. if open in Excel) by incrementing suffix.
 */
export function writeBackupToDisk(
  rows: ProcessedGPSRow[],
  targetFolder?: string,
  fileName?: string
): SaveBackupResult {
  const finalFolder = targetFolder && targetFolder.trim() !== ''
    ? targetFolder.replace(/^["']|["']$/g, '').trim()
    : getDefaultBackupDirectory();

  if (!fs.existsSync(finalFolder)) {
    try {
      fs.mkdirSync(finalFolder, { recursive: true });
    } catch (mkdirErr: unknown) {
      const err = mkdirErr as Error;
      throw new Error(
        `No se puede crear la carpeta en este servidor desplegado (${err.message}). Por favor utiliza la opción de guardado directo del navegador.`
      );
    }
  }

  const baseName = fileName
    ? fileName.replace(/\.xlsx$/i, '')
    : `backup_${new Date().toISOString().split('T')[0]}`;

  let finalFileName = `${baseName}.xlsx`;
  let fullPath = path.join(finalFolder, finalFileName);

  // Generate standardized workbook using centralized processor
  const wb = createProcessedWorkbook(rows);
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  let wasLocked = false;
  try {
    fs.writeFileSync(fullPath, buffer);
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    const isLocked =
      error.code === 'EBUSY' ||
      error.code === 'EPERM' ||
      (error.message && error.message.includes('busy')) ||
      (error.message && error.message.includes('locked'));

    if (isLocked) {
      wasLocked = true;
      let counter = 1;
      let written = false;

      while (counter <= 99) {
        finalFileName = `${baseName}_(${counter}).xlsx`;
        fullPath = path.join(finalFolder, finalFileName);
        try {
          fs.writeFileSync(fullPath, buffer);
          written = true;
          break;
        } catch {
          counter++;
        }
      }

      if (!written) {
        throw new Error('No se pudo escribir el archivo; todos los nombres posibles están bloqueados.');
      }
    } else {
      throw err;
    }
  }

  const message = wasLocked
    ? `El archivo anterior estaba abierto en Excel. Se guardó como: ${finalFileName}`
    : `Archivo guardado exitosamente en: ${fullPath}`;

  return {
    success: true,
    savedPath: fullPath,
    fileName: finalFileName,
    wasLocked,
    message,
  };
}
