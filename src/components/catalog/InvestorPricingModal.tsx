import React from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { 
  X, TrendingUp, Building2, ShoppingBag, ShieldCheck, 
  CheckCircle2, DollarSign, Layers, Printer, ArrowUpRight, 
  HelpCircle, PieChart, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import { DoaIbuLogo } from '../common/DoaIbuLogo';

interface InvestorPricingModalProps {
  part: SparePart | null;
  onClose: () => void;
}

export const InvestorPricingModal: React.FC<InvestorPricingModalProps> = ({ part: initialPart, onClose }) => {
  const { parts } = useInventory();

  if (!initialPart) return null;

  // Always find the freshest version of the part from real-time context
  const part = parts.find(p => p.id === initialPart.id) || initialPart;

  // Format IDR Helper
  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  // Helper to determine effective selling price for a part
  const getEffectiveSellingPrice = (p: SparePart) => {
    if (p.hargaShopee && p.hargaShopee > 0) return p.hargaShopee;
    if (p.hargaTokopedia && p.hargaTokopedia > 0) return p.hargaTokopedia;
    if (p.hargaJual && p.hargaJual > 0) return p.hargaJual;
    if (p.hargaBeli && p.hargaBeli > 0) return p.hargaBeli * 1.30; // Benchmark 30% markup if not yet inputted
    return 0;
  };

  // 1. GLOBAL INVENTORY METRICS (Valuasi Gudang Keseluruhan)
  const totalInventoryValue = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalPotentialSalesValue = parts.reduce((acc, p) => acc + (p.stokRealtime * getEffectiveSellingPrice(p)), 0);
  const totalPotentialProfit = Math.max(0, totalPotentialSalesValue - totalInventoryValue);
  const totalPotentialMarginPercent = totalPotentialSalesValue > 0 
    ? ((totalPotentialProfit / totalPotentialSalesValue) * 100) 
    : 0;

  // 2. SELECTED ITEM METRICS (Valuasi SKU Terpilih)
  const isCustomPriceSet = (part.hargaShopee && part.hargaShopee > 0) || (part.hargaJual && part.hargaJual > 0) || (part.hargaTokopedia && part.hargaTokopedia > 0);
  const itemHpp = part.hargaBeli || 0;
  const itemStock = part.stokRealtime || 0;
  const itemInventoryValue = itemStock * itemHpp;
  
  // Base reference price for tiering calculations
  const effectiveBasePrice = getEffectiveSellingPrice(part);
  const itemPotentialSalesValue = itemStock * effectiveBasePrice;
  const itemPotentialProfit = Math.max(0, itemPotentialSalesValue - itemInventoryValue);
  const itemMarginPercent = itemPotentialSalesValue > 0 
    ? ((itemPotentialProfit / itemPotentialSalesValue) * 100) 
    : 0;

  // Tiering Prices Calculation (Diskon bertingkat profesional dari base market price)
  const tier1UnitPrice = Math.round(effectiveBasePrice * 0.85); // -15% Volume Besar
  const tier2UnitPrice = Math.round(effectiveBasePrice * 0.90); // -10% Grosir Menengah
  const tier3UnitPrice = Math.round(effectiveBasePrice * 0.95); // -5% Retail Partner
  const shopeeUnitPrice = part.hargaShopee && part.hargaShopee > 0 ? part.hargaShopee : effectiveBasePrice;
  const tokopediaUnitPrice = part.hargaTokopedia && part.hargaTokopedia > 0 ? part.hargaTokopedia : effectiveBasePrice;

  // Tier Matrix Definitions
  const tiers = [
    {
      tierNo: '1',
      name: 'Tier 1 (Wholesale / Distributor)',
      badge: 'Prioritas',
      badgeColor: 'bg-blue-100 text-[#0B3C85] border-blue-200',
      description: 'Mitra Prioritas / Distributor Utama (Order Volume Besar > 50 Pcs)',
      unitPrice: tier1UnitPrice,
      potentialSalesValue: itemStock * tier1UnitPrice,
      profitPerUnit: Math.max(0, tier1UnitPrice - itemHpp),
      isDirectInput: false,
    },
    {
      tierNo: '2',
      name: 'Tier 2 (Grosir Menengah)',
      badge: 'Grosir',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      description: 'Mitra Reguler / Toko Sparepart & Bengkel Rekanan Menengah',
      unitPrice: tier2UnitPrice,
      potentialSalesValue: itemStock * tier2UnitPrice,
      profitPerUnit: Math.max(0, tier2UnitPrice - itemHpp),
      isDirectInput: false,
    },
    {
      tierNo: '3',
      name: 'Tier 3 (Retail Partner)',
      badge: 'Retail',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Bengkel Kecil / Retail Partner Pembelian Minimum Ringan',
      unitPrice: tier3UnitPrice,
      potentialSalesValue: itemStock * tier3UnitPrice,
      profitPerUnit: Math.max(0, tier3UnitPrice - itemHpp),
      isDirectInput: false,
    },
    {
      tierNo: '🛍️',
      name: 'Harga Jual Shopee',
      badge: 'Official Online Store',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'Kanal Publik Shopee Indonesia (Marketplace B2C / Retail)',
      unitPrice: shopeeUnitPrice,
      potentialSalesValue: itemStock * shopeeUnitPrice,
      profitPerUnit: Math.max(0, shopeeUnitPrice - itemHpp),
      isDirectInput: Boolean(part.hargaShopee && part.hargaShopee > 0),
    },
    {
      tierNo: '🟢',
      name: 'Harga Jual Tokopedia / TikTok',
      badge: 'Official Online Store',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Kanal Resmi Tokopedia & TikTok Shop (Marketplace B2C)',
      unitPrice: tokopediaUnitPrice,
      potentialSalesValue: itemStock * tokopediaUnitPrice,
      profitPerUnit: Math.max(0, tokopediaUnitPrice - itemHpp),
      isDirectInput: Boolean(part.hargaTokopedia && part.hargaTokopedia > 0),
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl z-10 p-5 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <DoaIbuLogo size="sm" showSubtitle={true} />
            <div className="border-l border-slate-200 pl-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0B3C85] text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Investor & Partner Valuation Matrix
              </span>
              <h3 className="font-black text-lg sm:text-xl text-slate-900 mt-0.5">
                Struktur Harga Rekan / Mitra & Valuasi Penjualan
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

        {/* Dynamic Real-Time Sync Status Notice */}
        <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-2xl px-4 py-2.5 text-xs text-blue-900">
          <div className="flex items-center gap-2 font-bold">
            <RefreshCw className="w-4 h-4 text-[#0B3C85] animate-spin-slow shrink-0" />
            <span>Katalog Terkoneksi Real-time: Nilai otomatis terupdate saat harga atau stok baru diinput di sistem.</span>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${isCustomPriceSet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {isCustomPriceSet ? '✓ Harga Terkonfirmasi Admin' : '⚡ Estimasi Standar (+30% Margin)'}
          </span>
        </div>

        {/* Top 3 Metric Cards for Investors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Total Inventory Value (Cost / Modal) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  1. TOTAL INVENTORY VALUE
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">(Total Modal / HPP Gudang)</span>
                <p className="text-xl sm:text-2xl font-black font-mono mt-2 text-white tracking-tight">
                  {formatIdr(totalInventoryValue)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-sky-300" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-300 flex items-center gap-1.5 font-medium border-t border-white/10 pt-2">
              <span>Total SKU: <b className="text-white">{parts.length} Item</b></span>
            </div>
          </div>

          {/* Card 2: Total Potential Sales Value (Gross Revenue) */}
          <div className="bg-gradient-to-br from-[#0B3C85] to-blue-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-sky-200 uppercase tracking-wider block">
                  2. POTENTIAL SALES VALUE
                </span>
                <span className="text-[10px] text-sky-200/80 block -mt-0.5">(Potensi Nilai Penjualan Kotor)</span>
                <p className="text-xl sm:text-2xl font-black font-mono mt-2 text-amber-300 tracking-tight">
                  {formatIdr(totalPotentialSalesValue)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-sky-100 flex items-center gap-1.5 font-medium border-t border-white/10 pt-2">
              <span>Rumus: <b className="text-white">Σ (Stok × Harga Jual)</b></span>
            </div>
          </div>

          {/* Card 3: Projected Gross Profit & ROI */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
                  3. PROJECTED GROSS PROFIT
                </span>
                <span className="text-[10px] text-emerald-300/80 block -mt-0.5">(Potensi Keuntungan Bersih)</span>
                <p className="text-xl sm:text-2xl font-black font-mono mt-2 text-emerald-300 tracking-tight">
                  {formatIdr(totalPotentialProfit)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-emerald-200 flex items-center justify-between font-medium border-t border-white/10 pt-2">
              <span>Margin Potensial:</span>
              <b className="text-emerald-300 bg-emerald-800/60 px-2 py-0.5 rounded font-mono font-black">
                +{totalPotentialMarginPercent.toFixed(1)}%
              </b>
            </div>
          </div>
        </div>

        {/* Selected Part Detail Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                PART NUMBER TERPILIH
              </span>
              <h4 className="font-mono font-black text-slate-900 text-base sm:text-lg">
                {part.kodeItem} <span className="text-xs font-bold text-slate-500 font-sans">({part.brand})</span>
              </h4>
              <p className="text-xs text-slate-700 font-bold">
                {part.namaSparepart}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Stok Fisik Tersedia</span>
                <span className="font-mono font-black text-lg text-[#0B3C85]">
                  {itemStock} {part.satuan}
                </span>
              </div>
            </div>
          </div>

          {/* Part Level Financial Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block">Modal HPP Satuan</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {formatIdr(itemHpp)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block">Total Modal (Inventory Value)</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {formatIdr(itemInventoryValue)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-blue-200 bg-blue-50/40">
              <span className="text-[10px] font-bold text-[#0B3C85] block">Potensi Penjualan (Sales Value)</span>
              <span className="font-mono font-black text-[#0B3C85] text-sm">
                {formatIdr(itemPotentialSalesValue)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <span className="text-[10px] font-bold text-emerald-800 block">Potensi Laba Kotor Item</span>
              <span className="font-mono font-black text-emerald-700 text-sm">
                {formatIdr(itemPotentialProfit)} <span className="text-[10px] font-normal">({itemMarginPercent.toFixed(0)}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Table: Multi-Tier Pricing & Potential Sales Value */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0B3C85]" /> Matriks Skema Harga Rekan / Mitra & Potential Sales Value
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Simulasi nilai pendapatan jika seluruh stok ({itemStock} {part.satuan}) diserap pada masing-masing level penjualan
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-[#0B3C85] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              Multi-Channel Matrix
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Level / Kanal</th>
                  <th className="py-3 px-3.5">Kategori & Ketentuan</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3.5 text-right bg-slate-800 text-amber-300">Potential Sales Value</th>
                  <th className="py-3 px-3 text-right">Potensi Margin</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                {tiers.map((t, idx) => {
                  const marginPct = t.unitPrice > 0 ? ((t.profitPerUnit / t.unitPrice) * 100) : 0;

                  return (
                    <tr key={idx} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                            {t.tierNo}
                          </span>
                          <span className="font-black text-slate-900 text-xs">{t.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-[11px]">
                        {t.description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-xs text-slate-900">
                        {formatIdr(t.unitPrice)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-xs text-[#0B3C85] bg-blue-50/30">
                        {formatIdr(t.potentialSalesValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[11px] text-emerald-700">
                        +{marginPct.toFixed(0)}% <span className="text-[9px] text-slate-400 font-normal block font-sans">({formatIdr(t.profitPerUnit * itemStock)})</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${t.badgeColor}`}>
                          {t.badge}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formula Explanation Note for Investor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-black text-slate-800 text-[11px]">
              <PieChart className="w-4 h-4 text-[#0B3C85]" /> Rumus Perhitungan Potential Sales Value:
            </div>
            <p className="text-slate-600 text-[10px] leading-relaxed">
              • <b>Potential Sales Value</b> = <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">Stok Fisik × Harga Jual Terpasang</span><br />
              • <b>Projected Gross Profit</b> = <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">Potential Sales Value - Total HPP Modal</span><br />
              • Memberikan kepastian proyeksi likuiditas dan nilai realisasi persediaan secara komprehensif.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-black text-slate-800 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Jaminan Kualitas & Standar Mitra:
            </div>
            <p className="text-slate-600 text-[10px] leading-relaxed">
              • Seluruh stok tercatat real-time dari database warehouse PT Fardan Utama Niaga.<br />
              • Skema harga Tier 1, 2, dan 3 dapat disesuaikan dengan volume kontrak berkala.<br />
              • Setiap perubahan harga baru di master katalog akan langsung memperbarui kalkulasi ini.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium">
            Dokumen internal PT Fardan Utama Niaga • OptiPart Doa Ibu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
          >
            Tutup Presentasi
          </button>
        </div>
      </div>
    </div>
  );
};
