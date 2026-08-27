import React, { useState } from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowUpRight, ArrowDownToLine, Image as ImageIcon, History, Info, Tag, ShoppingBag, Calculator, Lock } from 'lucide-react';
import { BarcodeLabelModal } from './BarcodeLabelModal';

interface DrawerProps {
  part: SparePart | null;
  onClose: () => void;
  onSelectForOutbound: (partId: string) => void;
  onSelectForInbound: (partId: string) => void;
}

export const ItemDetailDrawer: React.FC<DrawerProps> = ({
  part,
  onClose,
  onSelectForOutbound,
  onSelectForInbound
}) => {
  const { transactions } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();

  const [activeTab, setActiveTab] = useState<'INFO' | 'HISTORY'>('INFO');
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);

  if (!part) return null;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const shouldSensorHpp = !isSuperAdmin || isFinancialPrivacyEnabled;

  const isLowStock = part.stokRealtime <= part.stokMin;

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const hargaMp = part.hargaMarketplace || Math.round(part.hargaJual * 1.08);
  const adminFeePct = part.adminFeePercent || 8;
  const estimasiPotonganAdmin = Math.round(hargaMp * (adminFeePct / 100));
  const estimasiProfitBersihMp = hargaMp - estimasiPotonganAdmin - part.hargaBeli;

  const marginPercent = part.hargaJual > 0
    ? (((part.hargaJual - part.hargaBeli) / part.hargaJual) * 100).toFixed(1)
    : '0';

  // Item Audit Trail: filter all transactions containing this part.id
  const itemHistory = transactions.filter(tx =>
    tx.items.some(i => i.partId === part.id)
  );

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Dark Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        />

        {/* Drawer Panel */}
        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200 no-print print:hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DETAIL SPAREPART & MULTI-HARGA</span>
              <h3 className="font-mono font-extrabold text-black text-lg">{part.kodeItem}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBarcodeModal(true)}
                className="px-3 py-1.5 bg-[#0B3C85] text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs transition"
              >
                <Tag className="w-3.5 h-3.5" /> Stiker Barcode
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-black hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subtab Bar */}
          <div className="flex items-center border-b border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('INFO')}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'INFO' ? 'bg-white text-[#0B3C85] shadow-2xs' : 'text-slate-600 hover:text-black'
              }`}
            >
              <Info className="w-4 h-4" /> Informasi & Multi-Harga
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'HISTORY' ? 'bg-white text-[#0B3C85] shadow-2xs' : 'text-slate-600 hover:text-black'
              }`}
            >
              <History className="w-4 h-4" /> Riwayat Item ({itemHistory.length})
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {activeTab === 'INFO' && (
              <>
                {/* Product Photo Preview Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {part.fotoProduk ? (
                      <img src={part.fotoProduk} alt={part.kodeItem} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-1" />
                        <span className="text-[10px] font-bold block text-slate-400">Default Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-black text-slate-900 text-base leading-tight">{part.namaSparepart}</h4>
                    <p className="text-xs text-[#0B3C85] font-extrabold">Brand: {part.brand}</p>
                    <p className="text-xs text-red-600 font-mono font-bold">Lokasi Rak / Alamat: {part.lokasiRak}</p>
                    {part.oemNumber && (
                      <p className="text-[11px] text-slate-500 font-mono">OEM Ref: {part.oemNumber}</p>
                    )}
                  </div>
                </div>

                {/* Multi-Channel Pricing & Financial Privacy Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    STRUKTUR MULTI-HARGA PENJUALAN
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">HPP / Modal (Beli)</span>
                      {shouldSensorHpp ? (
                        <span className="font-mono font-black text-xs text-amber-700 block mt-0.5">Rp ••••••• (Sensor)</span>
                      ) : (
                        <span className="font-mono font-black text-sm text-slate-900">{formatIdr(part.hargaBeli)}</span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Harga Offline Store</span>
                      <span className="font-mono font-black text-sm text-emerald-700">{formatIdr(part.hargaJual)}</span>
                    </div>
                  </div>

                  {/* Shopee Pricing */}
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-orange-950 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-orange-600" /> Harga Shopee (Admin {part.adminFeeShopeePercent || 8.5}%)
                      </span>
                      <span className="font-mono font-black text-sm text-orange-600">
                        {formatIdr(part.hargaShopee || Math.round(part.hargaJual * 1.085))}
                      </span>
                    </div>
                  </div>

                  {/* Tokopedia / TikTok Shop Pricing */}
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" /> Harga Tokopedia/TikTok (Admin {part.adminFeeTokopediaPercent || 8.0}%)
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-800">
                        {formatIdr(part.hargaTokopedia || Math.round(part.hargaJual * 1.08))}
                      </span>
                    </div>
                  </div>

                  {!shouldSensorHpp && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                      <span>Profit Margin Toko (Offline):</span>
                      <span className="font-mono font-black text-sm">{formatIdr(part.hargaJual - part.hargaBeli)} (+{marginPercent}%)</span>
                    </div>
                  )}
                </div>

                {/* Stock Level Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">STATUS STOK GUDANG</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Stok Fisik Saat Ini</span>
                      <span className={`font-mono font-black text-lg ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                        {part.stokRealtime} {part.satuan}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Total Nilai Aset Stok</span>
                      {shouldSensorHpp ? (
                        <span className="font-mono font-black text-xs text-amber-700 block mt-1">Rp ••••••• (Sensor)</span>
                      ) : (
                        <span className="font-mono font-black text-sm text-slate-900">
                          {formatIdr(part.stokRealtime * part.hargaBeli)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Description */}
                {part.deskripsi && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Catatan Tambahan</span>
                    <p className="text-slate-700 leading-relaxed font-medium">{part.deskripsi}</p>
                  </div>
                )}
              </>
            )}

            {/* Tab 2: Item Audit Trail (Riwayat Pergerakan Item) */}
            {activeTab === 'HISTORY' && (
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">KRONOLOGI PERGERAKAN MUTASI</span>

                {itemHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-slate-200">
                    Belum ada riwayat mutasi untuk barang ini.
                  </div>
                ) : (
                  itemHistory.map(tx => {
                    const line = tx.items.find(i => i.partId === part.id);
                    const isInbound = tx.jenisTransaksi === 'MUTASI_MASUK';

                    return (
                      <div key={tx.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isInbound ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isInbound ? '📦 Mutasi Masuk (Restock)' : '📤 Mutasi Keluar (Surat Jalan)'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">{tx.tanggal}</span>
                        </div>

                        <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                          <span>{tx.noTransaksi}</span>
                          <span className={isInbound ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                            {isInbound ? `+${line?.jumlahTerima || 0}` : `-${line?.jumlahKirim || 0}`} {part.satuan}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 font-medium">
                          <p>Gudang/Tujuan: <strong>{tx.pelanggan}</strong></p>
                          <p>Petugas: <strong>{tx.salesPerson}</strong></p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Quick Action Footer Buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onSelectForOutbound(part.id);
              }}
              disabled={part.stokRealtime <= 0}
              className="py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition"
            >
              <ArrowUpRight className="w-4 h-4" /> Mutasi Keluar
            </button>

            <button
              onClick={() => {
                onClose();
                onSelectForInbound(part.id);
              }}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition"
            >
              <ArrowDownToLine className="w-4 h-4" /> Restock Masuk
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Label Print Modal */}
      {showBarcodeModal && (
        <BarcodeLabelModal
          part={part}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
    </>
  );
};
