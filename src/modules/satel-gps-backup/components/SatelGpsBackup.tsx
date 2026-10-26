'use client';

import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  parseExcelFile,
  generateProcessedExcel,
  getTodayDateString,
  EXPORT_HEADERS,
} from '../services/excel-processor';
import {
  isFileSystemAccessSupported,
  getSavedDirectoryHandle,
  pickBackupDirectory,
  saveToClientDirectory,
  ClientDirectoryHandle,
} from '../services/client-folder-service';
import { ParseResult, SatelGpsModuleProps } from '../types';
import { UploadDropzone } from './UploadDropzone';
import { ControlToolbar } from './ControlToolbar';
import { DeviceTable } from './DeviceTable';
import { SheetTabs } from './SheetTabs';

export function SatelGpsBackup({
  apiEndpoint = '/api/save-local',
  defaultFolder,
  onSaveSuccess,
  onDownloadSuccess,
  className = '',
}: SatelGpsModuleProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('__ALL__');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [todayDate, setTodayDate] = useState<string>('');
  const [localFolder, setLocalFolder] = useState<string>(defaultFolder || '');
  const [clientDirHandle, setClientDirHandle] = useState<ClientDirectoryHandle | null>(null);
  const [folderDisplayName, setFolderDisplayName] = useState<string>('BACKUPS SATELCOM');
  const [isClientPickerSupported, setIsClientPickerSupported] = useState<boolean>(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showFolderSettings, setShowFolderSettings] = useState(false);

  // Initialize date, client directory handle, and default folder
  useEffect(() => {
    setTodayDate(getTodayDateString());
    const supported = isFileSystemAccessSupported();
    setIsClientPickerSupported(supported);

    if (supported) {
      getSavedDirectoryHandle()
        .then((handle) => {
          if (handle) {
            setClientDirHandle(handle);
            setFolderDisplayName(handle.name);
          }
        })
        .catch(() => {});
    }

    if (!defaultFolder) {
      fetch(apiEndpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data.defaultFolder) {
            setLocalFolder(data.defaultFolder);
            setFolderDisplayName((prev) => {
              if (prev && prev !== 'BACKUPS SATELCOM') return prev;
              const extracted = data.defaultFolder.split(/[\\/]/).filter(Boolean).pop();
              return extracted || 'BACKUPS SATELCOM';
            });
          }
        })
        .catch((err) => {
          console.warn('Servidor sin acceso a fs local (entorno desplegado):', err);
        });
    }
  }, [apiEndpoint, defaultFolder]);

  const activeDate = todayDate || 'YYYY-MM-DD';
  const backupFileName = todayDate ? `backup_${todayDate}.xlsx` : 'backup_satel.xlsx';

  // Parse uploaded file
  const handleFileSelect = (file: File) => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const result = parseExcelFile(buffer, file.name);
        setParseResult(result);
        setActiveSheet(result.activeSheet || '__ALL__');
        setStatusMessage(null);
      } catch (err) {
        console.error('Error procesando el archivo Excel:', err);
        alert('Hubo un error al procesar el archivo Excel. Verifica que sea un formato válido.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Browser download
  const handleDownload = () => {
    if (!parseResult || parseResult.allProcessedRows.length === 0) return;
    try {
      const targetData =
        parseResult.sheetNames.length > 1 ? parseResult.sheets : parseResult.allProcessedRows;
      generateProcessedExcel(targetData, backupFileName);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
      const sheetMsg =
        parseResult.sheetNames.length > 1
          ? ` (${parseResult.sheetNames.length} hojas)`
          : '';
      setStatusMessage({ type: 'success', text: `Descarga iniciada: ${backupFileName}${sheetMsg}` });
      if (onDownloadSuccess) {
        onDownloadSuccess(backupFileName, parseResult.allProcessedRows.length);
      }
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error descargando Excel:', err);
      alert('Error al generar la descarga del archivo.');
    }
  };

  // Open native folder picker to select custom backup directory on user PC
  const handleChooseFolder = async () => {
    try {
      const handle = await pickBackupDirectory();
      if (handle) {
        setClientDirHandle(handle);
        setFolderDisplayName(handle.name);
        setStatusMessage({
          type: 'success',
          text: `Carpeta vinculada: "${handle.name}". Los backups se guardarán directamente aquí.`,
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({ type: 'error', text: error.message || 'Error seleccionando carpeta' });
    }
  };

  // Save directly to target folder (works in deployed cloud environments and local)
  const handleSaveToFolder = async () => {
    if (!parseResult || parseResult.allProcessedRows.length === 0) return;
    setSavingLocal(true);
    setStatusMessage(null);

    const targetData =
      parseResult.sheetNames.length > 1 ? parseResult.sheets : parseResult.allProcessedRows;

    // Option 1: File System Access API (Works 100% in deployed app & localhost from browser)
    if (isClientPickerSupported) {
      try {
        let handle = clientDirHandle;
        if (!handle) {
          handle = await pickBackupDirectory();
          if (!handle) {
            setSavingLocal(false);
            return;
          }
          setClientDirHandle(handle);
          setFolderDisplayName(handle.name);
        }

        const res = await saveToClientDirectory(handle, targetData, backupFileName);

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
        });

        const sheetMsg =
          parseResult.sheetNames.length > 1
            ? ` con ${parseResult.sheetNames.length} hojas`
            : '';
        const successText = `¡Guardado en "${res.folderName}" como "${res.fileName}"${sheetMsg}!`;
        setStatusMessage({ type: 'success', text: successText });

        if (onSaveSuccess) {
          onSaveSuccess({
            success: true,
            savedPath: `${res.folderName}/${res.fileName}`,
            fileName: res.fileName,
            wasLocked: false,
            message: successText,
          });
        }
        setSavingLocal(false);
        return;
      } catch (clientErr: unknown) {
        console.warn('Guardado directo en cliente falló o requirió fallback:', clientErr);
      }
    }

    // Option 2: Server API endpoint (for local development on Node)
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parseResult.allProcessedRows,
          sheets: parseResult.sheets,
          folderPath: localFolder,
          fileName: backupFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback for cloud/serverless where server disk is read-only
        generateProcessedExcel(targetData, backupFileName);
        setStatusMessage({
          type: 'success',
          text: `Servidor en la nube: archivo descargado en tu equipo como ${backupFileName}`,
        });
        return;
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });

      setStatusMessage({ type: 'success', text: data.message || `Guardado en: ${data.savedPath}` });
      if (onSaveSuccess) {
        onSaveSuccess(data);
      }
    } catch (err: unknown) {
      const error = err as Error;
      // Respaldo de descarga inmediata
      try {
        generateProcessedExcel(targetData, backupFileName);
        setStatusMessage({
          type: 'success',
          text: `Descargado directamente en tu equipo: ${backupFileName}`,
        });
      } catch {
        setStatusMessage({ type: 'error', text: error.message || 'Error al guardar archivo' });
      }
    } finally {
      setSavingLocal(false);
    }
  };

  // Copy rows to clipboard formatted for spreadsheet paste
  const handleCopyClipboard = () => {
    if (!parseResult) return;

    const rows = filteredRows.map((r) =>
      [
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
      ].join('\t')
    );

    const fullText = [EXPORT_HEADERS.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Compute active sheet rows (supports '__ALL__' or individual sheets)
  const currentSheetRows = useMemo(() => {
    if (!parseResult) return [];
    if (activeSheet === '__ALL__') {
      return parseResult.allProcessedRows;
    }
    return parseResult.sheets[activeSheet] || parseResult.processedRows;
  }, [parseResult, activeSheet]);

  // Real-time search filter on active sheet rows
  const filteredRows = useMemo(() => {
    if (!currentSheetRows) return [];
    if (!searchTerm.trim()) return currentSheetRows;

    const term = searchTerm.toLowerCase();
    return currentSheetRows.filter((r) =>
      r.nombre.toLowerCase().includes(term) ||
      r.imei.toLowerCase().includes(term) ||
      r.numeroChip.toLowerCase().includes(term) ||
      r.equipoGps.toLowerCase().includes(term) ||
      r.usuarios.toLowerCase().includes(term) ||
      (r.sheetName && r.sheetName.toLowerCase().includes(term)) ||
      r.ultimaFecha.toLowerCase().includes(term) ||
      r.ultimaHora.toLowerCase().includes(term)
    );
  }, [currentSheetRows, searchTerm]);

  const handleReset = () => {
    setParseResult(null);
    setActiveSheet('__ALL__');
    setSearchTerm('');
    setStatusMessage(null);
  };

  return (
    <div className={`h-full w-full flex flex-col min-h-0 overflow-hidden px-3 sm:px-6 py-2.5 gap-2.5 ${className}`}>
      {!parseResult ? (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          loading={loading}
          backupFileName={backupFileName}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-2">
          <ControlToolbar
            backupFileName={backupFileName}
            totalRows={parseResult.allProcessedRows.length}
            totalSheets={parseResult.sheetNames.length}
            activeDate={activeDate}
            savingLocal={savingLocal}
            copied={copied}
            searchTerm={searchTerm}
            showFolderSettings={showFolderSettings}
            localFolder={localFolder}
            folderDisplayName={folderDisplayName}
            isClientPickerSupported={isClientPickerSupported}
            statusMessage={statusMessage}
            onSearchChange={setSearchTerm}
            onCopyClipboard={handleCopyClipboard}
            onSaveToFolder={handleSaveToFolder}
            onChooseFolder={handleChooseFolder}
            onDownload={handleDownload}
            onReset={handleReset}
            onToggleFolderSettings={() => setShowFolderSettings((prev) => !prev)}
            onLocalFolderChange={setLocalFolder}
            onDismissStatus={() => setStatusMessage(null)}
          />

          {/* Interactive Sheet Tabs for multi-sheet workbooks */}
          <SheetTabs
            sheetNames={parseResult.sheetNames}
            sheets={parseResult.sheets}
            totalAllRows={parseResult.allProcessedRows.length}
            activeSheet={activeSheet}
            onSelectSheet={setActiveSheet}
          />

          <DeviceTable
            rows={filteredRows}
            totalRows={currentSheetRows.length}
            backupFolder={localFolder}
            hasFilter={Boolean(searchTerm.trim())}
            activeSheetName={activeSheet}
            totalSheets={parseResult.sheetNames.length}
          />
        </div>
      )}
    </div>
  );
}

export default SatelGpsBackup;
