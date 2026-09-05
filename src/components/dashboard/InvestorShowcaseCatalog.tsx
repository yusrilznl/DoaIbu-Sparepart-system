import React, { useState, useMemo } from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { 
  Flame, DollarSign, Search, 
  Layers, ShoppingBag, Eye, 
  CheckCircle2, ChevronRight, Star, X, ExternalLink
} from 'lucide-react';
import { DEFAULT_FILTER_PHOTO } from '../../mock/initialData';
import { DoaIbuLogo } from '../common/DoaIbuLogo';

interface InvestorShowcaseCatalogProps {
  onNavigate: (tab: string) => void;
}

export const InvestorShowcaseCatalog: React.FC<InvestorShowcaseCatalogProps> = ({ 
  onNavigate
}) => {
  const { parts } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('FAST_MOVING');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Format IDR with "Rp " + space + digits
  const formatIdr = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(val || 0));
    return `Rp ${formatted}`;
  };

  // Helper for effective selling price
  const getEffectiveSellingPrice = (p: SparePart) => {
    if (p.hargaShopee && p.hargaShopee > 0) return p.hargaShopee;
    if (p.hargaTokopedia && p.hargaTokopedia > 0) return p.hargaTokopedia;
    if (p.hargaJual && p.hargaJual > 0) return p.hargaJual;
    if (p.hargaBeli && p.hargaBeli > 0) return p.hargaBeli * 1.30;
    return 0;
  };

  // Filtered Showcase Products for Modal
  const filteredProducts = useMemo(() => {
    let list = [...parts];

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

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(p => 
        p.kodeItem.toLowerCase().includes(q) ||
        p.namaSparepart.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      list = parts.slice(0, 12);
    }

    return list;
  }, [parts, selectedCategory, searchFilter]);

  // Preview products for the "Look Ngintip" banner (top 4 items)
  const previewProducts = useMemo(() => {
    const highDemand = parts.filter(p => p.turnoverStatus === 'FAST_MOVING' || p.stokRealtime >= 10 || p.brand === 'FLEETGUARD');
    return (highDemand.length >= 4 ? highDemand : parts).slice(0, 4);
  }, [parts]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 🌟 1. BANNER KATALOG "LOOK NGINTIP" (Tinggi Pas Sesuai Request & Bersih) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-sm relative overflow-hidden">
        
        {/* Header Preview Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-sky-300 text-[10px] font-black uppercase tracking-wider">
                KOLEKSI PORTOFOLIO PRODUK
              </span>
            </div>
            <h3 className="font-black text-base sm:text-lg lg:text-xl text-white mt-1">
              Katalog Koleksi Sparepart
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Klik untuk membuka seluruh katalog visual dengan filter Fast-Moving & High Margin
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-[#0B3C85] hover:bg-blue-800 text-white font-black text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            Buka Katalog Interaktif <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
          </button>
        </div>

        {/* Look Ngintip Preview Cards (Tinggi dibuat proporsional "ngintip") */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-3.5">
          {previewProducts.map((p) => {
            const imageSrc = Array.isArray(p.gambar) && p.gambar.length > 0 
              ? p.gambar[0] 
              : (p.fotoProduk || DEFAULT_FILTER_PHOTO);

            return (
              <div
                key={p.id}
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-400/60 rounded-xl p-2.5 transition-all cursor-pointer flex flex-col justify-between group h-32 sm:h-36 overflow-hidden"
              >
                <div className="relative w-full h-full bg-slate-900/90 rounded-lg overflow-hidden flex items-center justify-center p-1.5 border border-slate-700/50">
                  <img 
                    src={imageSrc} 
                    alt={p.namaSparepart} 
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-white font-mono font-black text-[8px] uppercase">
                      {p.brand || 'GENUINE'}
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-sky-300 font-mono font-black text-[9px]">
                      {p.stokRealtime} {p.satuan}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Indicator Strip */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 hover:text-sky-300 transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Tersedia {parts.length} item siap supply di warehouse
          </span>
          <span className="font-black text-sky-400 flex items-center gap-0.5 text-xs">
            Klik untuk Lihat Katalog Lengkap <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 🚀 2. POP-UP MODAL KATALOG INTERAKTIF */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-white/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <DoaIbuLogo size="sm" showSubtitle={false} />
                <div className="border-l border-slate-200 pl-2.5 sm:pl-3 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0B3C85] text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                    Katalog Koleksi Sparepart
                  </span>
                  <h3 className="font-black text-sm sm:text-lg md:text-xl text-slate-900 mt-0.5 truncate leading-tight">
                    Koleksi Portofolio Produk
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Tutup Katalog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar inside Modal */}
            <div className="shrink-0 p-3 sm:px-6 sm:py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('FAST_MOVING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === 'FAST_MOVING'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${selectedCategory === 'FAST_MOVING' ? 'text-amber-400' : 'text-slate-400'}`} />
                  Fast Moving
                </button>

                <button
                  onClick={() => setSelectedCategory('HIGH_MARGIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === 'HIGH_MARGIN'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <DollarSign className={`w-3.5 h-3.5 ${selectedCategory === 'HIGH_MARGIN' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  High Margin
                </button>

                <button
                  onClick={() => setSelectedCategory('ENGINE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === 'ENGINE'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${selectedCategory === 'ENGINE' ? 'text-sky-400' : 'text-slate-400'}`} />
                  Filters & Engine
                </button>

                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Semua Koleksi
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[200px] sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari part number / nama..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C85] transition"
                />
              </div>
            </div>

            {/* Scrollable Product Grid */}
            <div className="overflow-y-auto p-3.5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((p) => {
                  const effectiveSellPrice = getEffectiveSellingPrice(p);
                  const hppPrice = p.hargaBeli || 0;
                  const unitProfit = Math.max(0, effectiveSellPrice - hppPrice);
                  const marginPercent = effectiveSellPrice > 0 ? ((unitProfit / effectiveSellPrice) * 100) : 0;
                  const itemPotentialSales = p.stokRealtime * effectiveSellPrice;

                  const imageSrc = Array.isArray(p.gambar) && p.gambar.length > 0 
                    ? p.gambar[0] 
                    : (p.fotoProduk || DEFAULT_FILTER_PHOTO);

                  return (
                    <div 
                      key={p.id}
                      className="bg-white border border-slate-200 hover:border-[#0B3C85] rounded-2xl p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2.5">
                        
                        {/* Image & Badges */}
                        <div className="relative w-full h-32 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                          <img 
                            src={imageSrc} 
                            alt={p.namaSparepart} 
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-md text-white font-mono font-black text-[9px] uppercase tracking-wider">
                              {p.brand || 'GENUINE'}
                            </span>
                            {p.turnoverStatus === 'FAST_MOVING' && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-white font-black text-[8px] flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" /> FAST
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-2 right-2">
                            <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[#0B3C85] border border-blue-200 font-mono font-black text-[9px]">
                              Stok: {p.stokRealtime} {p.satuan}
                            </span>
                          </div>
                        </div>

                        {/* Title Info */}
                        <div>
                          <span className="font-mono font-black text-xs text-[#0B3C85] block truncate">
                            {p.kodeItem}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5 min-h-[30px] leading-snug">
                            {p.namaSparepart}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            Lokasi: {p.lokasiRak || '-'}
                          </p>
                        </div>

                        {/* Price Details Box */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Harga Satuan:</span>
                            <span className="font-mono font-black text-slate-900">
                              {effectiveSellPrice > 0 ? formatIdr(effectiveSellPrice) : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Potential Sales:</span>
                            <span className="font-mono font-black text-[#0B3C85]">
                              {formatIdr(itemPotentialSales)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 text-slate-600 font-medium">
                            <span>Margin Potensial:</span>
                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              +{marginPercent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3.5 sm:p-5 border-t border-slate-200 bg-white">
              <span className="text-[11px] text-slate-400 font-medium">
                Menampilkan {filteredProducts.length} dari {parts.length} total produk sparepart
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs transition cursor-pointer text-center"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 3. BANNER CTA DI PALING BAWAH (Desain Putih Bersih Selaras Website) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-black text-xs sm:text-sm text-slate-900">
              Ingin Meninjau Seluruh Portofolio Sparepart Lengkap?
            </h5>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total {parts.length} SKU suku cadang terdata dengan rincian dimensi fisik, lokasi rak, dan harga multi-channel.
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
