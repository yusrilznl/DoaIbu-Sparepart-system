import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { SparePart, TurnoverStatus } from '../../types/inventory';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownToLine, Eye, Edit2, Trash2, Tag, FileSpreadsheet, DollarSign, TrendingUp, Layers, Lock, Boxes, QrCode, Camera, MapPin } from 'lucide-react';
import { ItemModal } from './ItemModal';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { LocationMutationModal } from './LocationMutationModal';

interface CatalogTableProps {
  onSelectForOutbound: (partId: string) => void;
  onSelectForInbound: (partId: string) => void;
}

export const CatalogTable: React.FC<CatalogTableProps> = ({
  onSelectForOutbound,
  onSelectForInbound
}) => {
  const { parts, deleteSparePart, showToast } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();

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

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const shouldSensorFinancialData = !isSuperAdmin || isFinancialPrivacyEnabled;

  // Extract unique brands & racks
  const uniqueBrands = Array.from(new Set(parts.map(p => p.brand)));
  const uniqueRacks = Array.from(new Set(parts.map(p => p.lokasiRak))).sort();

  // Financial Asset Calculations
  const totalAssetValuationHpp = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaBeli || 0)), 0);
  const totalOmsetPotensialJual = parts.reduce((acc, p) => acc + (p.stokRealtime * (p.hargaJual || 0)), 0);

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch =
      part.kodeItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.namaSparepart.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (part.oemNumber && part.oemNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      part.lokasiRak.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBrand = selectedBrand === 'ALL' || part.brand === selectedBrand;
    const matchesRack = selectedRack === 'ALL' || part.lokasiRak === selectedRack;

    return matchesSearch && matchesBrand && matchesRack;
  });

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
      shouldSensorFinancialData ? 'SENSORD' : p.hargaBeli || 0,
      shouldSensorFinancialData ? 'SENSORD' : p.hargaJual || 0,
      shouldSensorFinancialData ? 'SENSORD' : p.hargaShopee || 0,
      shouldSensorFinancialData ? 'SENSORD' : p.hargaTokopedia || 0,
      p.stokRealtime,
      p.stokMin
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Sparepart_DoaIbu_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Data Master Sparepart (${filteredParts.length} item) berhasil diexport ke CSV!`, 'success');
  };

  return (
    <div className="space-y-6">
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
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Excel / CSV
          </button>
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
            {shouldSensorFinancialData ? <Lock className="w-6 h-6 text-amber-600" /> : <DollarSign className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Nilai Aset Stok (HPP)</p>
            {shouldSensorFinancialData ? (
              <p className="text-xl font-black text-amber-600 font-mono mt-0.5">Rp ••••••••• (Disensor)</p>
            ) : (
              <p className="text-2xl font-black text-slate-900 mt-0.5">{formatIdr(totalAssetValuationHpp)}</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            {shouldSensorFinancialData ? <Lock className="w-6 h-6 text-amber-600" /> : <TrendingUp className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Potensi Omset Gudang (Harga Toko)</p>
            {shouldSensorFinancialData ? (
              <p className="text-xl font-black text-amber-600 font-mono mt-0.5">Rp ••••••••• (Disensor)</p>
            ) : (
              <p className="text-2xl font-black text-emerald-700 mt-0.5">{formatIdr(totalOmsetPotensialJual)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kode item / nama barang / OEM / rak bin..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
          />
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
                <th className="py-3.5 px-4 text-right min-w-[120px]">HPP (Modal)</th>
                <th className="py-3.5 px-4 text-right min-w-[120px]">Harga Toko</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Harga Shopee</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Harga Tokopedia/TikTok</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">Stok Realtime</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold whitespace-nowrap">
                    Tidak ada sparepart yang sesuai dengan filter pencarian.
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
<div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
  {(() => {
    // Ambil URL gambar dari array gambar[0] atau string fotoProduk/foto/imageUrl
    const p = part as any;
    const imgSrc = (Array.isArray(p.gambar) && p.gambar.length > 0) 
      ? p.gambar[0] 
      : (p.fotoProduk || p.foto || p.imageUrl || (typeof p.gambar === 'string' ? p.gambar : null));

    if (imgSrc) {
      return (
        <img 
          src={imgSrc} 
          alt={part.namaSparepart} 
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }

    return <Layers className="w-5 h-5 text-slate-400" />;
  })()}
</div>
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

                      {/* HPP / Modal (Sensored for Non-Super-Admins) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap min-w-[120px]">
                        {shouldSensorFinancialData ? (
                          <span className="text-amber-700 font-black tracking-widest text-[11px]" title="HPP disensor untuk kerahasiaan staf">
                            Rp •••••••
                          </span>
                        ) : (
                          <span className="text-slate-900">{formatIdr(part.hargaBeli || 0)}</span>
                        )}
                      </td>

                      {/* Harga Toko Offline */}
                      <td className="py-3.5 px-4 text-right font-mono font-black whitespace-nowrap min-w-[120px]">
                        {shouldSensorFinancialData ? (
                          <span className="text-amber-700 font-black tracking-widest text-[11px]">Rp •••••••</span>
                        ) : (
                          <span className="text-emerald-700">{formatIdr(part.hargaJual || 0)}</span>
                        )}
                      </td>

                      {/* Harga Shopee */}
                      <td className="py-3.5 px-4 text-center font-mono font-black whitespace-nowrap min-w-[130px]">
                        {shouldSensorFinancialData ? (
                          <span className="text-amber-700 font-black tracking-widest text-[11px]">Rp •••••••</span>
                        ) : (
                          <span className="text-orange-600">{formatIdr(part.hargaShopee || part.hargaJual * 1.085)}</span>
                        )}
                      </td>

                      {/* Harga Tokopedia / TikTok */}
                      <td className="py-3.5 px-4 text-center font-mono font-black whitespace-nowrap min-w-[140px]">
                        {shouldSensorFinancialData ? (
                          <span className="text-amber-700 font-black tracking-widest text-[11px]">Rp •••••••</span>
                        ) : (
                          <span className="text-emerald-800">{formatIdr(part.hargaTokopedia || part.hargaJual * 1.08)}</span>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">
                        <span className={`inline-flex items-center justify-center font-mono font-black px-3 py-1 rounded-full text-xs border ${
                          isLowStock
                            ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                            : 'bg-slate-100 text-slate-900 border-slate-300'
                        }`}>
                          {part.stokRealtime} {part.satuan}
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
    </div>
  );
};
