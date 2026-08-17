import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownToLine, DollarSign, Lock, TrendingDown, BarChart3, MapPin, Activity } from 'lucide-react';

interface KpiCardsProps {
  onNavigate?: (tab: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ onNavigate }) => {
  const { parts, transactions, getLowStockParts, getOverstockParts, activityLogs } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const shouldSensorFinancialData = !isSuperAdmin || isFinancialPrivacyEnabled;

  const totalPartNumbers = parts.length;
  const lowStockParts = getLowStockParts();
  const overstockParts = getOverstockParts();
  const lowStockCount = lowStockParts.length;
  const overstockCount = overstockParts.length;

  const totalInboundCount = transactions.filter(t => t.jenisTransaksi === 'MUTASI_MASUK').length;
  const totalOutboundCount = transactions.filter(t => t.jenisTransaksi === 'MUTASI_KELUAR').length;

  const totalAssetValuationHpp = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalPotentialRevenue = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaJual || 0)), 0);
  const estimatedPotentialProfit = totalPotentialRevenue - totalAssetValuationHpp;

  const todayActivityCount = activityLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().substring(0, 10))).length;

  const formatIdr = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4">
      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Part Numbers */}
        <div
          onClick={() => onNavigate && onNavigate('catalog')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TOTAL SPAREPART (SKU)</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalPartNumbers}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Item Terdaftar</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center group-hover:bg-blue-100 transition">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Stok Kritis Alert (Pilar 1) */}
        <div
          onClick={() => onNavigate && onNavigate('opname')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group ${
            lowStockCount > 0 ? 'border-red-300 border-l-4 border-l-red-600 bg-red-50/30' : 'border-slate-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block">⚠ STOK KRITIS</span>
            <p className="text-2xl font-black text-red-600 mt-1">{lowStockCount} Item</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              {lowStockCount > 0 ? 'Butuh Restock Segera!' : 'Semua Aman ✓'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${lowStockCount > 0 ? 'bg-red-100 border border-red-300 text-red-600' : 'bg-slate-100 border border-slate-200 text-slate-400'}`}>
            <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Card 3: Overstock Alert (Pilar 1) */}
        <div
          onClick={() => onNavigate && onNavigate('catalog')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group ${
            overstockCount > 0 ? 'border-amber-300 border-l-4 border-l-amber-500 bg-amber-50/30' : 'border-slate-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">OVERSTOCK</span>
            <p className={`text-2xl font-black mt-1 ${overstockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{overstockCount} Item</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              {overstockCount > 0 ? 'Melebihi Batas Maks' : 'Tidak Ada Overstock'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${overstockCount > 0 ? 'bg-amber-100 border border-amber-300 text-amber-600' : 'bg-slate-100 border border-slate-200 text-slate-400'}`}>
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Transaksi */}
        <div
          onClick={() => onNavigate && onNavigate('reports')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TRANSAKSI BARANG</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black text-emerald-600 flex items-center gap-0.5">
                <ArrowDownToLine className="w-4 h-4" /> {totalInboundCount}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-black text-red-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-4 h-4" /> {totalOutboundCount}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Masuk / Keluar</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 2: Financial & Audit Summary (collapsible on mobile via smaller size) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Valuasi Aset HPP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">VALUASI ASET GUDANG (HPP)</span>
            {shouldSensorFinancialData ? (
              <p className="text-lg font-black text-amber-600 font-mono mt-1">Rp •••••••••</p>
            ) : (
              <p className="text-xl font-black text-slate-900 mt-1">{formatIdr(totalAssetValuationHpp)}</p>
            )}
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Total Modal HPP Fisik</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            {shouldSensorFinancialData ? <Lock className="w-5 h-5 text-amber-600" /> : <DollarSign className="w-5 h-5" />}
          </div>
        </div>

        {/* Pilar 2: Estimasi Potensi Profit */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">ESTIMASI POTENSI PROFIT</span>
            {shouldSensorFinancialData ? (
              <p className="text-lg font-black text-emerald-600 font-mono mt-1">Rp •••••••••</p>
            ) : (
              <p className="text-xl font-black text-emerald-700 mt-1">{formatIdr(estimatedPotentialProfit)}</p>
            )}
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Margin Jual Toko − HPP</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            {shouldSensorFinancialData ? <Lock className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
        </div>

        {/* Pilar 5: Aktivitas Hari Ini */}
        <div
          onClick={() => (isSuperAdmin || currentUser?.role === 'AUDITOR') && onNavigate && onNavigate('audit')}
          className={`bg-white border border-violet-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between ${(isSuperAdmin || currentUser?.role === 'AUDITOR') ? 'cursor-pointer hover:shadow-md transition' : ''}`}
        >
          <div>
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider block">AKTIVITAS HARI INI</span>
            <p className="text-2xl font-black text-violet-700 mt-1">{todayActivityCount}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Log Perubahan Data</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
