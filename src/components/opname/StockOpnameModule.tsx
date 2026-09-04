import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { SparePart } from '../../types/inventory';
import { ClipboardCheck, Search, Filter, Camera, Save, RefreshCw, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { matchSparePartSearch } from '../../utils/searchUtils';

interface OpnameEntry {
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  lokasiRak: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  catatan: string;
}

export const StockOpnameModule: React.FC = () => {
  const { parts, recordStockOpname, showToast } = useInventory();

  const [selectedRak, setSelectedRak] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Initialize opname state from current inventory parts
  const [opnameData, setOpnameData] = useState<OpnameEntry[]>(() =>
    parts.map(p => ({
      partId: p.id,
      kodeItem: p.kodeItem,
      namaSparepart: p.namaSparepart,
      lokasiRak: p.lokasiRak,
      stokSistem: p.stokRealtime,
      stokFisik: p.stokRealtime,
      selisih: 0,
      catatan: ''
    }))
  );

  const uniqueRacks = Array.from(new Set(parts.map(p => p.lokasiRak))).sort();

  const handleStokFisikChange = (partId: string, value: number) => {
    setOpnameData(prev =>
      prev.map(item => {
        if (item.partId === partId) {
          const validVal = Math.max(0, value);
          const diff = validVal - item.stokSistem;
          return {
            ...item,
            stokFisik: validVal,
            selisih: diff
          };
        }
        return item;
      })
    );
  };

  const handleCatatanChange = (partId: string, catatan: string) => {
    setOpnameData(prev =>
      prev.map(item => item.partId === partId ? { ...item, catatan } : item)
    );
  };

  // Barcode Continuous Scan Callback for Stock Opname
  const handleOpnameScanSuccess = (scannedCode: string) => {
    const matched = opnameData.find(o => o.kodeItem.toLowerCase() === scannedCode.toLowerCase());
    if (matched) {
      handleStokFisikChange(matched.partId, matched.stokFisik + 1);
      showToast(`⚡ Opname Scan: ${matched.kodeItem} (${matched.namaSparepart}) Stok Fisik +1`, 'success');
    } else {
      showToast(`⚠️ Barcode "${scannedCode}" tidak ada di daftar opname rak!`, 'error');
    }
  };

  const handleSaveOpname = () => {
    const adjustedItems = opnameData.filter(i => i.selisih !== 0);

    const now = new Date();
    const refNo = `SO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    recordStockOpname(
      opnameData.map(i => {
        const p = parts.find(part => part.id === i.partId);
        return {
          id: 'opi-' + Date.now() + '-' + i.partId,
          partId: i.partId,
          kodeItem: i.kodeItem,
          namaSparepart: i.namaSparepart,
          brand: p?.brand || 'GENUINE',
          lokasiRak: i.lokasiRak,
          stokSistem: i.stokSistem,
          stokFisik: i.stokFisik,
          selisih: i.selisih,
          catatan: i.catatan,
          hargaBeli: p?.hargaBeli || 0,
          hargaJual: p?.hargaJual || 0,
        };
      }),
      refNo,
      'Opname Rekonsiliasi Rak Bin'
    );

    if (adjustedItems.length > 0) {
      showToast(`Hasil Stock Opname disimpan! Terdeteksi selisih pada ${adjustedItems.length} item.`, 'info');
    } else {
      showToast('Hasil Stock Opname disimpan! Seluruh stok fisik sesuai dengan sistem (0 Selisih).', 'success');
    }
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    if (opnameData.length === 0) {
      showToast('Tidak ada data opname untuk diexport!', 'error');
      return;
    }

    const headers = ['No', 'Kode Item', 'Nama Sparepart', 'Lokasi Rak', 'Stok Sistem', 'Stok Fisik', 'Selisih', 'Status Audit', 'Catatan'];
    const rows = filteredOpname.map((item, index) => [
      index + 1,
      `"${item.kodeItem}"`,
      `"${item.namaSparepart.replace(/"/g, '""')}"`,
      `"${item.lokasiRak}"`,
      item.stokSistem,
      item.stokFisik,
      item.selisih,
      item.selisih === 0 ? '"SELESAI_SESUAI"' : item.selisih < 0 ? '"SELISIH_KURANG"' : '"SELISIH_LEBIH"',
      `"${item.catatan.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Opname_DoaIbu_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Data Stock Opname (${filteredOpname.length} item) berhasil diexport ke CSV!`, 'success');
  };

  const filteredOpname = opnameData.filter(item => {
    const p = parts.find(part => part.id === item.partId);
    const matchesSearch = p ? matchSparePartSearch(p, searchQuery) : (
      item.kodeItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaSparepart.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lokasiRak.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesRak = selectedRak === 'ALL' || item.lokasiRak === selectedRak;

    return matchesSearch && matchesRak;
  });

  const totalDiscrepancyCount = opnameData.filter(i => i.selisih !== 0).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#0B3C85]" /> Stock Opname & Pemindai Barcode Rak
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Verifikasi hitung stok fisik rak & rekonsiliasi sistem
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Excel / CSV
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow transition"
          >
            <Camera className="w-4 h-4 text-emerald-200 animate-pulse" /> 📷 Scan Kamera Dus Rak
          </button>
        </div>
      </div>

      {/* Audit Discrepancy Alert Banner */}
      {totalDiscrepancyCount > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-l-amber-600 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-black text-amber-900 text-xs">Peringatan Audit Stock Opname</h4>
              <p className="text-xs text-amber-800 font-medium">
                Terdeteksi selisih stok fisik pada <strong>{totalDiscrepancyCount} item sparepart</strong>. Periksa ulang sebelum menyimpan hasil opname.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kode part / nama barang / rak bin..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRak}
              onChange={e => setSelectedRak(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none"
            >
              <option value="ALL">Semua Rak Bin ({uniqueRacks.length})</option>
              {uniqueRacks.map(r => (
                <option key={r} value={r}>Rak {r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Opname Table with min-w-[1000px] and whitespace-nowrap formatting */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Kode Item</th>
                <th className="py-3.5 px-4">Nama Sparepart</th>
                <th className="py-3.5 px-4 min-w-[120px]">Lokasi Rak</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">Stok Sistem</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Hasil Stok Fisik</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">Selisih</th>
                <th className="py-3.5 px-4">Catatan Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
              {filteredOpname.map((item, index) => {
                const hasDiscrepancy = item.selisih !== 0;

                return (
                  <tr
                    key={item.partId}
                    className={`transition ${
                      hasDiscrepancy ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-slate-400 font-bold whitespace-nowrap">{index + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-black whitespace-nowrap">{item.kodeItem}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 truncate max-w-xs">{item.namaSparepart}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-red-600 bg-red-50 border border-red-200 text-[11px] whitespace-nowrap">
                        {item.lokasiRak}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.stokSistem} Pcs
                    </td>

                    {/* Physical Stock Input */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={item.stokFisik}
                        onChange={e => handleStokFisikChange(item.partId, Number(e.target.value))}
                        className={`w-24 px-2 py-1 text-center font-mono font-black border rounded-lg focus:outline-none ${
                          hasDiscrepancy
                            ? 'bg-amber-100 text-amber-900 border-amber-400 focus:border-amber-600'
                            : 'bg-white text-black border-slate-300 focus:border-[#0B3C85]'
                        }`}
                      />
                    </td>

                    {/* Discrepancy Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.selisih === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sesuai
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-0.5 rounded-md border ${
                          item.selisih < 0
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {item.selisih > 0 ? `+${item.selisih}` : item.selisih} Pcs
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        placeholder="Catatan selisih (opsional)..."
                        value={item.catatan}
                        onChange={e => handleCatatanChange(item.partId, e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:border-[#0B3C85] focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSaveOpname}
            className="px-6 py-3 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4 text-sky-300" /> Simpan & Otorisasi Rekonsiliasi Stock Opname
          </button>
        </div>
      </div>

      {/* Camera Barcode Scanner Modal for Opname */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleOpnameScanSuccess}
        onUnrecognizedCode={(code) => {
          showToast(`⚠️ Barcode "${code}" tidak ditemukan di rak ini atau katalog master!`, 'error');
        }}
        title="📷 Pemindai Barcode Stock Opname Rak (Hits Physical Count)"
      />
    </div>
  );
};
