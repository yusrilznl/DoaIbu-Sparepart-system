import React from 'react';
import { Transaction } from '../../types/inventory';
import { useAuth } from '../../context/AuthContext';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { DoaIbuLogo } from '../common/DoaIbuLogo';

interface InvoiceModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, onClose }) => {
  const { currentUser, isFinancialPrivacyEnabled } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const shouldSensorFinancialData = !isSuperAdmin || isFinancialPrivacyEnabled;

  const handlePrint = () => {
    window.print();
  };

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const isInbound = transaction.jenisTransaksi === 'MUTASI_MASUK';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 rounded-2xl w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-6 mx-auto animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
        
        {/* Modal Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0B3C85]" />
            <h3 className="font-extrabold text-black text-sm sm:text-base">Pratinjau Dokumen Resmi Surat Jalan</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" /> Cetak Surat Jalan (PDF / Print)
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SURAT JALAN PAPER AREA */}
        <div className="p-4 sm:p-6 border border-slate-300 rounded-2xl bg-white space-y-5 text-slate-900 font-sans printable-area print:border-none print:p-0">
          {/* Header Kop Surat */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-4 gap-3">
            <DoaIbuLogo size="md" showSubtitle={true} />
            <div className="text-left sm:text-right">
              <h2 className="font-black text-lg sm:text-xl text-[#0B3C85] uppercase tracking-wider">
                {isInbound ? 'SURAT PENERIMAAN BARANG' : 'SURAT JALAN / PENGIRIMAN'}
              </h2>
              <p className="font-mono font-extrabold text-sm text-slate-900 mt-0.5">NO: {transaction.noTransaksi}</p>
            </div>
          </div>

          {/* Document Info Stack (1-column on mobile HP, 2-column on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">INFO TRANSAKSI</p>
              <p><span className="text-slate-600">Tanggal:</span> <strong className="font-mono">{transaction.tanggal}</strong></p>
              <p><span className="text-slate-600">Jenis Mutasi:</span> <strong className="text-slate-900">{transaction.jenisTransaksi}</strong></p>
              {transaction.salesChannel && (
                <p><span className="text-slate-600">Channel Penjualan:</span> <strong className="text-[#0B3C85]">{transaction.salesChannel}</strong></p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">INFO PIHAK TERKAIT</p>
              <p><span className="text-slate-600">Gudang Asal/Tujuan:</span> <strong className="text-slate-900">{transaction.gudangAsal}</strong></p>
              <p><span className="text-slate-600">Supplier / Customer:</span> <strong className="text-slate-900">{transaction.pelanggan}</strong></p>
              <p><span className="text-slate-600">Petugas Gudang:</span> <strong className="text-slate-900">{transaction.salesPerson}</strong></p>
            </div>
          </div>

          {/* Items Table Wrapped in Horizontal Scroll Box */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Kode Item</th>
                  <th className="py-2.5 px-3">Nama Sparepart</th>
                  <th className="py-2.5 px-3">Rak Bin</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Qty</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right">Total Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                {transaction.items.map((item, idx) => {
                  const qty = item.jumlahKirim || item.jumlahTerima || 1;
                  const price = item.hargaJual || item.hargaBeli || 0;
                  const subtotal = qty * price;

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-400 whitespace-nowrap">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-black whitespace-nowrap">{item.kodeItem}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.namaSparepart}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-600 whitespace-nowrap">{item.lokasiRak}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 whitespace-nowrap">{qty} {item.satuan}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {formatIdr(price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {formatIdr(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures Area */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-bold border-t border-slate-200">
            <div>
              <p className="text-slate-500 font-semibold mb-12">Petugas Gudang / Pengirim</p>
              <p className="font-extrabold text-slate-900 underline">( {transaction.salesPerson} )</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-12">Penerima Barang / Customer</p>
              <p className="font-extrabold text-slate-900 underline">( ............................................ )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
