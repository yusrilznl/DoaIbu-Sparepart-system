import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { AlertTriangle, MapPin, ArrowRight, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export interface LowStockWidgetProps {
  onRestockClick?: (partId: string) => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({ onRestockClick }) => {
  const { getLowStockParts, getOverstockParts } = useInventory();
  const [activeAlert, setActiveAlert] = useState<'low' | 'over'>('low');

  const lowStockParts = getLowStockParts();
  const overstockParts = getOverstockParts();

  const displayParts = activeAlert === 'low' ? lowStockParts : overstockParts;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <h3 className="font-extrabold text-black text-sm flex items-center gap-2">
          {activeAlert === 'low'
            ? <><AlertTriangle className="w-4 h-4 text-red-600" /> Peringatan Stok ({lowStockParts.length})</>
            : <><TrendingDown className="w-4 h-4 text-amber-600" /> Overstock Alert ({overstockParts.length})</>
          }
        </h3>

        {/* Toggle Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveAlert('low')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition border ${
              activeAlert === 'low'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-red-200 hover:text-red-600'
            }`}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Kritis {lowStockParts.length > 0 && <span className="ml-1 bg-white/30 rounded px-1">{lowStockParts.length}</span>}
          </button>
          <button
            onClick={() => setActiveAlert('over')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition border ${
              activeAlert === 'over'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-600'
            }`}
          >
            <TrendingDown className="w-3 h-3 inline mr-1" />
            Overstock {overstockParts.length > 0 && <span className="ml-1 bg-white/30 rounded px-1">{overstockParts.length}</span>}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-72">
        {displayParts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-semibold text-xs px-4">
            {activeAlert === 'low'
              ? '✅ Semua stok sparepart berada di batas aman.'
              : '✅ Tidak ada item melebihi batas stok maksimum.'
            }
          </div>
        ) : (
          displayParts.map(part => {
            const isLow = activeAlert === 'low';
            const pctOfMin = isLow ? Math.round((part.stokRealtime / Math.max(1, part.stokMin)) * 100) : 0;
            const pctOfMax = !isLow && part.stokMax ? Math.round((part.stokRealtime / part.stokMax) * 100) : 0;

            return (
              <div key={part.id} className="py-3 px-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-xs text-black">{part.kodeItem}</span>
                    {isLow && part.stokRealtime === 0 && (
                      <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase">HABIS</span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 truncate">{part.namaSparepart}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                    <span className={`font-mono font-bold flex items-center gap-0.5 ${isLow ? 'text-red-600' : 'text-amber-600'}`}>
                      <MapPin className="w-3 h-3" /> {part.lokasiRak}
                    </span>
                    <span>| {part.brand}</span>
                  </div>

                  {/* Visual progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, isLow ? pctOfMin : pctOfMax)}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-mono font-black text-xs px-2 py-1 rounded-lg border block ${
                    isLow ? 'text-red-600 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {part.stokRealtime} / {isLow ? `Min ${part.stokMin}` : `Max ${part.stokMax}`} {part.satuan}
                  </span>

                  {onRestockClick && isLow && (
                    <button
                      onClick={() => onRestockClick(part.id)}
                      className="text-[10px] font-extrabold text-[#0B3C85] hover:underline mt-1 inline-flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Restock
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
