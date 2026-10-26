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
  const keywords = [
    'nombre',
    'name',
    'imei',
    'activo',
    'active',
    'sim',
    'chip',
    'telefono',
    'phone',
    'equipo',
    'device',
    'modelo',
    'model',
    'conexion',
    'connection',
    'protocolo',
    'protocol',
    'puerto',
    'port',
    'estado',
    'status',
    'usuario',
    'user',
    'cuenta',
    'account',
    'vence',
    'expira',
    'expire',
  ];

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

    // 1. Usuarios / Cuenta de Usuario / User account / Users / Accounts
    if (
      h.includes('usuario') ||
      h.includes('cuenta') ||
      h.includes('user') ||
      h.includes('account') ||
      h.includes('cliente') ||
      h.includes('client')
    ) {
      mapping.usuarios = index;
    }
    // 2. Nombre / Name / Unit name / Device name / Vehiculo
    else if (
      h.includes('nombre') ||
      h === 'name' ||
      h.startsWith('name') ||
      h.includes('device name') ||
      h.includes('unit name') ||
      h.includes('vehiculo') ||
      h.includes('vehicle')
    ) {
      mapping.nombre = index;
    }
    // 3. IMEI / Device ID
    else if (h.includes('imei') || h === 'identificador' || h === 'device id') {
      mapping.imei = index;
    }
    // 4. Activo / Active
    else if (
      h === 'activo' ||
      h.startsWith('activo') ||
      h === 'active' ||
      h.startsWith('active') ||
      h.includes('is active')
    ) {
      mapping.activo = index;
    }
    // 5. Vence / Expira el / Expires on / Expiration / Expiry
    else if (
      h.includes('expira') ||
      h.includes('expire') ||
      h.includes('expiry') ||
      h.includes('expiration') ||
      h.includes('vence') ||
      h.includes('vencimiento') ||
      h.includes('valid until')
    ) {
      mapping.vence = index;
    }
    // 6. Ultima conexion / Last connection / Fecha / Last seen / Timestamp
    else if (
      h.includes('ultima') ||
      h.includes('last') ||
      h.includes('latest') ||
      h === 'ultima conexion' ||
      h === 'last connection' ||
      h.includes('last seen') ||
      h.includes('last update') ||
      h.includes('last report') ||
      ((h.includes('fecha') || (h.includes('date') && !h.includes('valid')) || h.includes('timestamp')) &&
        !h.includes('expir') &&
        !h.includes('venc'))
    ) {
      mapping.ultimaConexion = index;
    }
    // 7. Estado / Connection (status) / Status / State / Online
    else if (
      h === 'estado' ||
      h === 'status' ||
      h === 'state' ||
      h === 'connection' ||
      h === 'connection status' ||
      h.includes('status') ||
      h.includes('online') ||
      (h.includes('connection') &&
        !h.includes('last') &&
        !h.includes('ultima') &&
        !h.includes('time') &&
        !h.includes('date'))
    ) {
      mapping.estado = index;
    }
    // 8. Equipo GPS / Dispositivo / GPS Device / Device / Modelo / Model
    else if (
      h.includes('equipo') ||
      h.includes('dispositivo') ||
      h.includes('device') ||
      h.includes('modelo') ||
      h.includes('model') ||
      h.includes('hardware') ||
      (h.includes('gps') && !h.includes('satel'))
    ) {
      mapping.equipoGps = index;
    }
    // 9. # de Telefono SIM / SIM Phone number / SIM / Chip / Phone / Mobile
    else if (
      h.includes('sim') ||
      h.includes('chip') ||
      h.includes('telefono') ||
      h.includes('phone') ||
      h.includes('telf') ||
      h.includes('msisdn') ||
      h.includes('mobile') ||
      h.includes('celular')
    ) {
      mapping.numeroChip = index;
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
      sheetName,
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
    sheets: { [sheetName]: processedRows },
    allProcessedRows: processedRows,
    totalRawRows: matrix.length,
    totalProcessedRows: processedRows.length,
  };
}

/**
 * Parses raw ArrayBuffer into a ParseResult, processing every sheet found in the workbook
 */
export function parseExcelFile(buffer: ArrayBuffer, fileName: string): ParseResult {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false,
    cellDates: true,
  });

  const sheetNames = workbook.SheetNames || [];
  const sheets: Record<string, ProcessedGPSRow[]> = {};
  const allProcessedRows: ProcessedGPSRow[] = [];
  let totalRawRows = 0;
  let firstHeaderIndex = 0;
  let firstHeaders: string[] = [];
  let firstRawRows: unknown[][] = [];
  let globalItemCounter = 1;

  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const matrix: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    totalRawRows += matrix.length;

    const sheetResult = processExcelMatrix(matrix, fileName, sheetName);
    sheets[sheetName] = sheetResult.processedRows;

    if (i === 0) {
      firstHeaderIndex = sheetResult.headerRowIndex;
      firstHeaders = sheetResult.rawHeaders;
      firstRawRows = sheetResult.rawRows;
    }

    // Accumulate rows into allProcessedRows with sequential item numbers
    sheetResult.processedRows.forEach((r) => {
      allProcessedRows.push({
        ...r,
        item: globalItemCounter++,
        sheetName,
      });
    });
  }

  const firstSheetName = sheetNames[0] || 'Hoja 1';
  // If first sheet has 0 processed rows but other sheets have rows, default to first non-empty sheet
  const firstNonEmpty = sheetNames.find((s) => sheets[s] && sheets[s].length > 0) || firstSheetName;
  const initialRows = sheets[firstNonEmpty] || allProcessedRows;

  return {
    fileName,
    sheetNames,
    activeSheet: firstNonEmpty,
    headerRowIndex: firstHeaderIndex,
    rawHeaders: firstHeaders,
    rawRows: firstRawRows,
    processedRows: initialRows,
    sheets,
    allProcessedRows,
    totalRawRows,
    totalProcessedRows: allProcessedRows.length,
  };
}

/**
 * Sanitizes sheet names according to Excel rules (max 31 chars, no forbidden chars: \ / ? * : [ ])
 */
export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*\[\]]/g, '_').trim().slice(0, 31);
  return cleaned || 'Hoja';
}

/**
 * Builds a formatted XLSX WorkSheet from GPS rows
 */
function buildWorksheetForRows(rows: ProcessedGPSRow[]): XLSX.WorkSheet {
  const sheetData: unknown[][] = [[...EXPORT_HEADERS]];

  rows.forEach((r, idx) => {
    sheetData.push([
      r.item || idx + 1,
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

  return ws;
}

/**
 * Creates a standardized XLSX.WorkBook.
 * Supports either a single list of rows (1 sheet) or a map of sheets Record<string, ProcessedGPSRow[]>
 * to preserve every sheet with its original name in the output Excel.
 */
export function createProcessedWorkbook(
  data: ProcessedGPSRow[] | Record<string, ProcessedGPSRow[]>,
  defaultSheetName: string = 'Dispositivos'
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  if (Array.isArray(data)) {
    const ws = buildWorksheetForRows(data);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(defaultSheetName));
    return wb;
  }

  // Multi-sheet mapping
  const sheetNames = Object.keys(data);
  if (sheetNames.length === 0) {
    const ws = buildWorksheetForRows([]);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(defaultSheetName));
    return wb;
  }

  const usedNames = new Set<string>();

  sheetNames.forEach((sheetKey) => {
    let safeName = sanitizeSheetName(sheetKey);
    let candidate = safeName;
    let counter = 1;
    while (usedNames.has(candidate.toLowerCase())) {
      candidate = `${safeName.slice(0, 27)}_${counter++}`;
    }
    usedNames.add(candidate.toLowerCase());

    const rows = data[sheetKey] || [];
    const ws = buildWorksheetForRows(rows);
    XLSX.utils.book_append_sheet(wb, ws, candidate);
  });

  return wb;
}

/**
 * Triggers a browser download of the standardized Excel file (supports multi-sheet or single sheet)
 */
export function generateProcessedExcel(
  data: ProcessedGPSRow[] | Record<string, ProcessedGPSRow[]>,
  filename: string
): void {
  const wb = createProcessedWorkbook(data);
  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
