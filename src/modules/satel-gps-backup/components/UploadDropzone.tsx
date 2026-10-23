'use client';

import React, { useRef, useState } from 'react';
import { FileSpreadsheet, RefreshCw, Sparkles, UploadCloud } from 'lucide-react';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  backupFileName: string;
}

export function UploadDropzone({ onFileSelect, loading, backupFileName }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-center items-center overflow-y-auto py-6">
      <div className="w-full max-w-2xl space-y-5 px-4">
        {/* Header Title */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Transformación GPS Satel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Cargar Reporte de Dispositivos
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Sube el archivo Excel crudo para procesar y estructurar automáticamente tu backup en{' '}
            <span className="text-emerald-400 font-mono font-semibold">{backupFileName}</span>.
          </p>
        </div>

        {/* Drag and drop card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 glass-panel ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-700/80 hover:border-blue-400/50 hover:bg-slate-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              {loading ? (
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              ) : (
                <UploadCloud className="w-8 h-8 text-blue-400" />
              )}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {loading ? 'Procesando archivo...' : 'Arrastra tu archivo Excel aquí'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Soporta formatos <span className="text-slate-200 font-mono">.xlsx</span>,{' '}
                <span className="text-slate-200 font-mono">.xls</span> y{' '}
                <span className="text-slate-200 font-mono">.csv</span>
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-500/40 transition-all pointer-events-none"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Examinar archivo en tu equipo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
