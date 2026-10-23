import * as XLSX from 'xlsx';
import { ProcessedGPSRow, ParseResult } from '../types';

export const EXPORT_HEADERS = [
  '# ITEM',
  'NOMBRE',
  'IMEI',
  'ACTIVO',
  'VENCE',
  'EQUIPO GPS',
  '# NUMERO CHIP',
  'ULTIMA FECHA',
  'ULTIMA HORA',
  'ESTADO',
  'USUARIOS',
] as const;

export const COLUMN_WIDTHS = [
  { wch: 8 },  // # ITEM
  { wch: 22 }, // NOMBRE
  { wch: 18 }, // IMEI
  { wch: 10 }, // ACTIVO
  { wch: 14 }, // VENCE
  { wch: 24 }, // EQUIPO GPS
  { wch: 22 }, // # NUMERO CHIP
  { wch: 14 }, // ULTIMA FECHA
  { wch: 14 }, // ULTIMA HORA
  { wch: 12 }, // ESTADO
  { wch: 35 }, // USUARIOS
];

/**
 * Normalizes text for accent-insensitive and case-insensitive comparison
 */
export function normalizeHeader(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses and separates date and time reliably from strings, Excel serial numbers, or Date objects
 */
export function splitDateTime(val: unknown): { fecha: string; hora: string } {
  if (val === null || val === undefined || val === '') {
    return { fecha: '', hora: '' };
  }

  let d: Date | null = null;

  // Case 1: Native Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    d = val;
  }
  // Case 2: Excel serial date number
  else if (typeof val === 'number') {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const dateObj = new Date(ms);
    if (!isNaN(dateObj.getTime())) {
      d = dateObj;
    }
  }

  if (d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return {
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: `${hh}:${min}:${ss}`,
    };
  }

  const str = String(val).trim();
  if (!str) return { fecha: '', hora: '' };

  // Case 3: Match YYYY-MM-DD or YYYY/MM/DD with optional time
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    const hh = (isoMatch[4] || '').padStart(2, '0');
    const min = (isoMatch[5] || '').padStart(2, '0');
    const ss = (isoMatch[6] || '00').padStart(2, '0');
    return {
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: isoMatch[4] !== undefined ? `${hh}:${min}:${ss}` : '',
    };
  }

  // Case 4: Match DD/MM/YYYY or DD-MM-YYYY with optional time
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    const hh = (dmyMatch[4] || '').padStart(2, '0');
    const min = (dmyMatch[5] || '').padStart(2, '0');
    const ss = (dmyMatch[6] || '00').padStart(2, '0');
    return {
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: dmyMatch[4] !== undefined ? `${hh}:${min}:${ss}` : '',
    };
  }

  // Fallback: split by space or 'T'
  const parts = str.split(/[ T]+/);
  if (parts.length >= 2) {
    return {
      fecha: parts[0].trim(),
      hora: parts.slice(1).join(' ').split('.')[0].trim(),
    };
  }

  if (str.includes(':')) {
    return { fecha: '', hora: str };
  }

  return { fecha: str, hora: '' };
}

/**
 * Returns current local date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Automatically identifies which row contains table headers
 */
export function findHeaderRow(matrix: unknown[][]): { headerIndex: number; headers: string[] } {
  const keywords = ['nombre', 'imei', 'sim', 'equipo', 'conexion', 'protocolo', 'usuario', 'cuenta'];

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r] || [];
    const normalizedRow = row.map((c) => normalizeHeader(c));
    const matchCount = keywords.filter((kw) => normalizedRow.some((cell) => cell.includes(kw))).length;

    if (matchCount >= 2) {
      return {
        headerIndex: r,
        headers: row.map((c) => (c !== null && c !== undefined ? String(c).trim() : '')),
      };
    }
  }

  const firstRow = matrix[0] || [];
  return {
    headerIndex: 0,
    headers: firstRow.map((c) => (c !== null && c !== undefined ? String(c).trim() : '')),
  };
}

/**
 * Maps raw headers to standard GPS device properties
 */
function getColumnMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {
    nombre: -1,
    imei: -1,
    activo: -1,
    vence: -1,
    equipoGps: -1,
    numeroChip: -1,
    ultimaConexion: -1,
    estado: -1,
    usuarios: -1,
  };

  headers.forEach((header, index) => {
    const h = normalizeHeader(header);
    if (!h) return;

    if (h.includes('nombre')) {
      mapping.nombre = index;
    } else if (h.includes('imei')) {
      mapping.imei = index;
    } else if (h === 'activo' || h.startsWith('activo')) {
      mapping.activo = index;
    } else if (h.includes('expira') || h.includes('vence') || h.includes('vencimiento') || h.includes('expire')) {
      mapping.vence = index;
    } else if (h.includes('equipo') || h.includes('dispositivo') || h.includes('modelo')) {
      mapping.equipoGps = index;
    } else if (h.includes('sim') || h.includes('chip') || h.includes('telefono') || h.includes('telf')) {
      mapping.numeroChip = index;
    } else if (h.includes('conexion') || h.includes('ultima') || h.includes('fecha')) {
      mapping.ultimaConexion = index;
    } else if (h === 'estado' || h.includes('status')) {
      mapping.estado = index;
    } else if (h.includes('usuario') || h.includes('cuenta')) {
      mapping.usuarios = index;
    }
  });

  return mapping;
}

function cleanCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Transforms an Excel matrix into standard ProcessedGPSRow objects
 */
export function processExcelMatrix(
  matrix: unknown[][],
  fileName: string = 'archivo.xlsx',
  sheetName: string = 'Hoja 1'
): ParseResult {
  const { headerIndex, headers } = findHeaderRow(matrix);
  const mapping = getColumnMapping(headers);

  const processedRows: ProcessedGPSRow[] = [];
  let itemCounter = 1;

  for (let r = headerIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];

    const nombre = mapping.nombre !== -1 ? cleanCellValue(row[mapping.nombre]) : '';
    const imei = mapping.imei !== -1 ? cleanCellValue(row[mapping.imei]) : '';
    const rawActivo = mapping.activo !== -1 ? cleanCellValue(row[mapping.activo]) : '';
    const vence = mapping.vence !== -1 ? cleanCellValue(row[mapping.vence]) : '';
    const equipoGps = mapping.equipoGps !== -1 ? cleanCellValue(row[mapping.equipoGps]) : '';
    const numeroChip = mapping.numeroChip !== -1 ? cleanCellValue(row[mapping.numeroChip]) : '';

    const rawConexion = mapping.ultimaConexion !== -1 ? row[mapping.ultimaConexion] : '';
    const { fecha: ultimaFecha, hora: ultimaHora } = splitDateTime(rawConexion);

    const estado = mapping.estado !== -1 ? cleanCellValue(row[mapping.estado]) : '';
    const usuarios = mapping.usuarios !== -1 ? cleanCellValue(row[mapping.usuarios]) : '';

    // Discard rows with no meaningful GPS data
    const hasAnySignificantData = nombre || imei || numeroChip || equipoGps;
    if (!hasAnySignificantData) continue;

    const activoVal = rawActivo !== '' ? rawActivo : '0';

    processedRows.push({
      item: itemCounter++,
      nombre,
      imei,
      activo: activoVal,
      vence,
      equipoGps,
      numeroChip,
      ultimaFecha,
      ultimaHora,
      estado,
      usuarios,
    });
  }

  return {
    fileName,
    sheetNames: [sheetName],
    activeSheet: sheetName,
    headerRowIndex: headerIndex,
    rawHeaders: headers,
    rawRows: matrix.slice(headerIndex),
    processedRows,
    totalRawRows: matrix.length,
    totalProcessedRows: processedRows.length,
  };
}

/**
 * Parses raw ArrayBuffer into a ParseResult
 */
export function parseExcelFile(buffer: ArrayBuffer, fileName: string): ParseResult {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false,
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0] || 'Hoja1';
  const worksheet = workbook.Sheets[firstSheetName];

  const matrix: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const result = processExcelMatrix(matrix, fileName, firstSheetName);
  result.sheetNames = workbook.SheetNames;
  return result;
}

/**
 * Creates a standardized XLSX.WorkBook with explicit string formatting for IMEI, Activo, and Chip
 */
export function createProcessedWorkbook(rows: ProcessedGPSRow[]): XLSX.WorkBook {
  const sheetData: unknown[][] = [[...EXPORT_HEADERS]];

  rows.forEach((r) => {
    sheetData.push([
      r.item,
      r.nombre,
      r.imei,
      r.activo,
      r.vence,
      r.equipoGps,
      r.numeroChip,
      r.ultimaFecha,
      r.ultimaHora,
      r.estado,
      r.usuarios,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [...COLUMN_WIDTHS];

  // Enforce string type on sensitive columns to preserve leading zeros
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:K1');
  for (let R = 1; R <= range.e.r; ++R) {
    const imeiCellAddr = XLSX.utils.encode_cell({ r: R, c: 2 });
    if (ws[imeiCellAddr]) ws[imeiCellAddr].t = 's';

    const activoCellAddr = XLSX.utils.encode_cell({ r: R, c: 3 });
    if (ws[activoCellAddr]) ws[activoCellAddr].t = 's';

    const chipCellAddr = XLSX.utils.encode_cell({ r: R, c: 6 });
    if (ws[chipCellAddr]) ws[chipCellAddr].t = 's';
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dispositivos');
  return wb;
}

/**
 * Triggers a browser download of the standardized Excel file
 */
export function generateProcessedExcel(rows: ProcessedGPSRow[], filename: string): void {
  const wb = createProcessedWorkbook(rows);
  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
