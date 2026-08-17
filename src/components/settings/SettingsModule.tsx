import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Settings, Warehouse as WarehouseIcon, Database } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { warehouses, parts, transactions } = useInventory();

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0B3C85]" /> Pengaturan Gudang & Sistem
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Konfigurasi gudang Doa Ibu Sparepart | PT FUN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-extrabold text-black text-sm flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4 text-[#0B3C85]" /> Daftar Gudang Terdaftar
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {warehouses.map(w => (
              <div key={w.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-black">{w.code} - {w.name}</span>
                  <p className="text-[11px] text-slate-500">{w.address}</p>
                </div>
                <span className="font-mono font-bold text-slate-700">{w.totalRak} Rak</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-extrabold text-black text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Ringkasan Database
          </h3>
          <div className="space-y-2 text-xs font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Part Number (SKU):</span>
              <span className="font-mono font-extrabold text-black">{parts.length} Item</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Riwayat Mutasi:</span>
              <span className="font-mono font-extrabold text-black">{transactions.length} Transaksi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
