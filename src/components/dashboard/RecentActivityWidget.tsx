import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminRole } from '../../types/auth';
import { 
  Activity, ArrowDownToLine, ArrowUpRight, History, 
  Clock, ShieldCheck, UserCheck, FileText, ChevronRight 
} from 'lucide-react';

interface RecentActivityWidgetProps {
  onNavigate: (tab: string) => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ onNavigate }) => {
  const { activityLogs, transactions } = useInventory();
  const { currentUser } = useAuth();

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);

  // Filter today's activity count
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayActivities = activityLogs.filter(l => l.timestamp.startsWith(todayStr));
  const recentActivities = activityLogs.slice(0, 6);
  const recentTransactions = transactions.slice(0, 5);

  const formatIdr = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(val || 0));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[10px] font-black uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-violet-600" /> Operational Transparency & Audit Trail
            </span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">{todayActivities.length} Aktivitas Hari Ini</span>
          </div>
          <h3 className="font-black text-lg sm:text-xl text-slate-900 mt-1">
            Log Aktivitas Operasional & Mutasi Terkini
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rekaman aktivitas user dan alur barang masuk/keluar yang tersinkronisasi otomatis dengan database
          </p>
        </div>

        {(isSuperAdminCategory || currentUser?.role === 'AUDITOR') && (
          <button
            onClick={() => onNavigate('audit')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            Buka Audit Trail Lengkap <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2 Column Layout: Recent Activity Logs & Recent Inbound/Outbound Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Column 1: Aktivitas Terkini (Security & User Action Logs) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-violet-600" /> Riwayat Aktivitas & Perubahan Data
            </h4>
            <span className="text-[10px] font-extrabold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
              Real-Time Log
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {recentActivities.length > 0 ? (
              recentActivities.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 mt-0.5 border border-violet-100">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-slate-900 text-xs truncate">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {log.timestamp.substring(11, 16) || log.timestamp.substring(0, 10)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                      {log.detail}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>User: <b className="text-slate-700">{log.userEmail.split('@')[0]}</b></span>
                      {log.modul && (
                        <span>• Modul: <b className="text-[#0B3C85]">{log.modul}</b></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Belum ada aktivitas yang tercatat hari ini.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Transaksi Mutasi Barang Terkini */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0B3C85]" /> Transaksi Mutasi Barang Terakhir
            </h4>
            <button
              onClick={() => onNavigate('reports')}
              className="text-[10px] font-extrabold text-[#0B3C85] hover:underline cursor-pointer"
            >
              Lihat Semua Transaksi →
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const isInbound = tx.jenisTransaksi === 'MUTASI_MASUK';
                return (
                  <div key={tx.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isInbound 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {isInbound ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono font-black text-xs text-slate-900 block truncate">
                          {tx.noTransaksi}
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {tx.tanggal} • {tx.salesChannel || tx.gudangAsal || 'Gudang Utama'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-black text-xs font-mono block ${isInbound ? 'text-emerald-700' : 'text-red-600'}`}>
                        {isInbound ? '+' : '-'}{tx.totalKuantitasItem || tx.totalJumlahTerima || 1} Pcs
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {tx.pelanggan || tx.salesPerson || 'Operasional'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Belum ada mutasi barang yang tercatat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
