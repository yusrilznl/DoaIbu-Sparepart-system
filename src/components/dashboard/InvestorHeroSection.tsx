import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminRole } from '../../types/auth';
import { 
  DollarSign, TrendingUp, ArrowUpRight, Package, 
  Globe, Building, ShieldCheck, Eye, EyeOff, 
  Layers, AlertTriangle, ChevronRight, Lock
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

  // Limit Stock calculation (Stok per produk <= 15 pcs)
  const limitStockParts = parts.filter(p => p.stokRealtime <= 15);
  const limitStockCount = limitStockParts.length;

  // Clean currency format: "Rp " + space + formatted number
  const formatIdr = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(val || 0));
    return `Rp ${formatted}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 📌 BARIS 1: KOTAK KIRI KANAN (INVENTORY VALUE & TOTAL MARKET VALUE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Kiri: INVENTORY VALUE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between group hover:shadow-sm transition">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                INVENTORY VALUE
              </span>
              {isSuperAdminCategory && (
                <button
                  onClick={toggleFinancialPrivacy}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={isFinancialPrivacyEnabled ? "Klik untuk Tampilkan Angka HPP" : "Klik untuk Sembunyikan/Sensor HPP"}
                >
                  {isFinancialPrivacyEnabled ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-[#0B3C85]" />}
                </button>
              )}
            </div>

            {shouldSensorFinancialData ? (
              <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">
                Rp •••••••••
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {formatIdr(inventoryValueHpp)}
              </p>
            )}

            <p className="text-xs font-bold text-slate-500">
              Total Cost Basis (At Cost) • <span className="font-mono">{parts.length} SKU</span>
            </p>
          </div>

          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
            shouldSensorFinancialData 
              ? 'bg-amber-50 border-amber-200 text-amber-700' 
              : 'bg-blue-50 border-blue-200 text-[#0B3C85]'
          }`}>
            {shouldSensorFinancialData ? <Lock className="w-6 h-6 text-amber-600" /> : <DollarSign className="w-6 h-6" />}
          </div>
        </div>

        {/* Kanan: TOTAL MARKET VALUE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between group hover:shadow-sm transition">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-[#0B3C85] uppercase tracking-wider block">
              TOTAL MARKET VALUE
            </span>

            <p className="text-2xl sm:text-3xl font-black text-[#0B3C85] font-mono tracking-tight">
              {formatIdr(totalMarketValue)}
            </p>

            <p className="text-xs font-bold text-slate-500">
              Total Nilai Pasar Persediaan Terpasang
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 📊 BARIS 2: 4 KOTAK METRICS DENGAN AKSEN WARNA TEGAS SEPERTI AWAL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* 1. Total Sparepart */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              TOTAL SPAREPART (SKU)
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{parts.length}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Item Terdaftar</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center group-hover:bg-blue-100 transition shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Sales Channel */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              SALES CHANNEL
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#0B3C85] mt-1">3 Platform</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Shopee, Tokopedia, Mitra</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition shrink-0">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Status Gudang */}
        <div 
          onClick={() => onNavigate('opname')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              STATUS GUDANG
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">100% Verified</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">PT Fardan Utama Niaga</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Limit Stock (Alert Merah Aktif bila ada item <= 15 Pcs) */}
        <div 
          onClick={() => onNavigate('catalog')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group ${
            limitStockCount > 0 
              ? 'border-red-300 border-l-4 border-l-red-600 bg-red-50/30' 
              : 'border-slate-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block">
              ⚠ LIMIT STOCK (≤ 15 PCS)
            </span>
            <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">{limitStockCount} Item</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              {limitStockCount > 0 ? 'Butuh Restock Segera!' : 'Semua Aman ✓'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition shrink-0 ${
            limitStockCount > 0 
              ? 'bg-red-100 border border-red-300 text-red-600' 
              : 'bg-slate-100 border border-slate-200 text-slate-400'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${limitStockCount > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      </div>

      {/* 📌 BARIS 3: KOTAK KIRI KANAN (POTENTIAL SALES & PROJECTED GROSS PROFIT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Kiri: POTENTIAL SALES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between group hover:shadow-sm transition">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
              POTENTIAL SALES
            </span>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatIdr(potentialSalesValue)}
            </p>

            <p className="text-xs font-bold text-slate-500">
              Proyeksi Nilai Penjualan Multi-Kanal
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Kanan: PROJECTED GROSS PROFIT */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between group hover:shadow-sm transition">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block">
                PROJECTED GROSS PROFIT
              </span>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-black text-[10px]">
                +{projectedMarginPercent.toFixed(1)}%
              </span>
            </div>

            {shouldSensorFinancialData ? (
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
                Rp •••••••••
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
                {formatIdr(projectedGrossProfit)}
              </p>
            )}

            <p className="text-xs font-bold text-slate-500">
              Potensi Keuntungan Bersih Realisasi Penjualan
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
