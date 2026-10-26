'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Search,
  FolderOpen,
  FolderCheck,
  Save,
  AlertCircle,
} from 'lucide-react';

interface ControlToolbarProps {
  backupFileName: string;
  totalRows: number;
  totalSheets?: number;
  activeDate: string;
  savingLocal: boolean;
  copied: boolean;
  searchTerm: string;
  showFolderSettings: boolean;
  localFolder: string;
  folderDisplayName?: string;
  isClientPickerSupported?: boolean;
  statusMessage: { type: 'success' | 'error'; text: string } | null;
  onSearchChange: (value: string) => void;
  onCopyClipboard: () => void;
  onSaveToFolder: () => void;
  onChooseFolder?: () => void;
  onDownload: () => void;
  onReset: () => void;
  onToggleFolderSettings: () => void;
  onLocalFolderChange: (value: string) => void;
  onDismissStatus: () => void;
}

export function ControlToolbar({
  backupFileName,
  totalRows,
  totalSheets = 1,
  activeDate,
  savingLocal,
  copied,
  searchTerm,
  showFolderSettings,
  localFolder,
  folderDisplayName,
  isClientPickerSupported,
  statusMessage,
  onSearchChange,
  onCopyClipboard,
  onSaveToFolder,
  onChooseFolder,
  onDownload,
  onReset,
  onToggleFolderSettings,
  onLocalFolderChange,
  onDismissStatus,
}: ControlToolbarProps) {
  return (
    <div className="shrink-0 flex flex-col gap-2">
      {/* Top Header & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-900/70 border border-slate-800/80 rounded-xl px-4 py-2.5 backdrop-blur">
        {/* Left Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Backup de Dispositivos</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {backupFileName}
              </span>
              {totalSheets > 1 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {totalSheets} hojas
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Total: <strong className="text-white">{totalRows}</strong> registros
              {totalSheets > 1 && (
                <> &bull; <span className="text-blue-300 font-medium">{totalSheets} hojas procesadas</span></>
              )}{' '}
              &bull;{' '}
              <span className="text-slate-300">
                Fecha: <strong className="text-emerald-400">{activeDate}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Configure Folder */}
          <button
            onClick={onToggleFolderSettings}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showFolderSettings
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title="Configurar ubicación de guardado en tu equipo"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>{folderDisplayName ? `Carpeta: ${folderDisplayName}` : 'Carpeta Backup'}</span>
          </button>

          {/* Direct Save to Desktop Folder */}
          <button
            onClick={onSaveToFolder}
            disabled={savingLocal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title={`Guardar directamente en ${folderDisplayName || localFolder}`}
          >
            {savingLocal ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>Guardar en Carpeta</span>
          </button>

          {/* Download in Browser */}
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 transition-all scale-[1] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Backup (.xlsx)</span>
          </button>

          {/* Reset / New File */}
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
            title="Cargar otro archivo Excel"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Folder Settings Panel */}
      {showFolderSettings && (
        <div className="p-3.5 rounded-xl bg-slate-900/95 border border-blue-500/30 flex flex-col gap-2.5 text-xs shadow-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium shrink-0">Carpeta vinculada:</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs">
                {folderDisplayName || localFolder || 'BACKUPS SATELCOM'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isClientPickerSupported && onChooseFolder && (
                <button
                  type="button"
                  onClick={onChooseFolder}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Abre el explorador de Windows para seleccionar tu carpeta de backups (ej: BACKUPS SATELCOM en tu Escritorio)"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Seleccionar Carpeta en PC</span>
                </button>
              )}
              <button
                type="button"
                onClick={onToggleFolderSettings}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isClientPickerSupported
              ? '💡 Funciona en local y desplegado: el navegador guarda el Excel directamente en la carpeta elegida de tu computadora.'
              : '💡 Ruta asignada para el guardado local del archivo.'}
          </p>
        </div>
      )}

      {/* Notification Toast Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2 rounded-xl text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={onDismissStatus}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search Input & Copy Clipboard Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa/nombre, IMEI, SIM o usuario..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={onCopyClipboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all shrink-0 shadow-sm"
          title="Copiar todas las filas formateadas para pegar directamente en Excel"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '¡Copiado!' : 'Copiar Tabla'}</span>
        </button>
      </div>
    </div>
  );
}
