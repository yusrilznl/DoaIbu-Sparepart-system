import React from 'react';
import { OpnameItem } from '../../types/inventory';
import { ShieldCheck, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ApprovalModalProps {
  opnameItems: OpnameItem[];
  warehouseCode?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  opnameItems,
  warehouseCode = 'MGL',
  onClose,
  onConfirm
}) => {
  const itemsWithVariance = opnameItems.filter(i => i.selisih !== 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0B3C85]" />
            <h3 className="font-extrabold text-black text-base">
              Konfirmasi Adjust Stok Fisik (Approval Supervisor)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs font-semibold">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Memproses tombol ini akan secara otomatis memperbarui angka <strong>Stok Sistem Realtime</strong> di gudang <strong>{warehouseCode}</strong> agar tepat sama dengan angka <strong>Stok Fisik Input</strong>.
            </p>
          </div>

          <h4 className="font-bold text-slate-900">
            Ringkasan Item dengan Selisih ({itemsWithVariance.length} SKU):
          </h4>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-extrabold uppercase">
                  <th className="py-2.5 px-3">Kode Item</th>
                  <th className="py-2.5 px-3">Nama Sparepart</th>
                  <th className="py-2.5 px-3 text-center">Rak</th>
                  <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                  <th className="py-2.5 px-3 text-center">Stok Fisik</th>
                  <th className="py-2.5 px-3 text-center">Selisih Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {itemsWithVariance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-semibold">
                      Semua item fisik cocok dengan stok sistem (0 selisih).
                    </td>
                  </tr>
                ) : (
                  itemsWithVariance.map(item => (
                    <tr key={item.partId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-black">{item.kodeItem}</td>
                      <td className="py-2.5 px-3 font-semibold">{item.namaSparepart}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-red-600">{item.lokasiRak}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.stokSistem}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{item.stokFisik}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-extrabold">
                        {item.selisih < 0 ? (
                          <span className="text-red-600">{item.selisih} (Kurang)</span>
                        ) : (
                          <span className="text-emerald-700">+{item.selisih} (Lebih)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#0B3C85] hover:bg-blue-900 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow"
          >
            <CheckCircle2 className="w-4 h-4 text-sky-300" /> Setujui & Update Stok Sistem
          </button>
        </div>
      </div>
    </div>
  );
};
