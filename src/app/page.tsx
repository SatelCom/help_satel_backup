import { SatelGpsBackup } from '@/modules/satel-gps-backup';
import { ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-[#080d1a]">
      {/* Top Navigation Bar - Compact 44px */}
      <header className="h-11 shrink-0 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur z-50">
        <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                Satel<span className="text-blue-500">GPS</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                Excel Transformer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <div className="hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Módulo Independiente</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Renders the independent SatelGpsBackup module */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
        <SatelGpsBackup />
      </main>
    </div>
  );
}
