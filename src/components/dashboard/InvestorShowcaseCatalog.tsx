import React, { useState, useMemo } from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminRole } from '../../types/auth';
import { 
  Sparkles, Flame, DollarSign, TrendingUp, Search, 
  ArrowRight, ShieldCheck, Layers, ShoppingBag, Eye, 
  EyeOff, CheckCircle2, ChevronRight, Tag, Star
} from 'lucide-react';
import { DEFAULT_FILTER_PHOTO, DEFAULT_ENGINE_PHOTO } from '../../mock/initialData';

interface InvestorShowcaseCatalogProps {
  onNavigate: (tab: string) => void;
  onOpenInvestorModal: (part: SparePart) => void;
}

export const InvestorShowcaseCatalog: React.FC<InvestorShowcaseCatalogProps> = ({ 
  onNavigate, 
  onOpenInvestorModal 
}) => {
  const { parts } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);
  const shouldSensorHpp = !isSuperAdminCategory || isFinancialPrivacyEnabled;

  const [selectedCategory, setSelectedCategory] = useState<string>('FAST_MOVING');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const formatIdr = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(val || 0));

  // Helper for effective price
  const getEffectiveSellingPrice = (p: SparePart) => {
    if (p.hargaShopee && p.hargaShopee > 0) return p.hargaShopee;
    if (p.hargaTokopedia && p.hargaTokopedia > 0) return p.hargaTokopedia;
    if (p.hargaJual && p.hargaJual > 0) return p.hargaJual;
    if (p.hargaBeli && p.hargaBeli > 0) return p.hargaBeli * 1.30;
    return 0;
  };

  // Filtered Showcase Products
  const filteredProducts = useMemo(() => {
    let list = [...parts];

    // Category filter
    if (selectedCategory === 'FAST_MOVING') {
      list = list.filter(p => p.turnoverStatus === 'FAST_MOVING' || p.stokRealtime >= 10 || p.brand === 'FLEETGUARD');
    } else if (selectedCategory === 'HIGH_MARGIN') {
      list = list.filter(p => {
        const sell = getEffectiveSellingPrice(p);
        const margin = sell - (p.hargaBeli || 0);
        return margin >= 50000 || (p.hargaBeli > 0 && (margin / p.hargaBeli) >= 0.35);
      });
    } else if (selectedCategory === 'ENGINE') {
      list = list.filter(p => 
        (p.namaSparepart && (p.namaSparepart.toLowerCase().includes('filter') || p.namaSparepart.toLowerCase().includes('engine') || p.namaSparepart.toLowerCase().includes('fuel') || p.namaSparepart.toLowerCase().includes('oil'))) ||
        p.brand === 'FLEETGUARD' || p.brand === 'KOMATSU'
      );
    }

    // Search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(p => 
        p.kodeItem.toLowerCase().includes(q) ||
        p.namaSparepart.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    // Default fallback if filtered list is empty: show first 8 parts
    if (list.length === 0) {
      list = parts.slice(0, 8);
    }

    return list.slice(0, 8); // Max 8 showcase items for maximum impact
  }, [parts, selectedCategory, searchFilter]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs space-y-5">
      
      {/* 🌟 Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Featured Fast-Moving Portfolio
            </span>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Kurasi Produk Potensial</span>
          </div>
          <h3 className="font-black text-lg sm:text-xl text-slate-900 mt-1">
            Katalog Produk Unggulan & Perputaran Cepat
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Portofolio produk dengan perputaran tinggi dan margin optimal yang siap didistribusikan secara multi-channel
          </p>
        </div>

        {/* Action Button to Full Catalog */}
        <button
          onClick={() => onNavigate('catalog')}
          className="self-start lg:self-center px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B3C85] border border-blue-200 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          Lihat Semua {parts.length} Produk di Katalog <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 🏷️ Filter Categories & Quick Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('FAST_MOVING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'FAST_MOVING'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${selectedCategory === 'FAST_MOVING' ? 'text-amber-400' : 'text-slate-500'}`} />
            Fast-Moving & High Turnover
          </button>

          <button
            onClick={() => setSelectedCategory('HIGH_MARGIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'HIGH_MARGIN'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <DollarSign className={`w-3.5 h-3.5 ${selectedCategory === 'HIGH_MARGIN' ? 'text-emerald-400' : 'text-slate-500'}`} />
            High Margin Booster
          </button>

          <button
            onClick={() => setSelectedCategory('ENGINE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'ENGINE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${selectedCategory === 'ENGINE' ? 'text-sky-400' : 'text-slate-500'}`} />
            Filters & Engine Genuine
          </button>

          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua Pilihan
          </button>
        </div>

        {/* Quick Search in Showcase */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU di showcase..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C85] transition"
          />
        </div>
      </div>

      {/* 📦 PRODUCT CARDS GRID (Ultra-Responsive: 1 col on mobile, 2 cols on tablet, 4 cols on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {filteredProducts.map((p) => {
          const effectiveSellPrice = getEffectiveSellingPrice(p);
          const hppPrice = p.hargaBeli || 0;
          const unitProfit = Math.max(0, effectiveSellPrice - hppPrice);
          const marginPercent = effectiveSellPrice > 0 ? ((unitProfit / effectiveSellPrice) * 100) : 0;
          const itemPotentialSales = p.stokRealtime * effectiveSellPrice;

          // Resolve image
          const imageSrc = Array.isArray(p.gambar) && p.gambar.length > 0 
            ? p.gambar[0] 
            : (p.fotoProduk || DEFAULT_FILTER_PHOTO);

          return (
            <div 
              key={p.id}
              className="bg-white border border-slate-200 hover:border-[#0B3C85] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                
                {/* Product Image & Badges */}
                <div className="relative w-full h-36 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                  <img 
                    src={imageSrc} 
                    alt={p.namaSparepart} 
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  
                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-md text-white font-mono font-black text-[9px] uppercase tracking-wider">
                      {p.brand || 'GENUINE'}
                    </span>
                    {p.turnoverStatus === 'FAST_MOVING' && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-white font-black text-[9px] flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" /> FAST
                      </span>
                    )}
                  </div>

                  {/* Stock Badge */}
                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[#0B3C85] border border-blue-200 font-mono font-black text-[10px]">
                      Stok: {p.stokRealtime} {p.satuan}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <span className="font-mono font-black text-xs text-[#0B3C85] block truncate">
                    {p.kodeItem}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5 min-h-[32px] leading-snug">
                    {p.namaSparepart}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    Lokasi: {p.lokasiRak || '-'}
                  </p>
                </div>

                {/* Price & Potential Matrix Box */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Harga Pasar / Shopee:</span>
                    <span className="font-mono font-black text-slate-900">
                      {effectiveSellPrice > 0 ? formatIdr(effectiveSellPrice) : '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Potential Sales:</span>
                    <span className="font-mono font-black text-[#0B3C85]">
                      {formatIdr(itemPotentialSales)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 text-slate-600 font-medium">
                    <span>Proyeksi Margin:</span>
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      +{marginPercent.toFixed(0)}% ({formatIdr(unitProfit)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button -> Open Investor Pricing & Matrix Modal */}
              <div className="mt-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenInvestorModal(p)}
                  className="w-full py-2 px-3 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-[11px] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer group-hover:bg-[#0B3C85]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                  Lihat Valuasi & Skema Investor
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚀 Bottom Banner CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3C85] text-white flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-black text-xs sm:text-sm text-slate-900">
              Ingin Meninjau Seluruh Portofolio Sparepart Lengkap?
            </h5>
            <p className="text-[11px] text-slate-600">
              Total {parts.length} SKU suku cadang terdata dengan rincian dimensi fisik, rak gudang, dan harga multi-channel.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('catalog')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
        >
          Buka Master Katalog Lengkap <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
