/**
 * ==============================================================================
 * MÓDULO INDEPENDIENTE DE TRANSFORMACIÓN Y BACKUP DE REPORTES GPS (SATEL)
 * ==============================================================================
 * Este módulo es 100% autocontenido y puede ser extraído copiando la carpeta:
 * `/src/modules/satel-gps-backup/` a cualquier otro proyecto React / Next.js.
 */

// 1. Componente Principal de UI
export { SatelGpsBackup, default as SatelGpsBackupModule } from './components/SatelGpsBackup';
export { DeviceTable } from './components/DeviceTable';
export { ControlToolbar } from './components/ControlToolbar';
export { UploadDropzone } from './components/UploadDropzone';

// 2. Procesamiento de Excel y Datos
export {
  parseExcelFile,
  processExcelMatrix,
  createProcessedWorkbook,
  generateProcessedExcel,
  splitDateTime,
  getTodayDateString,
  findHeaderRow,
  normalizeHeader,
  EXPORT_HEADERS,
  COLUMN_WIDTHS,
} from './services/excel-processor';

// 3. Manejo de Archivos en Disco (Desktop / BACKUPS SATELCOM)
export {
  writeBackupToDisk,
  getDefaultBackupDirectory,
  getDesktopPath,
  BACKUP_FOLDER_NAME,
} from './services/backup-service';

// 4. Handlers para Rutas API (Next.js / Node)
export { GET, POST } from './server/api-handlers';

// 5. Definiciones de Tipos TypeScript
export type {
  ProcessedGPSRow,
  ParseResult,
  SaveBackupResult,
  SatelGpsModuleProps,
} from './types';
