import React from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { 
  X, TrendingUp, Building2, ShoppingBag, ShieldCheck, 
  CheckCircle2, DollarSign, Layers, Printer, ArrowUpRight, 
  PieChart, RefreshCw, ChevronRight, Tag
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
      badge: 'Shopee Store',
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
      badge: 'Tokopedia / TikTok',
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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Container: Optimized for Mobile, Tablet, Laptop, and Large Displays */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 border border-slate-200 overflow-hidden">
        
        {/* Sticky Header Bar */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <DoaIbuLogo size="sm" showSubtitle={false} />
            <div className="border-l border-slate-200 pl-2.5 sm:pl-3 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0B3C85] text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                <ShieldCheck className="w-3 h-3 shrink-0" /> Investor Valuation Matrix
              </span>
              <h3 className="font-black text-sm sm:text-lg md:text-xl text-slate-900 mt-0.5 truncate leading-tight">
                Struktur Harga Rekan / Mitra & Valuasi
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Cetak Ringkasan Presentasi"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Tutup"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Dynamic Real-Time Sync Status Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/90 border border-blue-200 rounded-2xl p-3 sm:px-4 sm:py-2.5 text-xs text-blue-950">
            <div className="flex items-center gap-2 font-bold min-w-0">
              <RefreshCw className="w-4 h-4 text-[#0B3C85] shrink-0" />
              <span className="text-[11px] sm:text-xs leading-snug">
                Data Terhubung Real-Time: Kalkulasi diperbarui otomatis saat Anda menginput atau mengedit data sparepart.
              </span>
            </div>
            <span className={`self-start sm:self-auto text-[10px] font-extrabold px-2.5 py-1 rounded-md shrink-0 ${isCustomPriceSet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isCustomPriceSet ? '✓ Harga Terkonfirmasi Admin' : '⚡ Estimasi Standar (+30% Margin)'}
            </span>
          </div>

          {/* Top 3 Metric Cards for Investors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            {/* Card 1: Total Inventory Value (Cost / Modal) */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    INVENTORY VALUE
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-sky-300" />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block -mt-1">(Modal HPP Gudang)</span>
                <p className="text-lg sm:text-xl md:text-2xl font-black font-mono mt-1.5 text-white tracking-tight">
                  {formatIdr(totalInventoryValue)}
                </p>
              </div>
              <div className="mt-2.5 text-[10px] sm:text-[11px] text-slate-300 flex items-center gap-1.5 font-medium border-t border-white/10 pt-2">
                <span>Total Item: <b className="text-white">{parts.length} SKU</b></span>
              </div>
            </div>

            {/* Card 2: Potential Sales Value (Gross Revenue) */}
            <div className="bg-gradient-to-br from-[#0B3C85] via-blue-900 to-blue-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-sky-200 uppercase tracking-wider block">
                    POTENTIAL SALES VALUE
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-amber-300" />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] text-sky-200/80 block -mt-1">(Potensi Omset Penjualan)</span>
                <p className="text-lg sm:text-xl md:text-2xl font-black font-mono mt-1.5 text-amber-300 tracking-tight">
                  {formatIdr(totalPotentialSalesValue)}
                </p>
              </div>
              <div className="mt-2.5 text-[10px] sm:text-[11px] text-sky-100 flex items-center gap-1.5 font-medium border-t border-white/10 pt-2">
                <span>Rumus: <b className="text-white">Σ (Stok × Harga Jual)</b></span>
              </div>
            </div>

            {/* Card 3: Projected Gross Profit & ROI */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
                    PROJECTED GROSS PROFIT
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] text-emerald-300/80 block -mt-1">(Proyeksi Keuntungan)</span>
                <p className="text-lg sm:text-xl md:text-2xl font-black font-mono mt-1.5 text-emerald-300 tracking-tight">
                  {formatIdr(totalPotentialProfit)}
                </p>
              </div>
              <div className="mt-2.5 text-[10px] sm:text-[11px] text-emerald-200 flex items-center justify-between font-medium border-t border-white/10 pt-2">
                <span>Margin Potensial:</span>
                <b className="text-emerald-300 bg-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-black text-xs">
                  +{totalPotentialMarginPercent.toFixed(1)}%
                </b>
              </div>
            </div>
          </div>

          {/* Selected Part Detail Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  PART NUMBER TERPILIH
                </span>
                <h4 className="font-mono font-black text-slate-900 text-sm sm:text-base md:text-lg truncate">
                  {part.kodeItem} <span className="text-xs font-bold text-slate-500 font-sans">({part.brand})</span>
                </h4>
                <p className="text-xs text-slate-700 font-bold truncate">
                  {part.namaSparepart}
                </p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                <span className="text-[10px] font-bold text-slate-400">Stok Fisik Tersedia:</span>
                <span className="font-mono font-black text-sm sm:text-lg text-[#0B3C85]">
                  {itemStock} {part.satuan}
                </span>
              </div>
            </div>

            {/* Part Level Financial Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block">Modal HPP Satuan</span>
                <span className="font-mono font-black text-slate-800 text-xs sm:text-sm">
                  {formatIdr(itemHpp)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block truncate">Total Modal (Inv. Value)</span>
                <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                  {formatIdr(itemInventoryValue)}
                </span>
              </div>
              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#0B3C85] block truncate">Potential Sales Value</span>
                <span className="font-mono font-black text-[#0B3C85] text-xs sm:text-sm">
                  {formatIdr(itemPotentialSalesValue)}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 block truncate">Potensi Laba Kotor</span>
                <span className="font-mono font-black text-emerald-700 text-xs sm:text-sm">
                  {formatIdr(itemPotentialProfit)} <span className="text-[10px] font-normal">({itemMarginPercent.toFixed(0)}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Matrix & Potential Sales Value Section */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0B3C85] shrink-0" /> Matriks Harga Rekan / Mitra & Potential Sales Value
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  Simulasi pendapatan bila seluruh stok ({itemStock} {part.satuan}) diserap pada level berikut
                </p>
              </div>
              <span className="self-start sm:self-auto text-[9px] sm:text-[10px] font-extrabold text-[#0B3C85] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Multi-Channel Matrix
              </span>
            </div>

            {/* 🖥️ DESKTOP & TABLET TABLE VIEW (Hidden on mobile screens) */}
            <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
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

            {/* 📱 MOBILE CARD LIST VIEW (Optimized for Smartphone Screens < 768px) */}
            <div className="block md:hidden space-y-2.5">
              {tiers.map((t, idx) => {
                const marginPct = t.unitPrice > 0 ? ((t.profitPerUnit / t.unitPrice) * 100) : 0;

                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-black text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                          {t.tierNo}
                        </span>
                        <span className="font-black text-slate-900 text-xs truncate">{t.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${t.badgeColor}`}>
                        {t.badge}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-snug">
                      {t.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] font-bold text-slate-400 block">Harga Satuan</span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {formatIdr(t.unitPrice)}
                        </span>
                      </div>
                      <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-200">
                        <span className="text-[9px] font-bold text-[#0B3C85] block">Potential Sales Value</span>
                        <span className="font-mono font-black text-[#0B3C85] text-xs">
                          {formatIdr(t.potentialSalesValue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-medium">
                      <span>Proyeksi Laba ({itemStock} unit):</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +{marginPct.toFixed(0)}% ({formatIdr(t.profitPerUnit * itemStock)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formula Explanation Note for Investor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-black text-slate-800 text-[10px] sm:text-[11px]">
                <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B3C85] shrink-0" /> Rumus Potential Sales Value:
              </div>
              <p className="text-slate-600 text-[9px] sm:text-[10px] leading-relaxed">
                • <b>Potential Sales Value</b> = <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 font-bold">Stok Fisik × Harga Jual Terpasang</span><br />
                • <b>Projected Gross Profit</b> = <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 font-bold">Potential Sales Value - Total HPP Modal</span><br />
                • Memberikan kepastian proyeksi likuiditas dan nilai realisasi persediaan secara komprehensif.
              </p>
            </div>

            <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-black text-slate-800 text-[10px] sm:text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" /> Jaminan Kualitas & Standar Mitra:
              </div>
              <p className="text-slate-600 text-[9px] sm:text-[10px] leading-relaxed">
                • Seluruh stok tercatat real-time dari database warehouse PT Fardan Utama Niaga.<br />
                • Skema harga Tier 1, 2, dan 3 dapat disesuaikan dengan volume kontrak berkala.<br />
                • Setiap perubahan harga baru di master katalog akan langsung memperbarui kalkulasi ini.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Modal Action Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3.5 sm:p-5 border-t border-slate-200 bg-white">
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
            Dokumen internal PT Fardan Utama Niaga • OptiPart Doa Ibu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs transition shadow-sm cursor-pointer text-center"
          >
            Tutup Presentasi
          </button>
        </div>
      </div>
    </div>
  );
};
