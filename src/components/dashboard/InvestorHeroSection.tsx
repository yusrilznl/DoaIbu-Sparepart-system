import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminRole } from '../../types/auth';
import { 
  DollarSign, TrendingUp, ArrowUpRight, Package, 
  Globe, Building, ShieldCheck, Eye, EyeOff, 
  Layers, AlertCircle, ChevronRight
} from 'lucide-react';

interface InvestorHeroSectionProps {
  onNavigate: (tab: string) => void;
}

export const InvestorHeroSection: React.FC<InvestorHeroSectionProps> = ({ onNavigate }) => {
  const { parts } = useInventory();
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

  // Financial Calculations
  const inventoryValueHpp = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalMarketValue = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaJual || p.hargaShopee || (p.hargaBeli ? p.hargaBeli * 1.30 : 0))), 0);
  const potentialSalesValue = parts.reduce((acc, p) => acc + (p.stokRealtime * getEffectiveSellingPrice(p)), 0);
  const projectedGrossProfit = Math.max(0, potentialSalesValue - inventoryValueHpp);
  const projectedMarginPercent = potentialSalesValue > 0 
    ? ((projectedGrossProfit / potentialSalesValue) * 100) 
    : 0;

  const formatIdr = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(val || 0));

  return (
    <div className="space-y-3.5 sm:space-y-4">
      
      {/* 📌 BARIS 1: KOTAK KIRI KANAN (INVENTORY VALUE & TOTAL MARKET VALUE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        
        {/* Kiri: INVENTORY VALUE */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" /> INVENTORY VALUE
            </span>
            <div className="flex items-center gap-1.5">
              {isSuperAdminCategory && (
                <button
                  onClick={toggleFinancialPrivacy}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title={isFinancialPrivacyEnabled ? "Tampilkan Nominal HPP" : "Sembunyikan/Sensor HPP"}
                >
                  {isFinancialPrivacyEnabled ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 block mt-1">
            Nilai Modal Bersih Persediaan Fisik Gudang (At Cost)
          </span>

          <div className="mt-3">
            {shouldSensorFinancialData ? (
              <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                Rp •••••••••
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {formatIdr(inventoryValueHpp)}
              </p>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Basis Data:</span>
            <b className="text-white font-mono">{parts.length} SKU Terdata</b>
          </div>
        </div>

        {/* Kanan: TOTAL MARKET VALUE */}
        <div className="bg-[#0B3C85] border border-blue-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-300" /> TOTAL MARKET VALUE
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-900/90 border border-blue-700 text-amber-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <span className="text-[11px] text-sky-100 block mt-1">
            Total Nilai Pasar Persediaan Terpasang
          </span>

          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tracking-tight">
              {formatIdr(totalMarketValue)}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-sky-100 font-medium">
            <span>Kanal Penjualan:</span>
            <b className="text-white">Shopee, Tokopedia, Mitra</b>
          </div>
        </div>
      </div>

      {/* 📊 BARIS 2: 4 KOTAK MINI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
        
        {/* 1. Total Sparepart */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs hover:border-[#0B3C85] transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              TOTAL SPAREPART
            </span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">{parts.length} SKU</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">Item Terdaftar</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-[#0B3C85] flex items-center justify-center group-hover:bg-blue-50 transition shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* 2. Sales Channel */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs hover:border-[#0B3C85] transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              SALES CHANNEL
            </span>
            <p className="text-lg sm:text-xl font-black text-[#0B3C85] mt-1">3 Platform</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">Shopee, Tokopedia, Mitra</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-[#0B3C85] flex items-center justify-center group-hover:bg-blue-50 transition shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Status Gudang */}
        <div 
          onClick={() => onNavigate('opname')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs hover:border-emerald-600 transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              STATUS GUDANG
            </span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">100% Verified</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">PT Fardan Utama Niaga</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-50 transition shrink-0">
            <Building className="w-4 h-4" />
          </div>
        </div>

        {/* 4. Limit Stock (15 Pcs) */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs hover:border-[#0B3C85] transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              LIMIT STOCK
            </span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">15 Pcs</p>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5">Batas Minimum Restock</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 📌 BARIS 3: KOTAK KIRI KANAN (POTENTIAL SALES & PROJECTED GROSS PROFIT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        
        {/* Kiri: POTENTIAL SALES */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" /> POTENTIAL SALES
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <span className="text-[11px] text-slate-400 block mt-1">
            Proyeksi Omset Penjualan Multi-Kanal
          </span>

          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
              {formatIdr(potentialSalesValue)}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Metode Kalkulasi:</span>
            <b className="text-white font-mono">Σ (Stok × Harga Efektif)</b>
          </div>
        </div>

        {/* Kanan: PROJECTED GROSS PROFIT */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" /> PROJECTED GROSS PROFIT
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <span className="text-[11px] text-slate-400 block mt-1">
            Potensi Keuntungan Bersih Realisasi Penjualan
          </span>

          <div className="mt-3">
            {shouldSensorFinancialData ? (
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                Rp •••••••••
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                {formatIdr(projectedGrossProfit)}
              </p>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Estimasi Margin:</span>
            <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-mono font-black text-xs">
              +{projectedMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
