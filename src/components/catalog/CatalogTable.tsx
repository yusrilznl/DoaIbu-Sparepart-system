import React, { useState, useRef } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { SparePart, TurnoverStatus } from '../../types/inventory';
import { isSuperAdminRole } from '../../types/auth';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownToLine, Eye, Edit2, Trash2, Tag, FileSpreadsheet, Upload, DollarSign, TrendingUp, Layers, Lock, Boxes, QrCode, Camera, MapPin, RefreshCw } from 'lucide-react';
import { ItemModal } from './ItemModal';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { LocationMutationModal } from './LocationMutationModal';
import { ImageZoomModal } from '../common/ImageZoomModal';

import { matchSparePartSearch, deduplicatePartsList, getSearchRelevanceScore } from '../../utils/searchUtils';

interface CatalogTableProps {
  onSelectForOutbound: (partId: string) => void;
  onSelectForInbound: (partId: string) => void;
}

export const CatalogTable: React.FC<CatalogTableProps> = ({
  onSelectForOutbound,
  onSelectForInbound
}) => {
  const { parts, addSparePart, updateSparePart, deleteSparePart, showToast, getGoodConditionReturnCount, exportFullBackup, importFullBackup, cleanDuplicateParts } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedRack, setSelectedRack] = useState<string>('ALL');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [inspectingPart, setInspectingPart] = useState<SparePart | null>(null);
  const [barcodePrintPart, setBarcodePrintPart] = useState<SparePart | null>(null);
  const [locationMutationPart, setLocationMutationPart] = useState<SparePart | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string; subTitle?: string } | null>(null);

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);
  const shouldSensorHpp = !isSuperAdminCategory || isFinancialPrivacyEnabled;

  // Extract unique brands & racks
  const uniqueBrands = Array.from(new Set(parts.map(p => p.brand)));
  const uniqueRacks = Array.from(new Set(parts.map(p => p.lokasiRak))).sort();

  // Financial Asset Calculations
  const totalAssetValuationHpp = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalOmsetPotensialJual = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaJual || 0)), 0);

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const deduplicatedParts = deduplicatePartsList(parts);
  const rawFilteredParts = deduplicatedParts.filter(part => {
    if (!part) return false;
    const matchesSearch = matchSparePartSearch(part, searchQuery);
    const matchesBrand = selectedBrand === 'ALL' || part.brand === selectedBrand;
    const matchesRack = selectedRack === 'ALL' || part.lokasiRak === selectedRack;

    return matchesSearch && matchesBrand && matchesRack;
  });

  // Sort search results by Relevance (Direct Kode Item / OEM matches appear at the VERY TOP)
  const filteredParts = searchQuery.trim()
    ? [...rawFilteredParts].sort((a, b) => getSearchRelevanceScore(b, searchQuery) - getSearchRelevanceScore(a, searchQuery))
    : rawFilteredParts;

  const handleDelete = (id: string, kode: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus sparepart "${kode}" dari database?`)) {
      deleteSparePart(id);
      showToast(`Sparepart ${kode} berhasil dihapus.`, 'info');
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (filteredParts.length === 0) {
      showToast('Tidak ada data untuk diexport!', 'error');
      return;
    }

    const headers = ['No', 'Kode Item', 'OEM Number', 'Nama Sparepart', 'Brand', 'Lokasi Rak', 'Satuan', 'HPP (Harga Beli)', 'Harga Offline', 'Harga Shopee', 'Harga Tokopedia', 'Stok Realtime', 'Stok Min'];
    const rows = filteredParts.map((p, index) => [
      index + 1,
      `"${p.kodeItem}"`,
      `"${p.oemNumber || ''}"`,
      `"${p.namaSparepart.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.lokasiRak}"`,
      `"${p.satuan}"`,
      shouldSensorHpp ? 'SENSORED' : p.hargaBeli || 0,
      p.hargaJual || 0,
      p.hargaShopee || 0,
      p.hargaTokopedia || 0,
      p.stokRealtime,
      p.stokMin
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Master_Sparepart_DoaIbu_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast(`Data Master Sparepart (${filteredParts.length} item) berhasil diunduh!`, 'success');
  };

  // CSV Import Handler for Bulk Creating & Updating Spareparts
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      if (lines.length < 2) {
        showToast('File CSV kosong atau format tidak valid!', 'error');
        return;
      }

      let updatedCount = 0;
      let addedCount = 0;

      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        
        // Parse CSV values handling commas inside quotes
        const rawCols = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
        if (rawCols.length >= 4) {
          const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';
          
          const kodeItem = clean(rawCols[1]) || clean(rawCols[0]);
          if (!kodeItem || kodeItem.toLowerCase() === 'no' || kodeItem.toLowerCase() === 'kode item') return;

          const oemNumber = clean(rawCols[2]) || '';
          const namaSparepart = clean(rawCols[3]) || kodeItem;
          const brand = clean(rawCols[4]) || 'FLEETGUARD';
          const lokasiRak = clean(rawCols[5]) || 'A-01-01';
          const satuan = clean(rawCols[6]) || 'PCS';
          const hargaBeli = parseFloat(clean(rawCols[7])) || 0;
          const hargaJual = parseFloat(clean(rawCols[8])) || 0;
          const hargaShopee = parseFloat(clean(rawCols[9])) || 0;
          const hargaTokopedia = parseFloat(clean(rawCols[10])) || 0;
          const stokRealtime = parseInt(clean(rawCols[11])) || 0;
          const stokMin = parseInt(clean(rawCols[12])) || 5;

          const matchedPart = parts.find(p => p.kodeItem.toLowerCase() === kodeItem.toLowerCase());
          if (matchedPart) {
            updateSparePart(matchedPart.id, {
              oemNumber: oemNumber || matchedPart.oemNumber,
              namaSparepart: namaSparepart || matchedPart.namaSparepart,
              brand: brand || matchedPart.brand,
              lokasiRak: lokasiRak || matchedPart.lokasiRak,
              satuan: satuan || matchedPart.satuan,
              hargaBeli: hargaBeli > 0 ? hargaBeli : matchedPart.hargaBeli,
              hargaJual: hargaJual > 0 ? hargaJual : matchedPart.hargaJual,
              hargaShopee: hargaShopee > 0 ? hargaShopee : matchedPart.hargaShopee,
              hargaTokopedia: hargaTokopedia > 0 ? hargaTokopedia : matchedPart.hargaTokopedia,
              stokRealtime: stokRealtime > 0 ? stokRealtime : matchedPart.stokRealtime,
              stokMin: stokMin > 0 ? stokMin : matchedPart.stokMin,
            });
            updatedCount++;
          } else {
            // Create New Sparepart automatically if not present!
            addSparePart({
              kodeItem,
              oemNumber,
              namaSparepart,
              brand,
              lokasiRak,
              satuan,
              hargaBeli,
              hargaJual,
              hargaShopee,
              hargaTokopedia,
              stokRealtime,
              stokMin,
              terakhirDiupdate: new Date().toISOString()
            });
            addedCount++;
          }
        }
      });

      if (addedCount > 0 || updatedCount > 0) {
        showToast(`⚡ Sukses mengimpor data! ${addedCount} Sparepart Baru ditambahkan, ${updatedCount} diperbarui!`, 'success');
      } else {
        showToast('Format CSV tidak sesuai. Pastikan file di-export dari menu Export Excel.', 'info');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCsv}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Top Header & Quick Create */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#0B3C85]" /> Master Katalog Sparepart & Rak Bin
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manajemen stok fisik, lokasi rak, & multi-harga
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
            title="Pindai Barcode / Part Number dengan Kamera"
          >
            <Camera className="w-4 h-4 text-emerald-400" /> Pindai Barcode Kamera
          </button>

          <button
            onClick={cleanDuplicateParts}
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
            title="Bersihkan seluruh data duplikat di browser & database Supabase dengan 1-klik"
          >
            <RefreshCw className="w-4 h-4 text-amber-200" /> 🧹 Clean Duplikat
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
            title="Unduh seluruh data sparepart ke file Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Excel
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
            title="Upload file Excel / CSV untuk menambahkan/meng-update ribuan sparepart sekaligus"
          >
            <Upload className="w-4 h-4 text-teal-200" /> 📥 Import Excel / CSV
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleImportCsv}
          />

          <button
            onClick={() => {
              setEditingPart(null);
              setIsItemModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4 text-sky-300" /> + Tambah Sparepart Baru
          </button>
        </div>
      </div>

      {/* Financial Asset Summary Cards (Sensored for non-super-admins) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center font-bold">
            {shouldSensorHpp ? <Lock className="w-6 h-6 text-amber-600" /> : <DollarSign className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">INVENTORY VALUATION</p>
            {shouldSensorHpp ? (
              <p className="text-xl font-black text-amber-600 font-mono mt-0.5">Rp ••••••••• (Disensor)</p>
            ) : (
              <p className="text-2xl font-black text-slate-900 mt-0.5">{formatIdr(totalAssetValuationHpp)}</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Market Value</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{formatIdr(totalOmsetPotensialJual)}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kode item / nama barang / OEM / pabrikan / rak bin..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center transition"
              title="Bersihkan Pencarian"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">Semua Brand</option>
              {uniqueBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">
            <select
              value={selectedRack}
              onChange={e => setSelectedRack(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">Semua Rak Bin</option>
              {uniqueRacks.map(r => (
                <option key={r} value={r}>Rak {r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container: min-w-[1100px] and whitespace-nowrap cell formatting */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                <th className="py-3.5 px-4 min-w-[180px]">Foto & Kode Part</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Sparepart</th>
                <th className="py-3.5 px-4 min-w-[110px]">Brand</th>
                <th className="py-3.5 px-4 min-w-[110px]">Lokasi Rak</th>
                <th className="py-3.5 px-4 text-right min-w-[120px]">Unit Cost</th>
                <th className="py-3.5 px-4 text-right min-w-[120px]">Harga Toko</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Harga Shopee</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Harga Tokopedia/TikTok</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 font-semibold whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-bold text-slate-700">
                        {searchQuery ? `Tidak ditemukan sparepart dengan kata kunci "${searchQuery}"` : 'Belum ada data sparepart.'}
                      </p>
                      {searchQuery && (
                        <div className="flex items-center justify-center gap-3 mt-2">
                          <button
                            onClick={() => setSearchQuery('')}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition"
                          >
                            🔄 Reset Pencarian
                          </button>
                          <button
                            onClick={() => {
                              setEditingPart({
                                id: '',
                                kodeItem: searchQuery.toUpperCase().trim(),
                                namaSparepart: '',
                                brand: 'GENUINE',
                                oemNumber: '',
                                lokasiRak: 'A-01-01',
                                stokRealtime: 0,
                                stokMin: 2,
                                satuan: 'PCS',
                                hargaBeli: 0,
                                hargaJual: 0,
                                hargaShopee: 0,
                                hargaTokopedia: 0,
                                terakhirDiupdate: new Date().toISOString()
                              });
                              setIsItemModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-[#0B3C85] hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1"
                          >
                            + Tambah Sparepart "{searchQuery.toUpperCase()}" Baru
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => {
                  const isLowStock = part.stokRealtime <= part.stokMin;
// Tambahkan di dalam filteredParts.map(part => {
console.log("Data Part:", part);
                  return (
                    <tr key={part.id} className="hover:bg-slate-50 transition">
                      {/* Photo & Part Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                  {/* KODE BARU - PASTI MUNCIUL & TAHAN ERROR */}
{/* Kolom Foto Sparepart - Support Array gambar & string fotoProduk */}
{(() => {
  const p = part as any;
  const imgSrc = (Array.isArray(p.gambar) && p.gambar.length > 0) 
    ? p.gambar[0] 
    : (p.fotoProduk || p.foto || p.imageUrl || (typeof p.gambar === 'string' ? p.gambar : null));

  return (
    <div 
      onClick={() => {
        if (imgSrc) {
          setZoomedImage({
            src: imgSrc,
            title: part.namaSparepart,
            subTitle: `Part No: ${part.kodeItem} | Brand: ${part.brand} | Rak: ${part.lokasiRak}`
          });
        }
      }}
      className={`w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs ${
        imgSrc ? 'cursor-pointer hover:border-[#0B3C85] hover:scale-105 transition' : ''
      }`}
      title={imgSrc ? 'Klik untuk memperbesar foto produk' : 'Default Foto'}
    >
      {imgSrc ? (
        <img 
          src={imgSrc} 
          alt={part.namaSparepart} 
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <Layers className="w-5 h-5 text-slate-400" />
      )}
    </div>
  );
})()}
                          <div>
                            <span className="font-mono font-black text-black text-sm block leading-none">{part.kodeItem}</span>
                            {part.oemNumber && (
                              <span className="text-[10px] text-slate-500 font-mono block mt-1">OEM: {part.oemNumber}</span>
                            )}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 font-mono font-black px-2 py-0.5 rounded-md text-[10px] border shadow-2xs ${
                                isLowStock
                                  ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                📦 Stok: {part.stokRealtime} {part.satuan}
                              </span>
                              {getGoodConditionReturnCount(part.id) > 0 && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded block mt-0.5" title="Total stok fisik hasil retur utuh yang sudah dimasukkan kembali ke rak">
                                  🔄 Retur Utuh: {getGoodConditionReturnCount(part.id)} Pcs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 truncate max-w-xs">
                        {part.namaSparepart}
                      </td>

                      {/* Brand */}
                      <td className="py-3.5 px-4 font-bold text-[#0B3C85] whitespace-nowrap">
                        {part.brand}
                      </td>

                      {/* Rack Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-red-600 bg-red-50 border border-red-200 text-[11px] whitespace-nowrap shadow-2xs">
                          {part.lokasiRak}
                        </span>
                      </td>

                      {/* HPP / Modal (Sensored for Non-Super-Admins or Privacy Mode) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap min-w-[120px]">
                        {shouldSensorHpp ? (
                          <span className="text-amber-700 font-black tracking-widest text-[11px]" title="HPP Modal disensor untuk kerahasiaan staf gudang">
                            Rp •••••••
                          </span>
                        ) : (
                          <span className="text-slate-900">{formatIdr(part.hargaBeli || 0)}</span>
                        )}
                      </td>

                      {/* Harga Toko Offline */}
                      <td className="py-3.5 px-4 text-right font-mono font-black whitespace-nowrap min-w-[120px]">
                        <span className="text-emerald-700">{formatIdr(part.hargaJual || 0)}</span>
                      </td>

                      {/* Harga Shopee */}
                      <td className="py-3.5 px-4 text-center font-mono font-black whitespace-nowrap min-w-[130px]">
                        <span className="text-orange-600">
                          {formatIdr(part.hargaShopee || (part.hargaJual ? Math.round(part.hargaJual * 1.085) : 0))}
                        </span>
                      </td>

                      {/* Harga Tokopedia / TikTok */}
                      <td className="py-3.5 px-4 text-center font-mono font-black whitespace-nowrap min-w-[140px]">
                        <span className="text-emerald-800">
                          {formatIdr(part.hargaTokopedia || (part.hargaJual ? Math.round(part.hargaJual * 1.08) : 0))}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setBarcodePrintPart(part)}
                            className="p-1.5 rounded-lg bg-blue-50 text-[#0B3C85] border border-blue-200 hover:bg-[#0B3C85] hover:text-white transition shadow-2xs"
                            title="Cetak Stiker Barcode Fisik"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setInspectingPart(part)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="Lihat Detail & Riwayat Item"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingPart(part);
                              setIsItemModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                            title="Edit Data Sparepart"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setLocationMutationPart(part)}
                            className="p-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
                            title="Catat Mutasi Lokasi Rak"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(part.id, part.kodeItem)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Modal Create/Edit */}
      {isItemModalOpen && (
        <ItemModal
          initialPart={editingPart}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingPart(null);
          }}
        />
      )}

      {/* Detail & History Drawer */}
      {inspectingPart && (
        <ItemDetailDrawer
          part={inspectingPart}
          onClose={() => setInspectingPart(null)}
          onSelectForOutbound={onSelectForOutbound}
          onSelectForInbound={onSelectForInbound}
        />
      )}

      {/* Barcode Sticker Modal */}
      {barcodePrintPart && (
        <BarcodeLabelModal
          part={barcodePrintPart}
          onClose={() => setBarcodePrintPart(null)}
        />
      )}

      {/* Mutasi Lokasi Rak Modal (Pilar 3: Traceability) */}
      {locationMutationPart && (
        <LocationMutationModal
          isOpen={!!locationMutationPart}
          onClose={() => setLocationMutationPart(null)}
          preselectedPart={locationMutationPart}
        />
      )}

      {/* Barcode Scanner Camera Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code: string) => {
          setSearchQuery(code);
        }}
        onUnrecognizedCode={(unrecognizedCode: string) => {
          setEditingPart({
            id: '',
            kodeItem: unrecognizedCode,
            namaSparepart: '',
            brand: 'GENUINE',
            oemNumber: '',
            lokasiRak: 'RAK-A1',
            stokRealtime: 0,
            stokMin: 2,
            satuan: 'Pcs',
            hargaBeli: 0,
            hargaJual: 0,
            hargaShopee: 0,
            hargaTokopedia: 0,
            terakhirDiupdate: new Date().toISOString()
          });
          setIsItemModalOpen(true);
        }}
        title="📷 Pemindai Barcode Katalog & Smart OCR"
      />

      {/* Product Image Lightbox Zoom Modal */}
      {zoomedImage && (
        <ImageZoomModal
          src={zoomedImage.src}
          title={zoomedImage.title}
          subTitle={zoomedImage.subTitle}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </div>
  );
};
