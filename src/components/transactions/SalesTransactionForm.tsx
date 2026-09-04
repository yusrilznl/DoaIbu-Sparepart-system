import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { SparePart, SalesChannel } from '../../types/inventory';
import { ArrowUpRight, Plus, Trash2, Save, ShoppingBag, Camera, CheckCircle2, Zap, Layers } from 'lucide-react';
import { ItemModal } from '../catalog/ItemModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { matchSparePartSearch, deduplicatePartsList } from '../../utils/searchUtils';

interface OutboundFormProps {
  preselectedPartId?: string;
}

interface FormLineItem {
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  brand: string;
  lokasiRak: string;
  stokTersedia: number;
  jumlahKirim: number;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  hargaMarketplace?: number;
  fotoProduk?: string;
}

export const SalesTransactionForm: React.FC<OutboundFormProps> = ({ preselectedPartId }) => {
  const { parts, saveTransaction, showToast } = useInventory();
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const shouldSensorFinancialData = !isSuperAdmin || isFinancialPrivacyEnabled;

  const [noSuratJalan, setNoSuratJalan] = useState<string>(() => {
    const now = new Date();
    return `SJ-OUT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
  });

  const [tanggal, setTanggal] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 5);
  });

  const [salesChannel, setSalesChannel] = useState<SalesChannel>('OFFLINE_STORE');
  const [gudangAsal, setGudangAsal] = useState<string>('');
  const [pelanggan, setPelanggan] = useState<string>('');
  const [salesPerson, setSalesPerson] = useState<string>(currentUser?.name || 'Budi Santoso');
  const [notes, setNotes] = useState<string>('');

  // Line items state
  const [items, setItems] = useState<FormLineItem[]>([]);

  // Combobox Search state
  const [comboboxSearch, setComboboxSearch] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState<boolean>(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState<boolean>(false);

  // Barcode Scanner Modal state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (preselectedPartId) {
      const p = parts.find(part => part.id === preselectedPartId);
      if (p) {
        addItemToForm(p);
      }
    }
  }, [preselectedPartId, parts]);

  // When sales channel changes, update item prices automatically
  useEffect(() => {
    setItems(prevItems =>
      prevItems.map(item => {
        const p = parts.find(part => part.id === item.partId);
        if (!p) return item;
        const targetPrice = salesChannel === 'SHOPEE'
          ? (p.hargaShopee || Math.round(p.hargaJual * 1.085))
          : salesChannel === 'TOKOPEDIA'
          ? (p.hargaTokopedia || Math.round(p.hargaJual * 1.08))
          : p.hargaJual;
        return {
          ...item,
          hargaJual: targetPrice
        };
      })
    );
  }, [salesChannel, parts]);

  const addItemToForm = (part: SparePart, incrementQtyIfExist = false) => {
    const initialPrice = salesChannel === 'SHOPEE'
      ? (part.hargaShopee || Math.round(part.hargaJual * 1.085))
      : salesChannel === 'TOKOPEDIA'
      ? (part.hargaTokopedia || Math.round(part.hargaJual * 1.08))
      : part.hargaJual;

    const existingIndex = items.findIndex(i => i.partId === part.id);

    if (existingIndex >= 0) {
      if (incrementQtyIfExist) {
        // Continuous scan mode: increment Qty + 1
        setItems(prev =>
          prev.map((item, idx) => {
            if (idx === existingIndex) {
              const newQty = Math.min(item.jumlahKirim + 1, item.stokTersedia);
              return { ...item, jumlahKirim: newQty };
            }
            return item;
          })
        );
        showToast(`⚡ Scan Dus: Qty ${part.kodeItem} bertambah menjadi ${items[existingIndex].jumlahKirim + 1}`, 'success');
      } else {
        showToast(`Sparepart ${part.kodeItem} sudah ada di daftar.`, 'info');
      }
      return;
    }

    setItems(prev => [
      ...prev,
      {
        partId: part.id,
        kodeItem: part.kodeItem,
        namaSparepart: part.namaSparepart,
        brand: part.brand,
        lokasiRak: part.lokasiRak,
        stokTersedia: part.stokRealtime,
        jumlahKirim: 1,
        satuan: part.satuan,
        hargaBeli: part.hargaBeli || 0,
        hargaJual: initialPrice,
        fotoProduk: part.fotoProduk
      }
    ]);

    setComboboxSearch('');
    setIsComboboxOpen(false);
    showToast(`📦 Scan Dus: ${part.kodeItem} (${part.namaSparepart}) ditambahkan!`, 'success');
  };

  // Barcode Continuous Scan Callback
  const handleContinuousScanSuccess = (scannedCode: string) => {
    const matchedPart = parts.find(p =>
      p.kodeItem.toLowerCase() === scannedCode.toLowerCase() ||
      (p.oemNumber && p.oemNumber.toLowerCase() === scannedCode.toLowerCase())
    );

    if (matchedPart) {
      addItemToForm(matchedPart, true);
    } else {
      showToast(`⚠️ Barcode "${scannedCode}" tidak ditemukan di database sparepart!`, 'error');
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const validQty = Math.min(Math.max(1, qty), item.stokTersedia);
          return { ...item, jumlahKirim: validQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Pilih minimal 1 sparepart yang akan dikirim!', 'error');
      return;
    }

    const txItems = items.map(i => ({
      id: 'li-' + Date.now() + '-' + i.partId,
      partId: i.partId,
      kodeItem: i.kodeItem,
      namaSparepart: i.namaSparepart,
      brand: i.brand,
      lokasiRak: i.lokasiRak,
      stokTersedia: i.stokTersedia,
      jumlahKirim: i.jumlahKirim,
      jumlahTerima: i.jumlahKirim,
      satuan: i.satuan,
      hargaBeli: i.hargaBeli,
      hargaJual: i.hargaJual
    }));

    saveTransaction({
      noTransaksi: noSuratJalan,
      tanggal,
      jenisTransaksi: 'MUTASI_KELUAR',
      salesChannel,
      gudangAsal,
      pelanggan,
      salesPerson,
      items: txItems,
      totalKuantitasItem: items.length,
      totalJumlahTerima: items.reduce((acc, i) => acc + i.jumlahKirim, 0),
      totalNilaiHpp: items.reduce((acc, i) => acc + (i.jumlahKirim * i.hargaBeli), 0),
      totalNilaiJual: items.reduce((acc, i) => acc + (i.jumlahKirim * i.hargaJual), 0),
      notes
    });

    // Reset Form
    const now = new Date();
    setNoSuratJalan(`SJ-OUT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`);
    setItems([]);
    setNotes('');
  };

  const filteredComboboxParts = deduplicatePartsList(
    parts.filter(p => matchSparePartSearch(p, comboboxSearch))
  );

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Continuous Scanner Trigger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-red-600" /> Form Barang Keluar (Surat Jalan Multi-Channel)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Penerbitan Surat Jalan & Continuous Camera Scan Dus Pabrik
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow transition"
        >
          <Camera className="w-4 h-4 text-emerald-200 animate-pulse" /> 📷 Buka Camera Scanner Beruntun
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Responsive Grid Form Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            HEADER DOKUMEN SURAT JALAN & CHANNEL PENJUALAN
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 font-bold mb-1">No Surat Jalan (Auto)*</label>
              <input
                type="text"
                required
                value={noSuratJalan}
                onChange={e => setNoSuratJalan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-black focus:border-[#0B3C85] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Channel Penjualan*</label>
              <select
                value={salesChannel}
                onChange={e => setSalesChannel(e.target.value as SalesChannel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-black focus:border-[#0B3C85] focus:outline-none"
              >
                <option value="OFFLINE_STORE">🏪 Offline Store (Harga Toko)</option>
                <option value="SHOPEE">🟠 Shopee (Harga Marketplace)</option>
                <option value="TOKOPEDIA">🟢 Tokopedia (Harga Marketplace)</option>
                <option value="GROSIR_OTHER">📦 Grosir / Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Gudang Pengirim (Manual)*</label>
              <input
                type="text"
                required
                placeholder="masukkan gudang pengirim"
                value={gudangAsal}
                onChange={e => setGudangAsal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-[#0B3C85] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tujuan / Nama Pembeli*</label>
              <input
                type="text"
                required
                placeholder="masukkan tujuan / nama pembeli"
                value={pelanggan}
                onChange={e => setPelanggan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-black focus:border-[#0B3C85] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Item Selection Combobox & Scanner Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              PILIH / SCAN DUS PABRIK
            </span>

            {salesChannel !== 'OFFLINE_STORE' && (
              <span className="px-2.5 py-1 bg-orange-100 text-orange-900 font-bold text-[10px] rounded-lg border border-orange-200 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-600" /> Mode Marketplace: Menggunakan Harga Marketplace
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Ketik nama, kode item, brand, atau scan barcode..."
              value={comboboxSearch}
              onChange={e => {
                setComboboxSearch(e.target.value);
                setIsComboboxOpen(true);
              }}
              onFocus={() => setIsComboboxOpen(true)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:border-[#0B3C85] focus:bg-white focus:outline-none"
            />

            {/* Combobox Dropdown Results */}
            {isComboboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {/* Creatable Quick Add Option */}
                {comboboxSearch.trim() && !filteredComboboxParts.some(p => p.kodeItem.toLowerCase() === comboboxSearch.toLowerCase()) && (
                  <div
                    onClick={() => {
                      setIsQuickAddModalOpen(true);
                      setIsComboboxOpen(false);
                    }}
                    className="p-3 bg-blue-50/70 hover:bg-blue-100 cursor-pointer flex items-center gap-2 text-xs font-extrabold text-[#0B3C85]"
                  >
                    <Plus className="w-4 h-4 text-sky-600" /> + Tambah Barang Baru: "{comboboxSearch}"
                  </div>
                )}

                {filteredComboboxParts.map(part => (
                  <div
                    key={part.id}
                    onClick={() => addItemToForm(part)}
                    className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {part.fotoProduk ? (
                          <img src={part.fotoProduk} alt={part.kodeItem} className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono font-black text-black block">{part.kodeItem}</span>
                        <span className="font-bold text-slate-800">{part.namaSparepart}</span>
                        <span className="text-slate-400 text-[11px] ml-2">({part.brand})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-red-600 bg-red-50 border px-1.5 py-0.5 rounded text-[10px]">
                        Rak {part.lokasiRak}
                      </span>
                      <span className="font-mono font-bold text-slate-900">Stok: {part.stokRealtime} {part.satuan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Selected Items with whitespace-nowrap cell formatting */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Foto & Kode Part</th>
                  <th className="py-3 px-4">Nama Sparepart</th>
                  <th className="py-3 px-4 min-w-[120px]">Rak Bin</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Stok Fisik</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Jumlah Kirim</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Harga Satuan</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold whitespace-nowrap">
                      Belum ada sparepart yang dipilih/di-scan. Gunakan camera scanner di atas untuk scan dus beruntun!
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.partId} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 text-slate-400 font-bold whitespace-nowrap">{index + 1}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {item.fotoProduk ? (
                              <img src={item.fotoProduk} alt={item.kodeItem} className="w-full h-full object-cover" />
                            ) : (
                              <Layers className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="font-mono font-black text-black text-xs">{item.kodeItem}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 truncate max-w-xs">{item.namaSparepart}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-red-600 bg-red-50 border border-red-200 text-[11px] whitespace-nowrap">
                          {item.lokasiRak}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                        {item.stokTersedia} {item.satuan}
                      </td>

                      {/* Interactive Qty Input */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          max={item.stokTersedia}
                          value={item.jumlahKirim}
                          onChange={e => handleQtyChange(index, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-center font-mono font-black text-black bg-white border border-slate-300 rounded-lg focus:border-[#0B3C85] focus:outline-none"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className="text-emerald-700">{formatIdr(item.hargaJual)}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={items.length === 0}
              className="w-full sm:w-auto py-3.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" /> Terbitkan Surat Jalan Barang Keluar
            </button>
          </div>
        </div>
      </form>

      {/* Modal Quick-Add Sparepart */}
      {isQuickAddModalOpen && (
        <ItemModal
          onClose={() => setIsQuickAddModalOpen(false)}
        />
      )}

      {/* Barcode Continuous Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleContinuousScanSuccess}
        onUnrecognizedCode={(code) => {
          showToast(`💡 Kode item "${code}" belum terdaftar. Menampilkan modal input baru.`, 'info');
          setIsQuickAddModalOpen(true);
        }}
        title="📷 Pemindai Barcode Dus Pabrik Beruntun (Continuous Mode)"
      />
    </div>
  );
};
