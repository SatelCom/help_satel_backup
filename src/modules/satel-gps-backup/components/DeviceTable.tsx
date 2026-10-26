'use client';

import React from 'react';
import { ProcessedGPSRow } from '../types';

interface DeviceTableProps {
  rows: ProcessedGPSRow[];
  totalRows: number;
  backupFolder: string;
  hasFilter: boolean;
  activeSheetName?: string;
  totalSheets?: number;
}

export function DeviceTable({
  rows,
  totalRows,
  backupFolder,
  hasFilter,
  activeSheetName,
  totalSheets = 1,
}: DeviceTableProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-800 overflow-hidden glass-panel shadow-2xl">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto w-full">
        <table className="w-full min-w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider z-10 shadow-sm">
            <tr>
              <th className="px-3 py-2.5 border-r border-slate-800/50 w-14 text-center"># ITEM</th>
              <th className="px-4 py-2.5 border-r border-slate-800/50 min-w-[140px]">NOMBRE</th>
              <th className="px-4 py-2.5 border-r border-slate-800/50 min-w-[140px]">IMEI</th>
              <th className="px-2.5 py-2.5 border-r border-slate-800/50 text-center w-18">ACTIVO</th>
              <th className="px-3.5 py-2.5 border-r border-slate-800/50 min-w-[110px]">VENCE</th>
              <th className="px-4 py-2.5 border-r border-slate-800/50 min-w-[170px]">EQUIPO GPS</th>
              <th className="px-4 py-2.5 border-r border-slate-800/50 min-w-[170px]"># NUMERO CHIP</th>
              <th className="px-3.5 py-2.5 border-r border-slate-800/50 min-w-[120px] text-blue-400 font-bold">
                ULTIMA FECHA
              </th>
              <th className="px-3 py-2.5 border-r border-slate-800/50 min-w-[110px] text-indigo-400 font-bold">
                ULTIMA HORA
              </th>
              <th className="px-2.5 py-2.5 border-r border-slate-800/50 text-center w-20">ESTADO</th>
              <th className="px-4 py-2.5 min-w-[220px]">USUARIOS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-16 text-center text-slate-500">
                  No se encontraron dispositivos coincidentes con el filtro.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.item}
                  className="hover:bg-blue-500/5 transition-colors group"
                >
                  {/* # ITEM */}
                  <td className="px-3 py-2 font-mono font-medium text-slate-400 border-r border-slate-800/40 text-center">
                    {row.item}
                  </td>

                  {/* NOMBRE */}
                  <td className="px-4 py-2 text-white border-r border-slate-800/40 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">
                        {row.nombre || <span className="text-slate-600">-</span>}
                      </span>
                      {row.sheetName && totalSheets > 1 && (
                        <span className="text-[10px] font-mono text-blue-400/80 truncate max-w-[180px]">
                          Hoja: {row.sheetName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* IMEI */}
                  <td className="px-4 py-2 font-mono text-emerald-400 border-r border-slate-800/40 whitespace-nowrap">
                    {row.imei}
                  </td>

                  {/* ACTIVO */}
                  <td className="px-2.5 py-2 font-mono text-center text-slate-400 border-r border-slate-800/40">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[10px]">
                      {row.activo}
                    </span>
                  </td>

                  {/* VENCE */}
                  <td className="px-3.5 py-2 text-slate-300 border-r border-slate-800/40 whitespace-nowrap">
                    {row.vence || <span className="text-slate-600">-</span>}
                  </td>

                  {/* EQUIPO GPS */}
                  <td className="px-4 py-2 text-slate-300 border-r border-slate-800/40 whitespace-nowrap">
                    {row.equipoGps ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
                        {row.equipoGps}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* # NUMERO CHIP */}
                  <td className="px-4 py-2 font-mono text-amber-300 border-r border-slate-800/40 whitespace-nowrap">
                    {row.numeroChip || <span className="text-slate-600">-</span>}
                  </td>

                  {/* ULTIMA FECHA */}
                  <td className="px-3.5 py-2 font-mono text-blue-300 font-semibold border-r border-slate-800/40 whitespace-nowrap">
                    {row.ultimaFecha || <span className="text-slate-600">-</span>}
                  </td>

                  {/* ULTIMA HORA */}
                  <td className="px-3 py-2 font-mono text-indigo-300 font-semibold border-r border-slate-800/40 whitespace-nowrap">
                    {row.ultimaHora || <span className="text-slate-600">-</span>}
                  </td>

                  {/* ESTADO */}
                  <td className="px-2.5 py-2 text-center text-slate-400 border-r border-slate-800/40">
                    {row.estado || <span className="text-slate-600">-</span>}
                  </td>

                  {/* USUARIOS */}
                  <td className="px-4 py-2 text-slate-300">
                    {row.usuarios ? (
                      <div className="flex flex-wrap gap-1">
                        {row.usuarios.split(',').map((u, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/90 border border-slate-700 text-slate-300 whitespace-nowrap"
                          >
                            {u.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div className="h-7 px-4 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong className="text-white">{rows.length}</strong> de{' '}
            <strong className="text-white">{totalRows}</strong> dispositivos
          </span>
          {activeSheetName && totalSheets > 1 && (
            <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
              Hoja: {activeSheetName === '__ALL__' ? 'Todas las hojas' : activeSheetName}
            </span>
          )}
          {hasFilter && <span className="text-blue-400 font-medium">(Filtro activo)</span>}
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 truncate max-w-md">
          <span className="truncate" title={`Carpeta de guardado: ${backupFolder}`}>
            Destino: {backupFolder}
          </span>
        </div>
      </div>
    </div>
  );
}
