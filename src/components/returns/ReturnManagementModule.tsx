import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { ReturnRecord, ReturnCondition, SalesChannel, SparePart } from '../../types/inventory';
import { isSuperAdminRole } from '../../types/auth';
import { 
  RotateCcw, Search, Filter, Plus, CheckCircle2, AlertOctagon, 
  DollarSign, Package, Truck, Wrench, ShieldCheck, Tag, ArrowUpRight, 
  FileSpreadsheet, Lock, RefreshCw, X
} from 'lucide-react';

export const ReturnManagementModule: React.FC = () => {
  const { parts, returns, addReturnRecord, refurbishReturnItem, showToast } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();
  const isSuperAdmin = isSuperAdminRole(currentUser?.role);
  const shouldSensorHpp = !isSuperAdmin || isFinancialPrivacyEnabled;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');

  // Modal New Return Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [partSearch, setPartSearch] = useState('');
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);

  const [salesChannel, setSalesChannel] = useState<SalesChannel>('SHOPEE');
  const [noResiKirim, setNoResiKirim] = useState('');
  const [noResiRetur, setNoResiRetur] = useState('');
  const [biayaCheckout, setBiayaCheckout] = useState<number | ''>('');
  const [biayaRefund, setBiayaRefund] = useState<number | ''>('');
  const [biayaPackingLoss, setBiayaPackingLoss] = useState<number | ''>(5000); // default Rp 5.000 packing
  const [biayaOngkirBbmLoss, setBiayaOngkirBbmLoss] = useState<number | ''>(10000); // default Rp 10.000 bbm/transport
  const [kondisiBarang, setKondisiBarang] = useState<ReturnCondition>('GOOD_CONDITION');
  const [catatan, setCatatan] = useState('');
  const [qty, setQty] = useState<number>(1);

  // Modal Refurbish state
  const [refurbishTarget, setRefurbishTarget] = useState<ReturnRecord | null>(null);
  const [biayaRefurbish, setBiayaRefurbish] = useState<number | ''>('');
  const [hargaJualRefurbished, setHargaJualRefurbished] = useState<number | ''>('');
  const [catatanRefurbish, setCatatanRefurbish] = useState('');
  const [restockToInventory, setRestockToInventory] = useState(true);

  // Format Currency Helper
  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filtered Parts for Form Combobox
  const filteredPartsForForm = parts.filter(p =>
    p.kodeItem.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.namaSparepart.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(partSearch.toLowerCase())
  );

  // Calculate Metrics
  const totalReturnCount = returns.length;
  const goodConditionCount = returns.filter(r => r.kondisiBarang === 'GOOD_CONDITION').length;
  const defectCount = returns.filter(r => r.kondisiBarang === 'DEFECT_RUSAK').length;
  const refurbishedCount = returns.filter(r => r.isRefurbished).length;

  const totalCheckoutAmount = returns.reduce((sum, r) => sum + (r.biayaCheckout || 0), 0);
  const totalRefundAmount = returns.reduce((sum, r) => sum + (r.biayaRefund || 0), 0);
  const totalOpsLossAmount = returns.reduce((sum, r) => sum + (r.totalKerugianOperasional || 0), 0);
  const totalRefurbishCost = returns.reduce((sum, r) => sum + (r.biayaRefurbish || 0), 0);

  // Filtered Returns List
  const filteredReturns = returns.filter(r => {
    const matchesSearch =
      r.noRetur.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.noResiKirim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.noResiRetur.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.kodeItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.namaSparepart.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel = selectedChannel === 'ALL' || r.salesChannel === selectedChannel;
    const matchesCondition = selectedCondition === 'ALL' || r.kondisiBarang === selectedCondition;

    return matchesSearch && matchesChannel && matchesCondition;
  });

  // Reset New Return Form
  const resetForm = () => {
    setSelectedPart(null);
    setPartSearch('');
    setNoResiKirim('');
    setNoResiRetur('');
    setBiayaCheckout('');
    setBiayaRefund('');
    setBiayaPackingLoss(5000);
    setBiayaOngkirBbmLoss(10000);
    setKondisiBarang('GOOD_CONDITION');
    setCatatan('');
    setQty(1);
    setIsFormOpen(false);
  };

  // Submit New Return Form
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) {
      showToast('Pilih sparepart yang diretur terlebih dahulu!', 'error');
      return;
    }
    if (!noResiKirim.trim() || !noResiRetur.trim()) {
      showToast('No. Resi Kirim & No. Resi Retur wajib diisi!', 'error');
      return;
    }

    const numCheckout = Number(biayaCheckout) || 0;
    const numRefund = Number(biayaRefund) || 0;
    const numPacking = Number(biayaPackingLoss) || 0;
    const numOngkir = Number(biayaOngkirBbmLoss) || 0;

    addReturnRecord({
      partId: selectedPart.id,
      kodeItem: selectedPart.kodeItem,
      namaSparepart: selectedPart.namaSparepart,
      brand: selectedPart.brand,
      lokasiRak: selectedPart.lokasiRak,
      satuan: selectedPart.satuan || 'PCS',
      qty: Number(qty) || 1,
      salesChannel,
      noResiKirim: noResiKirim.trim(),
      noResiRetur: noResiRetur.trim(),
      biayaCheckout: numCheckout,
      biayaRefund: numRefund,
      biayaPackingLoss: numPacking,
      biayaOngkirBbmLoss: numOngkir,
      totalKerugianOperasional: numPacking + numOngkir,
      kondisiBarang,
      catatan
    });

    resetForm();
  };

  // Submit Refurbish Form
  const handleSaveRefurbish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refurbishTarget) return;

    refurbishReturnItem(refurbishTarget.id, {
      biayaRefurbish: Number(biayaRefurbish) || 0,
      hargaJualRefurbished: Number(hargaJualRefurbished) || 0,
      catatanRefurbish: catatanRefurbish.trim(),
      restockToInventory
    });

    setRefurbishTarget(null);
    setBiayaRefurbish('');
    setHargaJualRefurbished('');
    setCatatanRefurbish('');
  };

  // Export CSV Helper
  const handleExportCsv = () => {
    if (returns.length === 0) {
      showToast('Belum ada data retur untuk diexport.', 'info');
      return;
    }

    const headers = [
      'No Retur', 'Tanggal', 'Channel', 'No Resi Kirim', 'No Resi Retur', 
      'Kode Item', 'Nama Sparepart', 'Brand', 'Qty', 'Biaya Checkout', 
      'Biaya Refund', 'Biaya Packing', 'Biaya BBM/Transport', 'Total Kerugian Ops',
      'Kondisi Fisik', 'Status', 'Is Refurbished', 'Biaya Refurbish', 'Harga Jual Refurbished', 'Petugas'
    ];

    const rows = returns.map(r => [
      `"${r.noRetur}"`,
      `"${r.tanggal}"`,
      `"${r.salesChannel}"`,
      `"${r.noResiKirim}"`,
      `"${r.noResiRetur}"`,
      `"${r.kodeItem}"`,
      `"${r.namaSparepart.replace(/"/g, '""')}"`,
      `"${r.brand}"`,
      r.qty,
      r.biayaCheckout,
      r.biayaRefund,
      r.biayaPackingLoss,
      r.biayaOngkirBbmLoss,
      r.totalKerugianOperasional,
      `"${r.kondisiBarang}"`,
      `"${r.status}"`,
      r.isRefurbished ? 'YA' : 'TIDAK',
      r.biayaRefurbish || 0,
      r.hargaJualRefurbished || 0,
      `"${r.petugas}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Retur_Online_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Berhasil mengunduh Laporan Retur Online (.CSV)', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-[#0B3C85]" /> Return Management (Retur Penjualan Online)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 font-mono font-black text-[10px]">
              RETURN LEDGER
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pencatatan terisolasi resi pengembalian, audit kerugian operasional (packing & BBM), dan manajemen pemulihan stok
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Laporan Retur
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4 text-sky-300" /> + Proses Retur Baru
          </button>
        </div>
      </div>

      {/* KPI Cards: Return Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Return Count & Value */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TOTAL RETUR ONLINE</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalReturnCount} Paket</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              {shouldSensorHpp ? 'Rp •••••••••' : `Checkout: ${formatIdr(totalCheckoutAmount)}`}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Good Condition (Restocked) */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">GOOD CONDITION (UTUH)</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{goodConditionCount} Unit</p>
            <p className="text-[11px] font-bold text-emerald-800 mt-0.5">Otomatis Restock ke Rak Jual</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Defect / Cacat */}
        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block">DEFECT / CACAT (AFKIR)</span>
            <p className="text-2xl font-black text-red-600 mt-1">{defectCount} Unit</p>
            <p className="text-[11px] font-bold text-red-700 mt-0.5">Karantina / Opsi Refurbished ({refurbishedCount} Diperbaiki)</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Operational Loss (Packing & BBM) */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">BIAYA OPS TERBUANG</span>
            {shouldSensorHpp ? (
              <p className="text-xl font-black text-amber-600 font-mono mt-1">Rp •••••••••</p>
            ) : (
              <p className="text-xl font-black text-amber-700 mt-1">{formatIdr(totalOpsLossAmount)}</p>
            )}
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Packing + BBM / Transport</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari No. Retur / No. Resi / Kode Item / Nama Sparepart..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none"
            >
              <option value="ALL">Semua Channel</option>
              <option value="SHOPEE">🟠 Shopee</option>
              <option value="TOKOPEDIA">🟢 Tokopedia / TikTok</option>
              <option value="GROSIR_OTHER">📦 Marketplace Lainnya</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-800">
            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none"
            >
              <option value="ALL">Semua Kondisi Fisik</option>
              <option value="GOOD_CONDITION">✅ Good Condition (Utuh)</option>
              <option value="DEFECT_RUSAK">❌ Cacat / Rusak (Afkir)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Returns Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                <th className="py-3.5 px-4">No. Retur & Waktu</th>
                <th className="py-3.5 px-4">Channel & Resi</th>
                <th className="py-3.5 px-4">Sparepart & Rak</th>
                <th className="py-3.5 px-4 text-center">Qty</th>
                <th className="py-3.5 px-4 text-right">Biaya Checkout vs Refund</th>
                <th className="py-3.5 px-4 text-right">Kerugian Ops (Packing/BBM)</th>
                <th className="py-3.5 px-4 text-center">Kondisi Fisik</th>
                <th className="py-3.5 px-4 text-center">Aksi / Status Refurbish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Belum ada catatan transaksi retur online yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => {
                  const isGood = r.kondisiBarang === 'GOOD_CONDITION';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      {/* No Retur & Tanggal */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-black block">{r.noRetur}</span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{r.tanggal}</span>
                      </td>

                      {/* Channel & Resi */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block mb-1 ${
                          r.salesChannel === 'SHOPEE' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.salesChannel}
                        </span>
                        <div className="text-[11px]">
                          <span className="text-slate-500 block">Resi Kirim: <strong className="font-mono text-slate-800">{r.noResiKirim}</strong></span>
                          <span className="text-slate-500 block">Resi Retur: <strong className="font-mono text-slate-800">{r.noResiRetur}</strong></span>
                        </div>
                      </td>

                      {/* Sparepart & Rak */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block">{r.namaSparepart}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {r.kodeItem}
                          </span>
                          <span className="font-semibold text-slate-500">Rak: {r.lokasiRak}</span>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-4 text-center font-mono font-black text-sm">
                        {r.qty} {r.satuan}
                      </td>

                      {/* Financial Checkout vs Refund */}
                      <td className="py-3 px-4 text-right font-mono">
                        {shouldSensorHpp ? (
                          <span className="text-amber-600 font-bold">Rp •••••••</span>
                        ) : (
                          <>
                            <span className="text-slate-900 font-bold block">Checkout: {formatIdr(r.biayaCheckout)}</span>
                            <span className="text-red-600 font-bold block text-[11px]">Refund: {formatIdr(r.biayaRefund)}</span>
                          </>
                        )}
                      </td>

                      {/* Kerugian Ops */}
                      <td className="py-3 px-4 text-right font-mono">
                        {shouldSensorHpp ? (
                          <span className="text-amber-600 font-bold">Rp •••••••</span>
                        ) : (
                          <>
                            <span className="text-amber-700 font-black block">{formatIdr(r.totalKerugianOperasional)}</span>
                            <span className="text-[10px] text-slate-400 block">Pack: {formatIdr(r.biayaPackingLoss)} | BBM: {formatIdr(r.biayaOngkirBbmLoss)}</span>
                          </>
                        )}
                      </td>

                      {/* Kondisi Fisik */}
                      <td className="py-3 px-4 text-center">
                        {isGood ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Good Condition (Restocked)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-red-600" /> Cacat / Rusak (Afkir)
                          </span>
                        )}
                      </td>

                      {/* Aksi & Status Refurbish */}
                      <td className="py-3 px-4 text-center">
                        {r.isRefurbished ? (
                          <div className="text-left bg-violet-50 p-2 rounded-xl border border-violet-200 text-[10px]">
                            <span className="font-black text-violet-800 uppercase flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-violet-600" /> Refurbished Done
                            </span>
                            <span className="text-slate-600 block mt-0.5">Biaya Ops: {formatIdr(r.biayaRefurbish || 0)}</span>
                            <span className="text-slate-600 block">Harga Jual Baru: {formatIdr(r.hargaJualRefurbished || 0)}</span>
                          </div>
                        ) : !isGood ? (
                          <button
                            onClick={() => {
                              setRefurbishTarget(r);
                              setBiayaRefurbish('');
                              setHargaJualRefurbished(r.biayaCheckout || '');
                              setCatatanRefurbish('');
                            }}
                            className="px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs transition mx-auto"
                            title="Klik untuk memasukkan data perbaikan (Refurbished) agar barang layak jual kembali"
                          >
                            <Wrench className="w-3.5 h-3.5 text-violet-200" /> Refurbished / Perbaiki
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">Siap Jual Kembali</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Form Input Retur Penjualan Baru */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#0B3C85]" /> Formulir Penerimaan Retur Penjualan Online
                </h3>
                <p className="text-xs text-slate-500">
                  Input resi pengembalian, biaya checkout vs refund, serta rincian operasional packing & bbm
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs font-semibold">
              {/* Grid 1: Marketplace & Resi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">Marketplace / Channel</label>
                  <select
                    value={salesChannel}
                    onChange={e => setSalesChannel(e.target.value as SalesChannel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-[#0B3C85] focus:outline-none"
                  >
                    <option value="SHOPEE">🟠 Shopee</option>
                    <option value="TOKOPEDIA">🟢 Tokopedia / TikTok Shop</option>
                    <option value="GROSIR_OTHER">📦 Marketplace / Grosir Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">No. Resi Kirim Awal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SPX12345678"
                    value={noResiKirim}
                    onChange={e => setNoResiKirim(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">No. Resi Retur (Kembali) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RET-99887766"
                    value={noResiRetur}
                    onChange={e => setNoResiRetur(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid 2: Sparepart Combobox Selection */}
              <div className="relative">
                <label className="text-slate-700 font-extrabold block mb-1">Pilih Sparepart Yang Diretur *</label>
                {selectedPart ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-300 rounded-xl">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{selectedPart.namaSparepart}</span>
                      <span className="text-[10px] font-mono text-blue-700">
                        {selectedPart.kodeItem} | Rak: {selectedPart.lokasiRak} | Brand: {selectedPart.brand}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPart(null);
                        setPartSearch('');
                      }}
                      className="text-xs font-extrabold text-red-600 hover:underline"
                    >
                      Ganti Part
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Ketik kode item / nama sparepart untuk mencari..."
                      value={partSearch}
                      onChange={e => {
                        setPartSearch(e.target.value);
                        setIsPartDropdownOpen(true);
                      }}
                      onFocus={() => setIsPartDropdownOpen(true)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-black focus:border-[#0B3C85] focus:outline-none"
                    />

                    {isPartDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y">
                        {filteredPartsForForm.length === 0 ? (
                          <p className="p-3 text-slate-400 text-center">Sparepart tidak ditemukan.</p>
                        ) : (
                          filteredPartsForForm.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPart(p);
                                setIsPartDropdownOpen(false);
                                setBiayaCheckout(p.hargaShopee || p.hargaJual || 0);
                                setBiayaRefund(p.hargaShopee || p.hargaJual || 0);
                              }}
                              className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition"
                            >
                              <div>
                                <span className="font-extrabold text-slate-900 block">{p.namaSparepart}</span>
                                <span className="text-[10px] font-mono text-slate-500">{p.kodeItem} — Rak {p.lokasiRak}</span>
                              </div>
                              <span className="font-mono text-xs font-black text-slate-700">{formatIdr(p.hargaShopee || p.hargaJual || 0)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid 3: Qty & Financial Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">Jumlah Retur (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={qty}
                    onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">Biaya Saat Checkout (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={biayaCheckout}
                    onChange={e => setBiayaCheckout(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-extrabold block mb-1">Biaya Dikembalikan (Refund Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={biayaRefund}
                    onChange={e => setBiayaRefund(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid 4: Operational Expense Losses (Packing & BBM) */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block">
                  ⛽ Rincian Kerugian Operasional Terbuang (Outflow Expenses)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Biaya Packing Terbuang (Rp)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 5000 (Kardus & Bubble Wrap)"
                      value={biayaPackingLoss}
                      onChange={e => setBiayaPackingLoss(e.target.value ? parseFloat(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono text-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Biaya BBM / Transport / Admin (Rp)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 10000 (Ongkir Penjemputan/BBM)"
                      value={biayaOngkirBbmLoss}
                      onChange={e => setBiayaOngkirBbmLoss(e.target.value ? parseFloat(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono text-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 5: Physical Condition Selection */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Kondisi Fisik Sparepart Diterima *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKondisiBarang('GOOD_CONDITION')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2 transition ${
                      kondisiBarang === 'GOOD_CONDITION'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-xs">1. Good Condition / Utuh</span>
                      <span className="text-[10px] text-slate-500 block">Stok realtime di rak gudang otomatis bertambah (+{qty} Pcs)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKondisiBarang('DEFECT_RUSAK')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2 transition ${
                      kondisiBarang === 'DEFECT_RUSAK'
                        ? 'bg-red-50 border-red-500 ring-2 ring-red-400 text-red-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-xs">2. Cacat / Rusak</span>
                      <span className="text-[10px] text-slate-500 block">Masuk Karantina / Afkir (Dapat dipulihkan via tombol Refurbished)</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Dus penyok dari ekspedisi, tetapi isi sparepart utuh..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-sky-300" /> Simpan & Catat Retur Online
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Refurbished / Perbaikan Form Modal */}
      {refurbishTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-violet-700" /> Formulir Refurbished / Perbaikan Barang
                </h3>
                <p className="text-xs text-slate-500">
                  Pemulihan barang cacat/rusak agar layak dijual kembali
                </p>
              </div>
              <button
                onClick={() => setRefurbishTarget(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-violet-50 border border-violet-200 rounded-2xl text-xs space-y-1">
              <span className="font-extrabold text-violet-900 block">{refurbishTarget.namaSparepart}</span>
              <span className="text-[11px] font-mono text-slate-600 block">Kode: {refurbishTarget.kodeItem} | Resi: {refurbishTarget.noResiRetur}</span>
            </div>

            <form onSubmit={handleSaveRefurbish} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Biaya Perbaikan / Refurbish (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 15000 (Biaya Ganti Box/Seal)"
                  value={biayaRefurbish}
                  onChange={e => setBiayaRefurbish(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Harga Jual Refurbished Baru (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 130000 (Harga jual khusus refurbished)"
                  value={hargaJualRefurbished}
                  onChange={e => setHargaJualRefurbished(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-black focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Catatan & Rincian Perbaikan *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Sudah diganti kardus packing OEM baru dan dilakukan pengencangan baud..."
                  value={catatanRefurbish}
                  onChange={e => setCatatanRefurbish(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl">
                <input
                  type="checkbox"
                  id="restockCheck"
                  checked={restockToInventory}
                  onChange={e => setRestockToInventory(e.target.checked)}
                  className="w-4 h-4 text-[#0B3C85] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="restockCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Restock kembali ke Rak Utama Siap Jual (+{refurbishTarget.qty} {refurbishTarget.satuan})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRefurbishTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Wrench className="w-4 h-4 text-violet-200" /> Simpan & Pulihkan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
