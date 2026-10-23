export interface ProcessedGPSRow {
  item: number;
  nombre: string;
  imei: string;
  activo: string | number;
  vence: string;
  equipoGps: string;
  numeroChip: string;
  ultimaFecha: string;
  ultimaHora: string;
  estado: string;
  usuarios: string;
}

export interface ParseResult {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  headerRowIndex: number;
  rawHeaders: string[];
  rawRows: unknown[][];
  processedRows: ProcessedGPSRow[];
  totalRawRows: number;
  totalProcessedRows: number;
}

export interface SaveBackupResult {
  success: boolean;
  savedPath: string;
  fileName: string;
  wasLocked: boolean;
  message: string;
}

export interface SatelGpsModuleProps {
  /**
   * Endpoint for saving backups locally on server/desktop.
   * Defaults to '/api/save-local'
   */
  apiEndpoint?: string;
  /**
   * Custom title or header text for the module
   */
  title?: string;
  /**
   * Optional custom default backup folder
   */
  defaultFolder?: string;
  /**
   * Callback fired when a backup is saved successfully to disk
   */
  onSaveSuccess?: (result: SaveBackupResult) => void;
  /**
   * Callback fired when a backup is downloaded in the browser
   */
  onDownloadSuccess?: (fileName: string, totalRows: number) => void;
  /**
   * Class name for container styling
   */
  className?: string;
}
