import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Transaction } from '../../types/inventory';
import { FileText, Search, Filter, Printer, FileSpreadsheet, Truck, PackagePlus } from 'lucide-react';
import { InvoiceModal } from '../transactions/InvoiceModal';

export const ReportsModule: React.FC = () => {
  const { transactions, showToast } = useInventory();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [printingTransaction, setPrintingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.noTransaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.pelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.salesPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.items.some(i => i.kodeItem.toLowerCase().includes(searchQuery.toLowerCase()) || i.namaSparepart.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || tx.jenisTransaksi === selectedType;

    return matchesSearch && matchesType;
  });

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) {
      showToast('Tidak ada data laporan untuk diexport!', 'error');
      return;
    }

    const headers = ['No Transaksi', 'Tanggal', 'Jenis Transaksi', 'Supplier / Destination', 'Gudang', 'Total Item', 'Total Qty', 'Petugas', 'Catatan'];
    const rows = filteredTransactions.map(tx => [
      `"${tx.noTransaksi}"`,
      `"${tx.tanggal}"`,
      `"${tx.jenisTransaksi}"`,
      `"${tx.pelanggan.replace(/"/g, '""')}"`,
      `"${tx.gudangAsal}"`,
      tx.totalKuantitasItem,
      tx.totalJumlahTerima,
      `"${tx.salesPerson}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Mutasi_DoaIbu_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Laporan mutasi (${filteredTransactions.length} transaksi) berhasil diexport ke CSV!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0B3C85]" /> Laporan Mutasi & Audit Trail Transaksi
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kearsipan lengkap penerimaan barang masuk & keluar
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Excel / CSV
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari No Surat Jalan / supplier / petugas / kode item..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-transparent font-extrabold text-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Mutasi</option>
            <option value="MUTASI_KELUAR">📤 Barang Keluar (Surat Jalan)</option>
            <option value="MUTASI_MASUK">📦 Barang Masuk (Restock)</option>
            <option value="STOCK_OPNAME">📋 Stock Opname</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">No Transaksi / Surat Jalan</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4 text-center">Jenis Mutasi</th>
                <th className="py-3 px-4">Supplier / Tujuan Site</th>
                <th className="py-3 px-4 text-center">Total Item & Qty</th>
                <th className="py-3 px-4">Petugas Gudang</th>
                <th className="py-3 px-4 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                    Belum ada riwayat transaksi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isInbound = tx.jenisTransaksi === 'MUTASI_MASUK';
                  const isOpname = tx.jenisTransaksi === 'STOCK_OPNAME';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-black text-black">{tx.noTransaksi}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{tx.tanggal}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                          isOpname ? 'bg-amber-100 text-amber-800' :
                          isInbound ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isOpname ? '📋 Opname' : isInbound ? '📦 Restock Masuk' : '📤 Surat Jalan Keluar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.pelanggan}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {tx.totalKuantitasItem} Jenis ({tx.totalJumlahTerima} Pcs)
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{tx.salesPerson}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setPrintingTransaction(tx)}
                          className="px-3 py-1.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 mx-auto shadow-2xs transition"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Surat Jalan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Printable Modal */}
      {printingTransaction && (
        <InvoiceModal
          transaction={printingTransaction}
          onClose={() => setPrintingTransaction(null)}
        />
      )}
    </div>
  );
};
