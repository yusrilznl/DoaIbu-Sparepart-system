import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { ReturnRecord, ReturnCondition, SalesChannel, SparePart } from '../../types/inventory';
import { 
  RotateCcw, Search, Filter, Plus, CheckCircle2, AlertOctagon, 
  Wrench, Eye, Edit2, Check, X, FileSpreadsheet, MapPin, Building2
} from 'lucide-react';

export const ReturnManagementModule: React.FC = () => {
  const { parts, returns, addReturnRecord, updateReturnRecord, confirmReturnRecord, refurbishReturnItem, showToast } = useInventory();
  const { currentUser } = useAuth();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');

  // Modal States
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ReturnRecord | null>(null);
  const [editRecord, setEditRecord] = useState<ReturnRecord | null>(null);
  const [refurbishRecord, setRefurbishRecord] = useState<ReturnRecord | null>(null);

  // Form Input Return State
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [partSearch, setPartSearch] = useState('');
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);

  const [salesChannel, setSalesChannel] = useState<SalesChannel>('SHOPEE');
  const [noResiKirim, setNoResiKirim] = useState('');
  const [noResiRetur, setNoResiRetur] = useState('');
  const [alamatRetur, setAlasanRetur] = useState('');
  const [kondisiBarang, setKondisiBarang] = useState<ReturnCondition>('GOOD_CONDITION');
  const [qty, setQty] = useState<number>(1);
  const [catatan, setCatatan] = useState('');

  // Form Refurbish State
  const [biayaRefurbish, setBiayaRefurbish] = useState<number | ''>('');
  const [hargaJualRefurbished, setHargaJualRefurbished] = useState<number | ''>('');
  const [catatanRefurbish, setCatatanRefurbish] = useState('');

  // Filtered Parts for Combobox
  const filteredPartsForForm = parts.filter(p =>
    p.kodeItem.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.namaSparepart.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(partSearch.toLowerCase())
  );

  // Filtered Returns List
  const filteredReturns = returns.filter(r => {
    const matchesSearch =
      r.noRetur.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.noResiKirim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.noResiRetur.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.partNumber && r.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.alamatRetur && r.alamatRetur.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChannel = selectedChannel === 'ALL' || r.salesChannel === selectedChannel;
    const matchesCondition = selectedCondition === 'ALL' || r.kondisiBarang === selectedCondition;

    return matchesSearch && matchesChannel && matchesCondition;
  });

  // Reset Input Form
  const resetInputForm = () => {
    setSelectedPart(null);
    setPartSearch('');
    setNoResiKirim('');
    setNoResiRetur('');
    setAlasanRetur('');
    setKondisiBarang('GOOD_CONDITION');
    setQty(1);
    setCatatan('');
    setIsInputModalOpen(false);
  };

  // Submit New Return Record
  const handleSubmitNewReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) {
      showToast('Silakan pilih Part Number terlebih dahulu!', 'error');
      return;
    }
    if (!noResiKirim.trim() || !noResiRetur.trim()) {
      showToast('No. Resi Pengiriman dan No. Resi Return wajib diisi!', 'error');
      return;
    }

    const statusLokasiBarang = kondisiBarang === 'GOOD_CONDITION'
      ? `Rak Utama (${selectedPart.lokasiRak})`
      : 'Gudang Karantina (Afkir / Rusak)';

    addReturnRecord({
      partId: selectedPart.id,
      partNumber: selectedPart.kodeItem,
      brand: selectedPart.brand,
      lokasiRak: selectedPart.lokasiRak,
      satuan: selectedPart.satuan || 'PCS',
      qty: Number(qty) || 1,
      salesChannel,
      noResiKirim: noResiKirim.trim(),
      noResiRetur: noResiRetur.trim(),
      alamatRetur: alamatRetur.trim() || '-',
      kondisiBarang,
      statusLokasiBarang,
      catatan
    });

    resetInputForm();
  };

  // Submit Edit Return Record
  const handleSaveEditReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    const statusLokasiBarang = editRecord.kondisiBarang === 'GOOD_CONDITION'
      ? `Rak Utama (${editRecord.lokasiRak})`
      : 'Gudang Karantina (Afkir / Rusak)';

    updateReturnRecord(editRecord.id, {
      noResiKirim: editRecord.noResiKirim,
      noResiRetur: editRecord.noResiRetur,
      alamatRetur: editRecord.alamatRetur,
      kondisiBarang: editRecord.kondisiBarang,
      statusLokasiBarang,
      catatan: editRecord.catatan
    });

    setEditRecord(null);
  };

  // Submit Refurbish / Confirmation
  const handleSaveRefurbish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refurbishRecord) return;

    refurbishReturnItem(refurbishRecord.id, {
      biayaRefurbish: Number(biayaRefurbish) || 0,
      hargaJualRefurbished: Number(hargaJualRefurbished) || 0,
      catatanRefurbish: catatanRefurbish.trim(),
      restockToInventory: true
    });

    setRefurbishRecord(null);
    setBiayaRefurbish('');
    setHargaJualRefurbished('');
    setCatatanRefurbish('');
  };

  // Export CSV
  const handleExportCsv = () => {
    if (returns.length === 0) {
      showToast('Belum ada data return untuk diexport.', 'info');
      return;
    }

    const headers = [
      'No Return', 'Tanggal', 'Marketplace', 'Resi Kirim', 'Resi Return',
      'Part Number', 'Qty', 'Alamat Return', 'Kondisi Barang',
      'Status Lokasi Barang', 'Status Konfirmasi', 'Petugas'
    ];

    const rows = returns.map(r => [
      `"${r.noRetur}"`,
      `"${r.tanggal}"`,
      `"${r.salesChannel}"`,
      `"${r.noResiKirim}"`,
      `"${r.noResiRetur}"`,
      `"${r.partNumber}"`,
      r.qty,
      `"${(r.alamatRetur || '').replace(/"/g, '""')}"`,
      `"${r.kondisiBarang}"`,
      `"${r.statusLokasiBarang}"`,
      `"${r.status}"`,
      `"${r.petugas}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Return_Barang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Berhasil mengunduh Laporan Return Barang (.CSV)', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar & Filter Utama (Atas Halaman) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-[#0B3C85]" /> Return Barang (Penjualan Online)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pencatatan retur marketplace: No. Resi, Part Number, Alamat Retur, dan lokasi penyimpanan barang
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export CSV
          </button>
        </div>

        {/* Filter Pencarian & Marketplace */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari No. Resi / Part Number / Alamat Retur..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value)}
                className="bg-transparent font-extrabold text-slate-900 focus:outline-none"
              >
                <option value="ALL">Semua Marketplace</option>
                <option value="SHOPEE">🟠 Shopee</option>
                <option value="TOKOPEDIA">🟢 Tokopedia / TikTok</option>
                <option value="GROSIR_OTHER">📦 Lainnya</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
                className="bg-transparent font-extrabold text-slate-900 focus:outline-none"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="GOOD_CONDITION">Good Condition (Utuh)</option>
                <option value="DEFECT_RUSAK">Cacat / Rusak</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Di Atas Tabel: Tombol Input Return Baru */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900">Daftar Transaksi Return</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-mono font-bold text-xs">
            {filteredReturns.length} Item
          </span>
        </div>

        <button
          onClick={() => setIsInputModalOpen(true)}
          className="px-4 py-2.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
        >
          <Plus className="w-4 h-4 text-sky-300" /> + Input Return Baru
        </button>
      </div>

      {/* 3. Tabel Daftar Return */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                <th className="py-3.5 px-4 min-w-[130px]">Tanggal Return</th>
                <th className="py-3.5 px-4 min-w-[180px]">No Resi (Kirim & Return)</th>
                <th className="py-3.5 px-4 min-w-[120px]">Marketplace</th>
                <th className="py-3.5 px-4 min-w-[150px]">Part Number</th>
                <th className="py-3.5 px-4 text-center min-w-[70px]">Qty</th>
                <th className="py-3.5 px-4 min-w-[180px]">Alamat Return</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Kondisi Barang</th>
                <th className="py-3.5 px-4 min-w-[160px]">Status Lokasi Barang</th>
                <th className="py-3.5 px-4 text-center min-w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold whitespace-nowrap">
                    Belum ada data return yang dicatat. Klik "+ Input Return Baru" untuk menambah data.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => {
                  const isGood = r.kondisiBarang === 'GOOD_CONDITION';
                  const isConfirmed = r.status === 'TERKONFIRMASI' || r.status === 'REFURBISHED';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      {/* Tanggal Return */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {r.tanggal}
                      </td>

                      {/* No Resi (Pengiriman & Pengembalian) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-500 block">Kirim: <strong className="font-mono text-slate-900">{r.noResiKirim}</strong></span>
                        <span className="text-slate-500 block">Return: <strong className="font-mono font-bold text-blue-700">{r.noResiRetur}</strong></span>
                      </td>

                      {/* Marketplace */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                          r.salesChannel === 'SHOPEE' ? 'bg-orange-100 text-orange-900 border border-orange-200' :
                          r.salesChannel === 'TOKOPEDIA' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                          'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {r.salesChannel === 'SHOPEE' ? '🟠 Shopee' : r.salesChannel === 'TOKOPEDIA' ? '🟢 Tokopedia' : '📦 Marketplace'}
                        </span>
                      </td>

                      {/* Part Number */}
                      <td className="py-3.5 px-4 font-mono font-black text-black text-sm whitespace-nowrap">
                        {r.partNumber}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center font-mono font-black text-sm whitespace-nowrap">
                        {r.qty} {r.satuan}
                      </td>

                      {/* Alamat Return */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs max-w-xs">
                        {r.alamatRetur || '-'}
                      </td>

                      {/* Kondisi Barang */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isGood ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Good Condition
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-red-600" /> Cacat / Rusak
                          </span>
                        )}
                      </td>

                      {/* Status Lokasi Barang */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${
                          isGood ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          {r.statusLokasiBarang || (isGood ? `Rak Utama (${r.lokasiRak})` : 'Gudang Karantina')}
                        </span>
                      </td>

                      {/* Aksi: Detail, Edit, Konfirmasi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail */}
                          <button
                            onClick={() => setDetailRecord(r)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Lihat Rincian Detail Return"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditRecord(r)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                            title="Edit Data Return"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Konfirmasi / Refurbish */}
                          {isConfirmed ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-lg flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Terkonfirmasi
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (isGood) {
                                  confirmReturnRecord(r.id);
                                } else {
                                  setRefurbishRecord(r);
                                  setBiayaRefurbish('');
                                  setHargaJualRefurbished('');
                                  setCatatanRefurbish('');
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-[10px] flex items-center gap-1 transition shadow-2xs ${
                                isGood ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-700 hover:bg-violet-800'
                              }`}
                              title={isGood ? 'Konfirmasi status pengembalian utuh' : 'Perbaiki & pulihkan stok (Refurbished)'}
                            >
                              {isGood ? <Check className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                              {isGood ? 'Konfirmasi' : 'Refurbish'}
                            </button>
                          )}
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

      {/* Modal 1: Input Return Baru */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#0B3C85]" /> Formulir Input Return Baru
                </h3>
                <p className="text-xs text-slate-500">Pencatatan barang return dari marketplace online</p>
              </div>
              <button onClick={resetInputForm} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewReturn} className="space-y-3 text-xs font-semibold">
              {/* Marketplace */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Marketplace / Channel *</label>
                <select
                  value={salesChannel}
                  onChange={e => setSalesChannel(e.target.value as SalesChannel)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  <option value="SHOPEE">🟠 Shopee</option>
                  <option value="TOKOPEDIA">🟢 Tokopedia / TikTok Shop</option>
                  <option value="GROSIR_OTHER">📦 Marketplace Lainnya</option>
                </select>
              </div>

              {/* No Resi Kirim & Retur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">No. Resi Pengiriman Awal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SPX12345678"
                    value={noResiKirim}
                    onChange={e => setNoResiKirim(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">No. Resi Return (Pengembalian) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RET-99887766"
                    value={noResiRetur}
                    onChange={e => setNoResiRetur(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Part Number Combobox */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Part Number *</label>
                {selectedPart ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-300 rounded-xl">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-sm block">{selectedPart.kodeItem}</span>
                      <span className="text-[10px] text-slate-500 block">{selectedPart.namaSparepart} — Rak {selectedPart.lokasiRak}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPart(null); setPartSearch(''); }}
                      className="text-xs font-extrabold text-red-600 hover:underline"
                    >
                      Ganti Part
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik Part Number atau nama sparepart..."
                      value={partSearch}
                      onChange={e => { setPartSearch(e.target.value); setIsPartDropdownOpen(true); }}
                      onFocus={() => setIsPartDropdownOpen(true)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-black focus:outline-none"
                    />

                    {isPartDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-44 overflow-y-auto divide-y">
                        {filteredPartsForForm.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPart(p);
                              setIsPartDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition"
                          >
                            <div>
                              <span className="font-mono font-black text-slate-900 block">{p.kodeItem}</span>
                              <span className="text-[10px] text-slate-500">{p.namaSparepart} (Rak {p.lokasiRak})</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-700">{p.stokRealtime} {p.satuan}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity (Qty) */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Quantity (Qty) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:outline-none"
                />
              </div>

              {/* Alamat Return */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Alamat Return (Pengirim) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Jl. Magelang No. 45, RT 02/05, Semarang Jawa Tengah..."
                  value={alamatRetur}
                  onChange={e => setAlasanRetur(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black focus:outline-none"
                />
              </div>

              {/* Kondisi Barang */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Kondisi Barang *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKondisiBarang('GOOD_CONDITION')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                      kondisiBarang === 'GOOD_CONDITION'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Good Condition (Utuh)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKondisiBarang('DEFECT_RUSAK')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                      kondisiBarang === 'DEFECT_RUSAK'
                        ? 'bg-red-50 border-red-500 text-red-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Cacat / Rusak</span>
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={resetInputForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold rounded-xl shadow transition">
                  Simpan Return Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Detail Return */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Detail Transaksi Return #{detailRecord.noRetur}</h3>
              <button onClick={() => setDetailRecord(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-mono font-black text-slate-900 block text-sm">Part #: {detailRecord.partNumber}</span>
                <span className="text-slate-600 block">Marketplace: <strong>{detailRecord.salesChannel}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">Resi Kirim</span>
                  <span className="font-mono font-bold text-slate-800">{detailRecord.noResiKirim}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">Resi Return</span>
                  <span className="font-mono font-bold text-blue-700">{detailRecord.noResiRetur}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500 block">Qty Return: <strong>{detailRecord.qty} {detailRecord.satuan}</strong></span>
                <span className="text-slate-500 block">Alamat Return: <strong>{detailRecord.alamatRetur}</strong></span>
                <span className="text-slate-500 block">Kondisi Fisik: <strong className={detailRecord.kondisiBarang === 'GOOD_CONDITION' ? 'text-emerald-700' : 'text-red-700'}>{detailRecord.kondisiBarang}</strong></span>
                <span className="text-slate-500 block">Lokasi Penyimpanan: <strong>{detailRecord.statusLokasiBarang}</strong></span>
                <span className="text-slate-500 block">Petugas: <strong>{detailRecord.petugas}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setDetailRecord(null)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Return */}
      {editRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Data Return #{editRecord.noRetur}</h3>
              <button onClick={() => setEditRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReturn} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">No. Resi Kirim</label>
                  <input
                    type="text"
                    value={editRecord.noResiKirim}
                    onChange={e => setEditRecord({ ...editRecord, noResiKirim: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">No. Resi Return</label>
                  <input
                    type="text"
                    value={editRecord.noResiRetur}
                    onChange={e => setEditRecord({ ...editRecord, noResiRetur: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Alamat Return</label>
                <textarea
                  rows={2}
                  value={editRecord.alamatRetur}
                  onChange={e => setEditRecord({ ...editRecord, alamatRetur: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Kondisi Barang</label>
                <select
                  value={editRecord.kondisiBarang}
                  onChange={e => setEditRecord({ ...editRecord, kondisiBarang: e.target.value as ReturnCondition })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  <option value="GOOD_CONDITION">Good Condition (Utuh)</option>
                  <option value="DEFECT_RUSAK">Cacat / Rusak</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditRecord(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-[#0B3C85] text-white font-extrabold rounded-xl shadow transition">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Refurbish / Konfirmasi */}
      {refurbishRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-violet-700" /> Refurbish / Perbaikan Barang Cacat
              </h3>
              <button onClick={() => setRefurbishRecord(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-violet-50 border border-violet-200 rounded-2xl text-xs space-y-1">
              <span className="font-mono font-black text-violet-900 text-sm block">Part #: {refurbishRecord.partNumber}</span>
              <span className="text-[11px] font-mono text-slate-600 block">Resi Return: {refurbishRecord.noResiRetur} | Alamat: {refurbishRecord.alamatRetur}</span>
            </div>

            <form onSubmit={handleSaveRefurbish} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Catatan Perbaikan *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Deskripsi pekerjaan perbaikan..."
                  value={catatanRefurbish}
                  onChange={e => setCatatanRefurbish(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setRefurbishRecord(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-violet-700 text-white font-extrabold rounded-xl shadow transition">
                  Simpan & Pulihkan Ke Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
