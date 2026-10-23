import { NextRequest, NextResponse } from 'next/server';
import { getDefaultBackupDirectory, writeBackupToDisk } from '../services/backup-service';
import { ProcessedGPSRow } from '../types';

/**
 * Handles GET request: returns the default desktop backup folder (BACKUPS SATELCOM)
 */
export async function GET() {
  try {
    const defaultFolder = getDefaultBackupDirectory();
    return NextResponse.json({ defaultFolder });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Error obteniendo carpeta por defecto' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST request: saves processed GPS records directly to disk in the desktop backup folder
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rows, folderPath, fileName } = body as {
      rows: ProcessedGPSRow[];
      folderPath?: string;
      fileName?: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron registros válidos para guardar.' },
        { status: 400 }
      );
    }

    const result = writeBackupToDisk(rows, folderPath, fileName);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    console.error('Error guardando archivo en disco:', err);

    const isBusy = err?.code === 'EBUSY' || err?.code === 'EPERM';
    const errorMessage = isBusy
      ? 'El archivo está abierto en Microsoft Excel. Ciérralo e intenta nuevamente.'
      : err?.message || 'Error guardando archivo en la carpeta asignada.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
