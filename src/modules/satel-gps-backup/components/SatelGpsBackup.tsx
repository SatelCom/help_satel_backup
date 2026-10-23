'use client';

import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  parseExcelFile,
  generateProcessedExcel,
  getTodayDateString,
  EXPORT_HEADERS,
} from '../services/excel-processor';
import { ParseResult, SatelGpsModuleProps } from '../types';
import { UploadDropzone } from './UploadDropzone';
import { ControlToolbar } from './ControlToolbar';
import { DeviceTable } from './DeviceTable';

export function SatelGpsBackup({
  apiEndpoint = '/api/save-local',
  defaultFolder,
  onSaveSuccess,
  onDownloadSuccess,
  className = '',
}: SatelGpsModuleProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [todayDate, setTodayDate] = useState<string>('');
  const [localFolder, setLocalFolder] = useState<string>(defaultFolder || '');
  const [savingLocal, setSavingLocal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showFolderSettings, setShowFolderSettings] = useState(false);

  // Initialize current date and query system desktop BACKUPS SATELCOM path if not provided
  useEffect(() => {
    setTodayDate(getTodayDateString());

    if (!defaultFolder) {
      fetch(apiEndpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data.defaultFolder) {
            setLocalFolder(data.defaultFolder);
          }
        })
        .catch((err) => {
          console.warn('No se pudo obtener la carpeta por defecto del servidor:', err);
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
    if (!parseResult || parseResult.processedRows.length === 0) return;
    try {
      generateProcessedExcel(parseResult.processedRows, backupFileName);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
      setStatusMessage({ type: 'success', text: `Descarga iniciada: ${backupFileName}` });
      if (onDownloadSuccess) {
        onDownloadSuccess(backupFileName, parseResult.processedRows.length);
      }
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error descargando Excel:', err);
      alert('Error al generar la descarga del archivo.');
    }
  };

  // Save directly to desktop BACKUPS SATELCOM folder via backend API
  const handleSaveToFolder = async () => {
    if (!parseResult || parseResult.processedRows.length === 0) return;
    setSavingLocal(true);
    setStatusMessage(null);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parseResult.processedRows,
          folderPath: localFolder,
          fileName: backupFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar');
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
      console.error(error);
      setStatusMessage({ type: 'error', text: error.message || 'Error al guardar en carpeta de backup' });
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

  // Real-time search filter
  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    if (!searchTerm.trim()) return parseResult.processedRows;

    const term = searchTerm.toLowerCase();
    return parseResult.processedRows.filter((r) =>
      r.nombre.toLowerCase().includes(term) ||
      r.imei.toLowerCase().includes(term) ||
      r.numeroChip.toLowerCase().includes(term) ||
      r.equipoGps.toLowerCase().includes(term) ||
      r.usuarios.toLowerCase().includes(term) ||
      r.ultimaFecha.toLowerCase().includes(term) ||
      r.ultimaHora.toLowerCase().includes(term)
    );
  }, [parseResult, searchTerm]);

  const handleReset = () => {
    setParseResult(null);
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
            totalRows={parseResult.processedRows.length}
            activeDate={activeDate}
            savingLocal={savingLocal}
            copied={copied}
            searchTerm={searchTerm}
            showFolderSettings={showFolderSettings}
            localFolder={localFolder}
            statusMessage={statusMessage}
            onSearchChange={setSearchTerm}
            onCopyClipboard={handleCopyClipboard}
            onSaveToFolder={handleSaveToFolder}
            onDownload={handleDownload}
            onReset={handleReset}
            onToggleFolderSettings={() => setShowFolderSettings((prev) => !prev)}
            onLocalFolderChange={setLocalFolder}
            onDismissStatus={() => setStatusMessage(null)}
          />

          <DeviceTable
            rows={filteredRows}
            totalRows={parseResult.processedRows.length}
            backupFolder={localFolder}
            hasFilter={Boolean(searchTerm.trim())}
          />
        </div>
      )}
    </div>
  );
}

export default SatelGpsBackup;
