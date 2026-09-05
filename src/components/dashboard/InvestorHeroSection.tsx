import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminRole } from '../../types/auth';
import { 
  DollarSign, TrendingUp, ArrowUpRight, Package, 
  ArrowDownToLine, Lock, Eye, EyeOff, ShieldCheck, 
  Zap, Building, Globe, CheckCircle2, ChevronRight, Layers
} from 'lucide-react';

interface InvestorHeroSectionProps {
  onNavigate: (tab: string) => void;
}

export const InvestorHeroSection: React.FC<InvestorHeroSectionProps> = ({ onNavigate }) => {
  const { parts, transactions } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled, toggleFinancialPrivacy } = useAuth();

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);
  const shouldSensorFinancialData = !isSuperAdminCategory || isFinancialPrivacyEnabled;

  // Helper to determine effective selling price
  const getEffectiveSellingPrice = (p: any) => {
    if (p.hargaShopee && p.hargaShopee > 0) return p.hargaShopee;
    if (p.hargaTokopedia && p.hargaTokopedia > 0) return p.hargaTokopedia;
    if (p.hargaJual && p.hargaJual > 0) return p.hargaJual;
    if (p.hargaBeli && p.hargaBeli > 0) return p.hargaBeli * 1.30;
    return 0;
  };

  // Financial Metrics
  const totalInventoryValueHpp = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalPotentialSalesValue = parts.reduce((acc, p) => acc + (p.stokRealtime * getEffectiveSellingPrice(p)), 0);
  const estimatedPotentialProfit = Math.max(0, totalPotentialSalesValue - totalInventoryValueHpp);
  const potentialMarginPercent = totalPotentialSalesValue > 0 
    ? ((estimatedPotentialProfit / totalPotentialSalesValue) * 100) 
    : 0;

  const totalInboundCount = transactions.filter(t => t.jenisTransaksi === 'MUTASI_MASUK').length;
  const totalOutboundCount = transactions.filter(t => t.jenisTransaksi === 'MUTASI_KELUAR').length;

  const formatIdr = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(val || 0));

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 🚀 EXECUTIVE INVESTOR HERO CARDS (Top 3 Primary Financial Pillars) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        
        {/* Card 1: Total Inventory Value */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between group border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 1. TOTAL INVENTORY VALUE
              </span>
              <div className="flex items-center gap-1">
                {isSuperAdminCategory && (
                  <button
                    onClick={toggleFinancialPrivacy}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                    title={isFinancialPrivacyEnabled ? "Tampilkan Nominal HPP" : "Sembunyikan/Sensor HPP"}
                  >
                    {isFinancialPrivacyEnabled ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-sky-300" />}
                  </button>
                )}
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-sky-300" />
                </div>
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-0.5">
              Nilai Modal Bersih Aset Fisik Gudang (At Cost)
            </span>

            <div className="mt-3">
              {shouldSensorFinancialData ? (
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-400 font-mono tracking-tight">
                  Rp •••••••••
                </p>
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-white tracking-tight">
                  {formatIdr(totalInventoryValueHpp)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span>Terdaftar di Sistem:</span>
            <b className="text-white font-mono">{parts.length} SKU Aktif</b>
          </div>
        </div>

        {/* Card 2: Potential Sales Value */}
        <div className="bg-gradient-to-br from-[#0B3C85] via-blue-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between group border border-blue-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> 2. POTENTIAL SALES VALUE
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-amber-300" />
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] text-sky-200 block mt-0.5">
              Potensi Omset Realisasi Pasar Multi-Channel
            </span>

            <div className="mt-3">
              <p className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-amber-300 tracking-tight">
                {formatIdr(totalPotentialSalesValue)}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-sky-200">
            <span>Kanal Distribusi:</span>
            <b className="text-white">Shopee, Tokopedia, B2B Mitra</b>
          </div>
        </div>

        {/* Card 3: Projected Gross Profit & ROI */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between group border border-emerald-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> 3. PROJECTED GROSS PROFIT
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] text-emerald-200/80 block mt-0.5">
              Potensi Keuntungan Bersih Realisasi Penjualan
            </span>

            <div className="mt-3">
              {shouldSensorFinancialData ? (
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  Rp •••••••••
                </p>
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-emerald-300 tracking-tight">
                  {formatIdr(estimatedPotentialProfit)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-200">
            <span>Margin Keuntungan:</span>
            <span className="bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-black text-xs">
              +{potentialMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 📊 SECONDARY KPI ROW: Operational & Transactions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total SKU */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              TOTAL SPAREPART
            </span>
            <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1">{parts.length} SKU</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
              Katalog Lengkap <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
            </p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center group-hover:bg-blue-100 transition shrink-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 2: Transaksi Mutasi */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              TRANSAKSI BARANG
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-mono font-black text-sm sm:text-base">
              <span className="text-emerald-700 flex items-center">
                <ArrowDownToLine className="w-3.5 h-3.5 mr-0.5" /> {totalInboundCount}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-red-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> {totalOutboundCount}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">Inbound / Outbound</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center group-hover:bg-blue-100 transition shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 3: Multi-Channel Ready */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              SALES CHANNEL
            </span>
            <p className="text-lg sm:text-2xl font-black text-[#0B3C85] mt-1">3 Platform</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">Shopee, Tokopedia, Mitra</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition shrink-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 4: Warehouse Verification */}
        <div 
          onClick={() => onNavigate('opname')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              STATUS GUDANG
            </span>
            <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1">100% Verified</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">PT Fardan Utama Niaga</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition shrink-0">
            <Building className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 🌟 INVESTOR VALUE PROPOSITION BANNER (Key Pitching Reasons) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0B3C85] to-blue-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Strategic Investment Opportunity
            </span>
            <h3 className="text-base sm:text-lg lg:text-xl font-black text-white leading-snug">
              Mengapa Berinvestasi & Bermitra dengan Doa Ibu Sparepart?
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              Didukung infrastruktur pergudangan modern dan jaringan distribusi aktif di sektor alat berat, industri, serta otomotif komersial.
            </p>
          </div>

          <button
            onClick={() => onNavigate('catalog')}
            className="self-start lg:self-center px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            Eksplorasi Portofolio Katalog <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Selling Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-[11px]">Perputaran Cepat (High Velocity)</h5>
              <p className="text-[10px] text-slate-300 mt-0.5">Komponen fast-moving diesel dan filter dengan demand rutin tinggi.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-[11px]">100% Genuine Quality</h5>
              <p className="text-[10px] text-slate-300 mt-0.5">Jaminan keaslian part dan standar quality control teruji.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-[11px]">Multi-Channel Marketplace</h5>
              <p className="text-[10px] text-slate-300 mt-0.5">Terintegrasi dengan Shopee, Tokopedia, serta jaringan bengkel mitra.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-[11px]">Live Database & Real-Time Sync</h5>
              <p className="text-[10px] text-slate-300 mt-0.5">Valuasi dan stok terupdate otomatis melalui Supabase Cloud.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
