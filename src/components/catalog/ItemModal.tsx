import React, { useState } from 'react';
import { SparePart } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { X, Save, Tag, Camera, ShoppingBag, Loader2 } from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface ItemModalProps {
  initialPart?: SparePart | null;
  onClose: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ initialPart, onClose }) => {
  const { addSparePart, updateSparePart, showToast } = useInventory();

  const [kodeItem, setKodeItem] = useState(initialPart?.kodeItem || '');
  const [oemNumber, setOemNumber] = useState(initialPart?.oemNumber || '');
  const [namaSparepart, setNamaSparepart] = useState(initialPart?.namaSparepart || '');
  const [brand, setBrand] = useState(initialPart?.brand || 'GENUINE');
  const [lokasiRak, setLokasiRak] = useState(initialPart?.lokasiRak || 'A-01-01');
  const [satuan, setSatuan] = useState(initialPart?.satuan || 'Pcs');
  const [stokRealtime, setStokRealtime] = useState<string | number>(initialPart?.stokRealtime !== undefined ? initialPart.stokRealtime : '');
  const [stokMin, setStokMin] = useState<string | number>(initialPart?.stokMin !== undefined ? initialPart.stokMin : 2);
  const [stokMax, setStokMax] = useState<string | number>(initialPart?.stokMax !== undefined ? initialPart.stokMax : '');
  const [hargaBeli, setHargaBeli] = useState<string | number>(initialPart?.hargaBeli !== undefined && initialPart.hargaBeli !== 0 ? initialPart.hargaBeli : '');
  const [hargaJual, setHargaJual] = useState<string | number>(initialPart?.hargaJual !== undefined && initialPart.hargaJual !== 0 ? initialPart.hargaJual : '');

  // Dedicated Marketplace Pricing
  const [hargaShopee, setHargaShopee] = useState<string | number>(initialPart?.hargaShopee || (initialPart?.hargaJual !== undefined && initialPart.hargaJual !== 0 ? initialPart.hargaJual : ''));
  const [adminFeeShopeePercent, setAdminFeeShopeePercent] = useState<string | number>(initialPart?.adminFeeShopeePercent !== undefined ? initialPart.adminFeeShopeePercent : 8.5);

  const [hargaTokopedia, setHargaTokopedia] = useState<string | number>(initialPart?.hargaTokopedia || (initialPart?.hargaJual !== undefined && initialPart.hargaJual !== 0 ? initialPart.hargaJual : ''));
  const [adminFeeTokopediaPercent, setAdminFeeTokopediaPercent] = useState<string | number>(initialPart?.adminFeeTokopediaPercent !== undefined ? initialPart.adminFeeTokopediaPercent : 8.0);

  const initialFoto = initialPart
    ? (Array.isArray((initialPart as any).gambar) && (initialPart as any).gambar.length > 0
        ? (initialPart as any).gambar[0]
        : (initialPart.fotoProduk || (initialPart as any).foto || (initialPart as any).imageUrl || (typeof (initialPart as any).gambar === 'string' ? (initialPart as any).gambar : '')))
    : '';

  const [fotoProduk, setFotoProduk] = useState<string>(initialFoto);
  const [deskripsi, setDeskripsi] = useState(initialPart?.deskripsi || '');

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Helper parser for decimal/currency with comma support
  const parseNum = (val: string | number | undefined): number => {
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(',', '.');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? 0 : n;
  };

  // Format IDR Helper Function
  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const numHargaBeli = parseNum(hargaBeli);
  const numHargaJual = parseNum(hargaJual);
  const numHargaShopee = parseNum(hargaShopee);
  const numHargaTokopedia = parseNum(hargaTokopedia);
  const numFeeShopee = parseNum(adminFeeShopeePercent);
  const numFeeTokopedia = parseNum(adminFeeTokopediaPercent);

  // Profit Margin Offline Store
  const marginStoreRp = numHargaJual - numHargaBeli;
  const marginPercentage = numHargaBeli > 0 ? ((marginStoreRp / numHargaBeli) * 100).toFixed(1) : '0';

  // Shopee Profit Calculation
  const adminShopeeRp = (numHargaShopee * numFeeShopee) / 100;
  const netProfitShopee = numHargaShopee - adminShopeeRp - numHargaBeli;

  // Tokopedia / TikTok Shop Profit Calculation
  const adminTokopediaRp = (numHargaTokopedia * numFeeTokopedia) / 100;
  const netProfitTokopedia = numHargaTokopedia - adminTokopediaRp - numHargaBeli;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!kodeItem.trim() || !namaSparepart.trim()) {
      showToast('Part Number dan Nama Sparepart wajib diisi!', 'error');
      return;
    }

    if (isCompressing) {
      showToast('Mohon tunggu hingga pemrosesan foto selesai.', 'error');
      return;
    }

    const payload: Omit<SparePart, 'id'> = {
      kodeItem: kodeItem.trim().toUpperCase(),
      oemNumber: oemNumber.trim().toUpperCase(),
      namaSparepart: namaSparepart.trim(),
      brand: brand.trim() || 'GENUINE',
      lokasiRak: lokasiRak.trim().toUpperCase(),
      satuan: satuan.trim() || 'Pcs',
      stokRealtime: parseNum(stokRealtime),
      stokMin: parseNum(stokMin),
      stokMax: stokMax !== '' ? parseNum(stokMax) : undefined,
      hargaBeli: numHargaBeli,
      hargaJual: numHargaJual,
      hargaShopee: numHargaShopee,
      adminFeeShopeePercent: numFeeShopee,
      hargaTokopedia: numHargaTokopedia,
      adminFeeTokopediaPercent: numFeeTokopedia,
      fotoProduk: fotoProduk.trim() || initialFoto || '',
      deskripsi: deskripsi.trim(),
      terakhirDiupdate: new Date().toISOString()
    };

    if (initialPart && initialPart.id) {
      updateSparePart(initialPart.id, payload);
    } else {
      addSparePart(payload);
    }

    onClose();
  };

  const handleScanPartNumberSuccess = (scannedCode: string) => {
    setKodeItem(scannedCode.toUpperCase());
    setIsScannerOpen(false);
    showToast(`Part Number "${scannedCode}" berhasil dimasukkan dari hasil scan kamera.`, 'success');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const scaleFactor = MAX_WIDTH / img.width;

          canvas.width = scaleFactor < 1 ? MAX_WIDTH : img.width;
          canvas.height = scaleFactor < 1 ? img.height * scaleFactor : img.height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.35);
          setFotoProduk(compressedBase64);
          setIsCompressing(false);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-5 mx-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-extrabold text-black text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#0B3C85]" />
              {initialPart ? 'Edit Data Sparepart' : 'Tambah Sparepart Baru'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Input informasi katalog, rak bin, dan multi-harga marketplace (Shopee & Tokopedia/TikTok)
            </p>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Grid 1: Part Number & OEM Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">Part Number / Kode Item*</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                >
                  <Camera className="w-3 h-3" /> Pindai Barcode Kamera
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="FS1280 / W9501-45101"
                value={kodeItem}
                onChange={e => setKodeItem(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-black focus:border-[#0B3C85] focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nomor OEM Ref Pabrik</label>
              <input
                type="text"
                placeholder="LF3349 / 1000700909"
                value={oemNumber}
                onChange={e => setOemNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:border-[#0B3C85] focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Grid 2: Nama Sparepart & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nama Sparepart / Barang*</label>
              <input
                type="text"
                required
                placeholder="Fuel Filter Water Separator Fleetguard"
                value={namaSparepart}
                onChange={e => setNamaSparepart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-[#0B3C85] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Merk / Brand*</label>
              <input
                type="text"
                required
                placeholder="Fleetguard / Kubota / Cat"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-[#0B3C85] focus:outline-none"
              />
            </div>
          </div>

          {/* Foto Produk Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <label className="block text-slate-700 font-bold">Foto Produk / Gambar Sparepart</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                {isCompressing ? (
                  <Loader2 className="w-6 h-6 text-[#0B3C85] animate-spin" />
                ) : fotoProduk ? (
                  <img src={fotoProduk} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1 text-slate-400 text-[10px]">
                    <Camera className="w-5 h-5 mx-auto mb-0.5 text-slate-300" />
                    <span>No Photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0B3C85] hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  {isCompressing ? 'Mengompresi foto...' : 'Format: JPG, PNG, WEBP (Otomatis dikompresi)'}
                </p>
              </div>
            </div>
          </div>

          {/* Grid 3: Lokasi Rak, Stok, Satuan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Lokasi Rak / Alamat Gudang*</label>
              <input
                type="text"
                required
                placeholder="A-01-01"
                value={lokasiRak}
                onChange={e => setLokasiRak(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-red-600 focus:border-[#0B3C85] focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Satuan Unit*</label>
              <input
                type="text"
                required
                placeholder="Pcs / Set / Box"
                value={satuan}
                onChange={e => setSatuan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-[#0B3C85] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Stok Fisik Awal*</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={stokRealtime}
                onChange={e => setStokRealtime(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-black focus:border-[#0B3C85] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Batas Stok Min*</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="2"
                value={stokMin}
                onChange={e => setStokMin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-red-600 focus:border-[#0B3C85] focus:outline-none"
              />
            </div>
          </div>

          {/* Grid 4: Multi-Harga Modal (HPP) & Offline Store */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              1. HARGA HPP MODAL & HARGA TOKO OFFLINE
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">HPP / Harga Beli Modal (Rp)*</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hargaBeli}
                  onChange={e => setHargaBeli(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Harga Jual Toko Offline (Rp)*</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hargaJual}
                  onChange={e => setHargaJual(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:border-[#0B3C85] focus:outline-none"
                />
                <span className="text-[10px] font-bold text-emerald-600 mt-1 block">
                  Margin Toko: +{marginPercentage}% ({formatIdr(marginStoreRp)})
                </span>
              </div>
            </div>
          </div>

          {/* Grid 5: Dedicated Marketplace Pricing (Shopee & Tokopedia/TikTok) */}
          <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-4">
            <span className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-orange-600" /> 2. HARGA DEDIKASI MARKETPLACE (SHOPEE & TOKOPEDIA/TIKTOK)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SHOPEE COLUMN */}
              <div className="bg-white p-3 rounded-xl border border-orange-300 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-orange-700 text-xs">🧡 Shopee Channel</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">P&T FEE :</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="8.5"
                        value={adminFeeShopeePercent}
                        onChange={e => setAdminFeeShopeePercent(e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-center font-mono font-bold border border-slate-300 rounded text-xs focus:outline-none focus:border-orange-500 bg-white"
                      />
                      <span className="text-[10px] font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Harga Shopee (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={hargaShopee}
                    onChange={e => setHargaShopee(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-orange-700 focus:bg-white focus:border-orange-600 focus:outline-none"
                  />
                </div>

                <div className="text-[10px] pt-1 border-t border-slate-100 space-y-0.5">
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Platform & Transaction Fee ({adminFeeShopeePercent || 0}%):</span>
                    <span className="font-mono text-red-600">-{formatIdr(adminShopeeRp)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900">
                    <span>Net Payout:</span>
                    <span className={`font-mono ${netProfitShopee > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatIdr(netProfitShopee)}</span>
                  </div>
                </div>
              </div>

              {/* TOKOPEDIA / TIKTOK SHOP COLUMN */}
              <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-800 text-xs">🟢 Tokopedia / TikTok</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">P&T FEE :</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="8"
                        value={adminFeeTokopediaPercent}
                        onChange={e => setAdminFeeTokopediaPercent(e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-center font-mono font-bold border border-slate-300 rounded text-xs focus:outline-none focus:border-emerald-600 bg-white"
                      />
                      <span className="text-[10px] font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Harga Tokopedia / TikTok (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={hargaTokopedia}
                    onChange={e => setHargaTokopedia(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="text-[10px] pt-1 border-t border-slate-100 space-y-0.5">
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Platform & Transaction Fee ({adminFeeTokopediaPercent || 0}%):</span>
                    <span className="font-mono text-red-600">-{formatIdr(adminTokopediaRp)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900">
                    <span>Net Payout:</span>
                    <span className={`font-mono ${netProfitTokopedia > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatIdr(netProfitTokopedia)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="px-6 py-2.5 rounded-xl bg-[#0B3C85] hover:bg-blue-900 disabled:bg-slate-400 text-white font-extrabold shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Simpan Sparepart
            </button>
          </div>
        </form>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanPartNumberSuccess}
        title="📷 Scan Barcode Dus Pabrik ke Form Input"
      />
    </div>
  );
};