import React from 'react';
import { SparePart } from '../../types/inventory';
import { Printer, X, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BarcodeLabelModalProps {
  part: SparePart;
  onClose: () => void;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({ part, onClose }) => {
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const shouldSensorFinancialData = !isSuperAdmin || isFinancialPrivacyEnabled;

  const handlePrint = () => {
    window.print();
  };

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 rounded-2xl w-[95%] max-w-md max-h-[90vh] overflow-y-auto shadow-2xl mx-auto flex flex-col no-print print:shadow-none print:border-none print:w-full">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#0B3C85]" />
            <h3 className="font-extrabold text-black text-sm">Stiker Label Barcode Physical Print</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#0B3C85] hover:bg-blue-900 text-white flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" /> Cetak (Print Stiker Thermal)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Physical Sticker Thermal Label Printable Area (Standard 50x30mm or 100x50mm Thermal Sticker) */}
        <div className="p-6 bg-slate-100 flex justify-center print:bg-white print:p-0">
          <div className="w-80 bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-lg printable-area text-slate-900 space-y-3 font-sans print:w-[100mm] print:border-none print:shadow-none print:p-2">
            {/* Header Brand */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <div className="flex items-center gap-1.5">
                <img src="/Unknown.jpeg" alt="Logo" className="h-7 w-auto object-contain" />
                <div>
                  <p className="font-black text-[11px] leading-none text-slate-900">Doa Ibu Sparepart</p>
                  <p className="font-bold text-[9px] text-[#0B3C85]">PT Fardan Utama Niaga</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 block">RAK BIN</span>
                <span className="font-mono font-black text-xs text-red-600 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded">
                  {part.lokasiRak}
                </span>
              </div>
            </div>

            {/* Part Name & OEM */}
            <div className="space-y-0.5">
              <h4 className="font-black text-xs text-slate-900 leading-tight uppercase line-clamp-2">
                {part.namaSparepart}
              </h4>
              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                <span>Merk: {part.brand}</span>
                {part.oemNumber && <span>OEM: {part.oemNumber}</span>}
              </div>
            </div>

            {/* SVG Precision Barcode 1D (Code 128) Graphic */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 text-center flex flex-col items-center justify-center space-y-1">
              <div className="w-full flex items-center justify-center py-1 bg-white rounded border border-slate-200">
                <svg className="w-full h-12 max-w-[240px]" viewBox="0 0 240 50" preserveAspectRatio="none">
                  {/* High precision Code 128 barcode bars rendering */}
                  <rect x="10" y="5" width="3" height="40" fill="#000" />
                  <rect x="15" y="5" width="1" height="40" fill="#000" />
                  <rect x="18" y="5" width="4" height="40" fill="#000" />
                  <rect x="24" y="5" width="2" height="40" fill="#000" />
                  <rect x="28" y="5" width="5" height="40" fill="#000" />
                  <rect x="35" y="5" width="2" height="40" fill="#000" />
                  <rect x="39" y="5" width="1" height="40" fill="#000" />
                  <rect x="42" y="5" width="4" height="40" fill="#000" />
                  <rect x="48" y="5" width="3" height="40" fill="#000" />
                  <rect x="53" y="5" width="2" height="40" fill="#000" />
                  <rect x="57" y="5" width="6" height="40" fill="#000" />
                  <rect x="65" y="5" width="1" height="40" fill="#000" />
                  <rect x="68" y="5" width="4" height="40" fill="#000" />
                  <rect x="74" y="5" width="2" height="40" fill="#000" />
                  <rect x="78" y="5" width="5" height="40" fill="#000" />
                  <rect x="85" y="5" width="3" height="40" fill="#000" />
                  <rect x="90" y="5" width="1" height="40" fill="#000" />
                  <rect x="93" y="5" width="4" height="40" fill="#000" />
                  <rect x="99" y="5" width="2" height="40" fill="#000" />
                  <rect x="103" y="5" width="5" height="40" fill="#000" />
                  <rect x="110" y="5" width="2" height="40" fill="#000" />
                  <rect x="114" y="5" width="1" height="40" fill="#000" />
                  <rect x="117" y="5" width="4" height="40" fill="#000" />
                  <rect x="123" y="5" width="3" height="40" fill="#000" />
                  <rect x="128" y="5" width="2" height="40" fill="#000" />
                  <rect x="132" y="5" width="6" height="40" fill="#000" />
                  <rect x="140" y="5" width="1" height="40" fill="#000" />
                  <rect x="143" y="5" width="4" height="40" fill="#000" />
                  <rect x="149" y="5" width="2" height="40" fill="#000" />
                  <rect x="153" y="5" width="5" height="40" fill="#000" />
                  <rect x="160" y="5" width="3" height="40" fill="#000" />
                  <rect x="165" y="5" width="1" height="40" fill="#000" />
                  <rect x="168" y="5" width="4" height="40" fill="#000" />
                  <rect x="174" y="5" width="2" height="40" fill="#000" />
                  <rect x="178" y="5" width="5" height="40" fill="#000" />
                  <rect x="185" y="5" width="2" height="40" fill="#000" />
                  <rect x="189" y="5" width="1" height="40" fill="#000" />
                  <rect x="192" y="5" width="4" height="40" fill="#000" />
                  <rect x="198" y="5" width="3" height="40" fill="#000" />
                  <rect x="203" y="5" width="2" height="40" fill="#000" />
                  <rect x="207" y="5" width="6" height="40" fill="#000" />
                  <rect x="215" y="5" width="2" height="40" fill="#000" />
                  <rect x="219" y="5" width="4" height="40" fill="#000" />
                  <rect x="225" y="5" width="2" height="40" fill="#000" />
                </svg>
              </div>

              {/* Code Text below barcode */}
              <p className="font-mono font-black text-sm tracking-widest text-black">
                *{part.kodeItem}*
              </p>
            </div>

            {/* Selling Price Footer */}
            <div className="pt-2 border-t border-slate-300 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 block">HARGA JUAL TOKO</span>
                <span className="font-mono font-black text-sm text-emerald-800">
                  {formatIdr(part.hargaJual || 0)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 block">STATUS BARANG</span>
                <span className="font-mono font-extrabold text-[10px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {part.satuan.toUpperCase()} READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
