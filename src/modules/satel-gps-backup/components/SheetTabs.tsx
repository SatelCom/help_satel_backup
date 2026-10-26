'use client';

import React from 'react';
import { Layers, FileSpreadsheet } from 'lucide-react';

interface SheetTabsProps {
  sheetNames: string[];
  sheets: Record<string, { length: number } | unknown[]>;
  totalAllRows: number;
  activeSheet: string; // sheet name or '__ALL__'
  onSelectSheet: (sheetName: string) => void;
}

export function SheetTabs({
  sheetNames,
  sheets,
  totalAllRows,
  activeSheet,
  onSelectSheet,
}: SheetTabsProps) {
  if (!sheetNames || sheetNames.length <= 1) {
    return null;
  }

  const isAllActive = activeSheet === '__ALL__';

  return (
    <div className="shrink-0 flex items-center justify-between gap-2 px-1 py-1 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur shadow-sm">
      {/* Left Title Label */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 text-[11px] font-semibold text-slate-400 shrink-0">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        <span>Hojas ({sheetNames.length}):</span>
      </div>

      {/* Interactive Tabs List */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
        {/* 'Todas las Hojas' Tab */}
        <button
          type="button"
          onClick={() => onSelectSheet('__ALL__')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
            isAllActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Ver todos los dispositivos unificados de todas las hojas"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todas las hojas</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isAllActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalAllRows}
          </span>
        </button>

        {/* Individual Sheet Tabs */}
        {sheetNames.map((name) => {
          const isActive = activeSheet === name;
          const rowCount = sheets[name] ? (Array.isArray(sheets[name]) ? sheets[name].length : 0) : 0;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectSheet(name)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
              title={`Ver hoja "${name}" (${rowCount} dispositivos)`}
            >
              <FileSpreadsheet
                className={`w-3.5 h-3.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`}
              />
              <span className="truncate max-w-[150px]">{name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rowCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SheetTabs;
