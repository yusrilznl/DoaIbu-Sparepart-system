import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { SparePart } from '../../types/inventory';
import { MapPin, ArrowRight, X, History, ChevronDown, Package } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedPart?: SparePart;
}

export const LocationMutationModal: React.FC<Props> = ({ isOpen, onClose, preselectedPart }) => {
  const { parts, locationMutations, recordLocationMutation } = useInventory();
  const { currentUser } = useAuth();

  const [selectedPartId, setSelectedPartId] = useState<string>(preselectedPart?.id || '');
  const [keLokasi, setKeLokasi] = useState<string>('');
  const [jumlah, setJumlah] = useState<number>(1);
  const [catatan, setCatatan] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  if (!isOpen) return null;

  const selectedPart = parts.find(p => p.id === selectedPartId) || preselectedPart;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !keLokasi.trim()) return;
    if (keLokasi.trim() === selectedPart.lokasiRak) {
      alert('Lokasi tujuan sama dengan lokasi saat ini!');
      return;
    }

    recordLocationMutation({
      partId: selectedPart.id,
      kodeItem: selectedPart.kodeItem,
      namaSparepart: selectedPart.namaSparepart,
      dariLokasi: selectedPart.lokasiRak,
      keLokasi: keLokasi.trim().toUpperCase(),
      jumlah,
      satuan: selectedPart.satuan,
      catatan: catatan || undefined,
      petugas: currentUser?.name || 'Petugas Gudang',
    });

    // Reset form
    if (!preselectedPart) setSelectedPartId('');
    setKeLokasi('');
    setJumlah(1);
    setCatatan('');
  };

  const recentMutations = locationMutations.slice(0, 30);
  const partMutations = selectedPart ? locationMutations.filter(m => m.partId === selectedPart.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[95vw] md:max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-black">Mutasi Lokasi Rak / Gudang</h3>
              <p className="text-xs text-slate-500 font-medium">Catat perpindahan fisik sparepart antar-rak atau gudang</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          {(['form', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition ${
                activeTab === tab ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'form' ? '📦 Form Mutasi' : `📋 Riwayat (${recentMutations.length})`}
            </button>
          ))}
        </div>

        {/* Tab: Form */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
            {/* Item Selector */}
            {!preselectedPart ? (
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Pilih Item Sparepart *</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    required
                    value={selectedPartId}
                    onChange={e => setSelectedPartId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-black text-sm focus:border-amber-500 focus:outline-none appearance-none"
                  >
                    <option value="">-- Pilih Item --</option>
                    {parts.map(p => (
                      <option key={p.id} value={p.id}>{p.kodeItem} — {p.namaSparepart} (Stok: {p.stokRealtime})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Package className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <div className="font-mono font-black text-black text-sm">{preselectedPart.kodeItem}</div>
                  <div className="text-xs font-bold text-slate-700">{preselectedPart.namaSparepart}</div>
                  <div className="text-[10px] text-slate-500">Stok: {preselectedPart.stokRealtime} {preselectedPart.satuan}</div>
                </div>
              </div>
            )}

            {/* Current Location Display */}
            {selectedPart && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lokasi Saat Ini</div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 border border-red-200 rounded-lg font-mono font-black text-red-700 text-sm">
                  <MapPin className="w-4 h-4" /> {selectedPart.lokasiRak}
                </span>
                {partMutations.length > 0 && (
                  <div className="text-[10px] text-slate-400 font-medium mt-2">
                    Terakhir dipindah: {partMutations[0].timestamp} oleh {partMutations[0].petugas}
                  </div>
                )}
              </div>
            )}

            {/* Destination Location */}
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1.5">Lokasi Tujuan (Rak/Gudang Baru) *</label>
              <div className="flex items-center gap-2">
                {selectedPart && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-slate-400 text-xs px-2 py-1.5 bg-slate-100 rounded-lg border">{selectedPart.lokasiRak}</span>
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                  </div>
                )}
                <input
                  type="text"
                  required
                  placeholder="misal: RAK-B3, Gudang Semarang..."
                  value={keLokasi}
                  onChange={e => setKeLokasi(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-black text-sm focus:border-amber-500 focus:outline-none uppercase placeholder:normal-case"
                />
              </div>
            </div>

            {/* Jumlah */}
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1.5">
                Jumlah yang Dipindah * {selectedPart && <span className="text-slate-400 font-medium">(Max: {selectedPart.stokRealtime} {selectedPart.satuan})</span>}
              </label>
              <input
                type="number"
                required
                min={1}
                max={selectedPart?.stokRealtime || 9999}
                value={jumlah}
                onChange={e => setJumlah(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-black text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1.5">Catatan / Alasan Pemindahan</label>
              <textarea
                placeholder="misal: Restrukturisasi layout rak, permintaan gudang site, dll."
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-black text-sm focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Preview Summary */}
            {selectedPart && keLokasi && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                <div className="font-black text-amber-800 mb-1">Ringkasan Mutasi:</div>
                <div className="text-amber-700 font-medium">
                  <strong>{selectedPart.kodeItem}</strong> — {jumlah} {selectedPart.satuan} dipindahkan dari <strong>{selectedPart.lokasiRak}</strong> → <strong>{keLokasi.toUpperCase()}</strong>
                  {catatan && <><br />Catatan: {catatan}</>}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition">
                Batal
              </button>
              <button
                type="submit"
                disabled={!selectedPart || !keLokasi.trim()}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Konfirmasi Mutasi
              </button>
            </div>
          </form>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="p-5 flex-1 space-y-3 overflow-y-auto">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {selectedPart ? `Riwayat Mutasi: ${selectedPart.kodeItem}` : 'Riwayat Mutasi Terbaru (30 Terakhir)'}
            </div>
            {(selectedPart ? partMutations : recentMutations).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <div className="font-semibold text-sm">Belum ada riwayat mutasi lokasi</div>
              </div>
            ) : (
              (selectedPart ? partMutations : recentMutations).map(m => (
                <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-amber-200 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-black text-black text-xs">{m.kodeItem}</div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">{m.namaSparepart}</div>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 shrink-0">{m.timestamp}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded border border-red-200 font-mono">{m.dariLokasi}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded border border-emerald-200 font-mono">{m.keLokasi}</span>
                    <span className="text-slate-500 font-medium ml-1">{m.jumlah} {m.satuan}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5">
                    Petugas: <span className="font-bold text-slate-600">{m.petugas}</span>
                    {m.catatan && <> · {m.catatan}</>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
