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

  // Dimensi Fisik Produk
  const [beratGram, setBeratGram] = useState<string | number>(initialPart?.beratGram !== undefined && initialPart.beratGram !== 0 ? initialPart.beratGram : '');
  const [panjangCm, setPanjangCm] = useState<string | number>(initialPart?.panjangCm !== undefined && initialPart.panjangCm !== 0 ? initialPart.panjangCm : '');
  const [lebarCm, setLebarCm] = useState<string | number>(initialPart?.lebarCm !== undefined && initialPart.lebarCm !== 0 ? initialPart.lebarCm : '');
  const [tinggiCm, setTinggiCm] = useState<string | number>(initialPart?.tinggiCm !== undefined && initialPart.tinggiCm !== 0 ? initialPart.tinggiCm : '');

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

  const numHargaBeli = parseNum(hargaBeli);
  const numHargaShopee = parseNum(hargaShopee);
  const numHargaTokopedia = parseNum(hargaTokopedia);
  const numFeeShopee = parseNum(adminFeeShopeePercent);
  const numFeeTokopedia = parseNum(adminFeeTokopediaPercent);

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
      hargaJual: numHargaShopee || numHargaBeli,
      hargaShopee: numHargaShopee,
      adminFeeShopeePercent: numFeeShopee,
      hargaTokopedia: numHargaTokopedia,
      adminFeeTokopediaPercent: numFeeTokopedia,
      beratGram: parseNum(beratGram),
      panjangCm: parseNum(panjangCm),
      lebarCm: parseNum(lebarCm),
      tinggiCm: parseNum(tinggiCm),
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
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          setFotoProduk(compressedBase64);
          setIsCompressing(false);
          showToast('Foto berhasil dipilih & dikompresi!', 'info');
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
      />
      
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#0B3C85]" />
            {initialPart ? 'Edit Data Sparepart' : 'Tambah Sparepart Baru'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Grid 1: Part Number & Dimensi */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">Part Number / Kode Item*</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
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

            {/* Dimensi Fisik Box */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                DIMENSI & SPESIFIKASI FISIK
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Berat (Gram)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={beratGram}
                    onChange={e => setBeratGram(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-[#0B3C85] focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Panjang (cm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={panjangCm}
                    onChange={e => setPanjangCm(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-[#0B3C85] focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Lebar (cm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={lebarCm}
                    onChange={e => setLebarCm(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-[#0B3C85] focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tinggi (cm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={tinggiCm}
                    onChange={e => setTinggiCm(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-[#0B3C85] focus:outline-none text-center"
                  />
                </div>
              </div>
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
            <label className="block text-slate-700 font-bold">Foto Produk</label>
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
                <p className="text-[10px] text-slate-400">JPG, PNG (Otomatis dikompresi)</p>
              </div>
            </div>
          </div>

          {/* Grid 3: Lokasi Rak, Stok, Satuan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Lokasi Rak*</label>
              <input
                type="text"
                required
                placeholder="A-01-01"
                value={lokasiRak}
                onChange={e => setLokasiRak(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-[#0B3C85] focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Satuan*</label>
              <input
                type="text"
                required
                placeholder="Pcs / Set"
                value={satuan}
                onChange={e => setSatuan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-[#0B3C85] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Stok Fisik*</label>
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
              <label className="block text-slate-700 font-bold mb-1">Stok Min*</label>
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

          {/* Grid 4: Harga HPP Modal */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              1. HARGA HPP / MODAL
            </span>

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
          </div>

          {/* Grid 5: Dedicated Marketplace Pricing (Shopee & Tokopedia/TikTok) */}
          <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-4">
            <span className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-orange-600" /> 2. HARGA MARKETPLACE
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SHOPEE COLUMN */}
              <div className="bg-white p-3.5 rounded-xl border border-orange-300 shadow-2xs space-y-2">
                <span className="font-extrabold text-orange-700 text-xs block">Shopee</span>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga Jual Shopee (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={hargaShopee}
                    onChange={e => setHargaShopee(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-orange-700 focus:bg-white focus:border-orange-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* TOKOPEDIA / TIKTOK SHOP COLUMN */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                <span className="font-extrabold text-emerald-800 text-xs block">Tokopedia / TikTok</span>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga Jual Tokopedia / TikTok (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={hargaTokopedia}
                    onChange={e => setHargaTokopedia(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
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

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanPartNumberSuccess}
        title="Pindai Part Number (Barcode/Teks)"
      />
    </div>
  );
};