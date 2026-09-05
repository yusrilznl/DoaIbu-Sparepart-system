import React from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { X, TrendingUp, Building2, ShoppingBag, ShieldCheck, CheckCircle2, DollarSign, Layers, Printer } from 'lucide-react';
import { DoaIbuLogo } from '../common/DoaIbuLogo';

interface InvestorPricingModalProps {
  part: SparePart | null;
  onClose: () => void;
}

export const InvestorPricingModal: React.FC<InvestorPricingModalProps> = ({ part, onClose }) => {
  const { parts } = useInventory();

  if (!part) return null;

  // Format IDR Helper
  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Calculate Total Inventory Value from Master Catalog
  const totalInventoryValue = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalMarketValue = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaShopee || p.hargaJual || 0)), 0);
  const itemInventoryValue = part.stokRealtime * (part.hargaBeli || 0);

  // Default calculation helpers for Tiers based on marketplace / base prices (ready for owner customization)
  const basePrice = part.hargaShopee && part.hargaShopee > 0 ? part.hargaShopee : (part.hargaJual || part.hargaBeli * 1.25);
  
  // Tier 1: Mitra Prioritas (Volume Besar) -> Base - 15%
  const tier1Price = Math.round(basePrice * 0.85);
  // Tier 2: Mitra Reguler (Grosir Menengah) -> Base - 10%
  const tier2Price = Math.round(basePrice * 0.90);
  // Tier 3: Mitra Retail (Bengkel Rekanan) -> Base - 5%
  const tier3Price = Math.round(basePrice * 0.95);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl z-10 p-5 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <DoaIbuLogo size="sm" showSubtitle={true} />
            <div className="border-l border-slate-200 pl-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0B3C85] text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Investor & Partner Presentation
              </span>
              <h3 className="font-black text-lg sm:text-xl text-slate-900 mt-0.5">
                Struktur Harga Rekan / Mitra & Valuasi
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Cetak Ringkasan Presentasi"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards: Inventory Value & Item Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Inventory Value */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-sky-300 uppercase tracking-widest block">
                TOTAL INVENTORY VALUE (GUDANG)
              </span>
              <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-white tracking-tight">
                {formatIdr(totalInventoryValue)}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-300">
                <span>Total Item: <b className="text-white">{parts.length} SKU</b></span>
                <span>•</span>
                <span>Potensi Pasar: <b className="text-emerald-400">{formatIdr(totalMarketValue)}</b></span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-sky-300" />
            </div>
          </div>

          {/* Card 2: Selected Item Overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                PART NUMBER TERPILIH
              </span>
              <h4 className="font-mono font-black text-slate-900 text-base sm:text-lg truncate">
                {part.kodeItem}
              </h4>
              <p className="text-xs text-slate-600 font-bold truncate max-w-[230px]">
                {part.namaSparepart}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                Stok Fisik: <b className="text-[#0B3C85]">{part.stokRealtime} {part.satuan}</b> | Valuasi: <b className="text-emerald-700">{formatIdr(itemInventoryValue)}</b>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-[#0B3C85]" />
            </div>
          </div>
        </div>

        {/* Main Section: Pricing Matrix Table for Investor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0B3C85]" /> Matriks Skema Harga Mitra (Tiering) & Marketplace
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Daftar level harga rekanan terstruktur dan harga jual resmi multi-channel
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              S&K Berlaku Aktif
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Level / Kanal Penjualan</th>
                  <th className="py-3 px-4">Kategori Mitra & Ketentuan</th>
                  <th className="py-3 px-4 text-right">Harga Satuan (Rp)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                {/* 1. Tier 1 */}
                <tr className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#0B3C85] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span className="font-black text-slate-900 text-xs">Tier 1</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Mitra Prioritas / Distributor Utama (Pembelian Volume Besar)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#0B3C85]">
                    {formatIdr(tier1Price)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#0B3C85] text-[10px] font-bold">
                      Prioritas
                    </span>
                  </td>
                </tr>

                {/* 2. Tier 2 */}
                <tr className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span className="font-black text-slate-900 text-xs">Tier 2</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Mitra Reguler / Grosir Menengah & Kontraktor Rekanan
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-sky-800">
                    {formatIdr(tier2Price)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">
                      Grosir
                    </span>
                  </td>
                </tr>

                {/* 3. Tier 3 */}
                <tr className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span className="font-black text-slate-900 text-xs">Tier 3</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Mitra Retail / Bengkel Rekanan & Toko Cabang
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-indigo-900">
                    {formatIdr(tier3Price)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      Retail
                    </span>
                  </td>
                </tr>

                {/* 4. Harga Jual Shopee */}
                <tr className="hover:bg-orange-50/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-orange-600 shrink-0" />
                      <span className="font-black text-orange-700 text-xs">Harga Jual Shopee</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Kanal Resmi Shopee (Marketplace Publik)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-orange-600">
                    {part.hargaShopee && part.hargaShopee > 0 ? formatIdr(part.hargaShopee) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                      Online Store
                    </span>
                  </td>
                </tr>

                {/* 5. Harga Jual Tokopedia / TikTok */}
                <tr className="hover:bg-emerald-50/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span className="font-black text-emerald-800 text-xs">Harga Jual Tokopedia / TikTok</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Kanal Resmi Tokopedia & TikTok Shop
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-800">
                    {part.hargaTokopedia && part.hargaTokopedia > 0 ? formatIdr(part.hargaTokopedia) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Online Store
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* S&K Note Footer Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Catatan Syarat & Ketentuan (S&K) Rekan / Mitra:
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            1. Harga Tier 1 berlaku untuk pesanan minimum volume partai besar dengan jadwal supply rutin bulanan.<br />
            2. Harga Tier 2 dan Tier 3 disesuaikan dengan skala bengkel, toko cabang, dan termin pembayaran yang disepakati.<br />
            3. Seluruh komponen sparepart dijamin 100% Genuine / OEM Quality dengan standar pengujian warehouse PT Fardan Utama Niaga.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
          >
            Tutup Presentasi
          </button>
        </div>
      </div>
    </div>
  );
};
