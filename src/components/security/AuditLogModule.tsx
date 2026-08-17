import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import {
  Activity, Search, Filter, Download, User, Clock, Layers,
  ArrowUpRight, ArrowDownRight, ClipboardCheck, MapPin,
  ShieldCheck, UserPlus, Trash2, Settings, Eye
} from 'lucide-react';
import { ActivityLog, ActivityAction } from '../../types/inventory';

const ACTION_CONFIG: Record<ActivityAction, { label: string; color: string; icon: React.ReactNode }> = {
  TAMBAH_ITEM: { label: 'Tambah Item', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <Layers className="w-3.5 h-3.5" /> },
  EDIT_ITEM: { label: 'Edit Item', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <Settings className="w-3.5 h-3.5" /> },
  HAPUS_ITEM: { label: 'Hapus Item', color: 'text-red-700 bg-red-50 border-red-200', icon: <Trash2 className="w-3.5 h-3.5" /> },
  BARANG_MASUK: { label: 'Barang Masuk', color: 'text-sky-700 bg-sky-50 border-sky-200', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  BARANG_KELUAR: { label: 'Barang Keluar', color: 'text-orange-700 bg-orange-50 border-orange-200', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
  STOCK_OPNAME: { label: 'Stock Opname', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  MUTASI_LOKASI: { label: 'Mutasi Lokasi', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <MapPin className="w-3.5 h-3.5" /> },
  EDIT_PERMISSION: { label: 'Edit Permission', color: 'text-violet-700 bg-violet-50 border-violet-200', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  TAMBAH_USER: { label: 'Tambah User', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <UserPlus className="w-3.5 h-3.5" /> },
  HAPUS_USER: { label: 'Hapus User', color: 'text-red-700 bg-red-50 border-red-200', icon: <Trash2 className="w-3.5 h-3.5" /> },
  TOGGLE_STATUS_USER: { label: 'Toggle Status User', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <User className="w-3.5 h-3.5" /> },
};

const MODUL_OPTIONS = ['semua', 'catalog', 'inbound', 'outbound', 'opname', 'security', 'system'];

const SAMPLE_LOGS: ActivityLog[] = [
  {
    id: 'act-sample-1', timestamp: '2026-08-14 09:15:42',
    userId: 'wl-owner-yusril', userName: 'Yusril Zainal (Owner)', userEmail: 'yusrilznl@gmail.com', userRole: 'SUPER_ADMIN',
    action: 'TAMBAH_ITEM', targetId: 'part-001', targetLabel: 'LF3349', detail: 'Yusril Zainal (Owner) menambahkan item baru LF3349 (Filter Oil Kubota)', modul: 'catalog'
  },
  {
    id: 'act-sample-2', timestamp: '2026-08-14 10:02:18',
    userId: 'wl-2', userName: 'Budi Santoso', userEmail: 'admin.gudang@doaibusparepart.com', userRole: 'ADMIN_GUDANG',
    action: 'BARANG_MASUK', targetId: 'tx-001', targetLabel: 'SJ-IN-20260814-101', detail: 'Budi Santoso mencatat transaksi SJ-IN-20260814-101 (MUTASI_MASUK) — 3 item', modul: 'inbound'
  },
  {
    id: 'act-sample-3', timestamp: '2026-08-14 11:30:05',
    userId: 'wl-2', userName: 'Budi Santoso', userEmail: 'admin.gudang@doaibusparepart.com', userRole: 'ADMIN_GUDANG',
    action: 'EDIT_ITEM', targetId: 'part-002', targetLabel: 'W9501-45101', sebelum: JSON.stringify({ stok: 10 }), sesudah: JSON.stringify({ stok: 8 }),
    detail: 'Budi Santoso memperbarui item W9501-45101 — Stok: 10 → 8', modul: 'catalog'
  },
  {
    id: 'act-sample-4', timestamp: '2026-08-14 13:45:22',
    userId: 'wl-3', userName: 'Agus Subekti', userEmail: 'petugas.mgl@doaibusparepart.com', userRole: 'PETUGAS_GUDANG',
    action: 'STOCK_OPNAME', targetId: 'tx-op-002', targetLabel: 'TR-OP-20260814-205', detail: 'Agus Subekti melakukan Stock Opname TR-OP-20260814-205 — 15 item diperiksa, 2 selisih', modul: 'opname'
  },
  {
    id: 'act-sample-5', timestamp: '2026-08-14 14:10:00',
    userId: 'wl-2', userName: 'Budi Santoso', userEmail: 'admin.gudang@doaibusparepart.com', userRole: 'ADMIN_GUDANG',
    action: 'MUTASI_LOKASI', targetId: 'part-003', targetLabel: 'FS1280', sebelum: 'RAK-A1', sesudah: 'RAK-B3',
    detail: 'Budi Santoso memindahkan FS1280 dari RAK-A1 → RAK-B3 (5 PCS)', modul: 'catalog'
  },
  {
    id: 'act-sample-6', timestamp: '2026-08-14 15:22:33',
    userId: 'wl-owner-yusril', userName: 'Yusril Zainal (Owner)', userEmail: 'yusrilznl@gmail.com', userRole: 'SUPER_ADMIN',
    action: 'BARANG_KELUAR', targetId: 'tx-002', targetLabel: 'SJ-OUT-20260814-301', detail: 'Yusril Zainal (Owner) mencatat transaksi SJ-OUT-20260814-301 (MUTASI_KELUAR) — 2 item', modul: 'outbound'
  },
];

export const AuditLogModule: React.FC = () => {
  const { activityLogs } = useInventory();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('semua');
  const [filterModul, setFilterModul] = useState<string>('semua');
  const [filterUser, setFilterUser] = useState<string>('');

  // Merge live logs with samples (samples shown when no live logs exist)
  const allLogs = activityLogs.length > 0 ? activityLogs : SAMPLE_LOGS;

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchSearch = !searchQuery || [log.detail, log.userName, log.targetLabel || '', log.userEmail].some(
        f => f.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchAction = filterAction === 'semua' || log.action === filterAction;
      const matchModul = filterModul === 'semua' || log.modul === filterModul;
      const matchUser = !filterUser || log.userName.toLowerCase().includes(filterUser.toLowerCase());
      return matchSearch && matchAction && matchModul && matchUser;
    });
  }, [allLogs, searchQuery, filterAction, filterModul, filterUser]);

  const handleExportCSV = () => {
    const header = ['Timestamp', 'User', 'Email', 'Role', 'Aksi', 'Modul', 'Target', 'Detail', 'Sebelum', 'Sesudah'].join(',');
    const rows = filteredLogs.map(l =>
      [l.timestamp, l.userName, l.userEmail, l.userRole, l.action, l.modul, l.targetLabel || '-', `"${l.detail.replace(/"/g, '""')}"`, l.sebelum || '-', l.sesudah || '-'].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary stats
  const stats = useMemo(() => ({
    total: allLogs.length,
    today: allLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().substring(0, 10))).length,
    uniqueUsers: new Set(allLogs.map(l => l.userId)).size,
    highRisk: allLogs.filter(l => ['HAPUS_ITEM', 'HAPUS_USER', 'EDIT_PERMISSION'].includes(l.action)).length,
  }), [allLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-violet-600" /> Audit Trail — Activity Log Sistem
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Rekam jejak lengkap: SIAPA · KAPAN · APA yang diubah dalam sistem inventaris
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow transition shrink-0"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Log</div>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-sky-700">{stats.today}</div>
            <div className="text-[10px] font-bold text-sky-500 uppercase tracking-wider mt-0.5">Hari Ini</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-emerald-700">{stats.uniqueUsers}</div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">User Aktif</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-red-700">{stats.highRisk}</div>
            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-0.5">High Risk Action</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari detail, user, target..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black focus:border-[#0B3C85] focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black focus:border-[#0B3C85] focus:outline-none appearance-none"
            >
              <option value="semua">Semua Aksi</option>
              {(Object.keys(ACTION_CONFIG) as ActivityAction[]).map(a => (
                <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterModul}
              onChange={e => setFilterModul(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black focus:border-[#0B3C85] focus:outline-none appearance-none"
            >
              {MODUL_OPTIONS.map(m => (
                <option key={m} value={m}>{m === 'semua' ? 'Semua Modul' : m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter nama user..."
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black focus:border-[#0B3C85] focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-bold">
          Menampilkan {filteredLogs.length} dari {allLogs.length} log
          {activityLogs.length === 0 && <span className="text-amber-600 ml-2">· (Menampilkan contoh data demonstrasi)</span>}
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold whitespace-nowrap">
                <th className="py-3 px-4 min-w-[140px]">
                  <Clock className="w-3.5 h-3.5 inline mr-1" /> Waktu
                </th>
                <th className="py-3 px-4 min-w-[160px]">
                  <User className="w-3.5 h-3.5 inline mr-1" /> User
                </th>
                <th className="py-3 px-4 min-w-[130px]">Jenis Aksi</th>
                <th className="py-3 px-4 min-w-[80px]">Modul</th>
                <th className="py-3 px-4">Detail Aktivitas</th>
                <th className="py-3 px-4 min-w-[100px]">Sebelum → Sesudah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">
                    <Eye className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    Tidak ada log ditemukan sesuai filter
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-slate-700 bg-slate-50 border-slate-200', icon: null };
                  const isHighRisk = ['HAPUS_ITEM', 'HAPUS_USER', 'EDIT_PERMISSION'].includes(log.action);

                  let sebelumSesudah = '-';
                  if (log.sebelum && log.sesudah) {
                    try {
                      const b = JSON.parse(log.sebelum);
                      const a = JSON.parse(log.sesudah);
                      if (b.stok !== undefined) sebelumSesudah = `Stok: ${b.stok} → ${a.stok}`;
                      else sebelumSesudah = `${log.sebelum} → ${log.sesudah}`;
                    } catch {
                      sebelumSesudah = `${log.sebelum} → ${log.sesudah}`;
                    }
                  } else if (log.sebelum || log.sesudah) {
                    sebelumSesudah = `${log.sebelum || '-'} → ${log.sesudah || '-'}`;
                  }

                  return (
                    <tr key={log.id} className={`hover:bg-slate-50 transition ${isHighRisk ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-700 font-bold text-[11px]">{log.timestamp}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-slate-400 text-[10px] font-medium">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                          {isHighRisk && <span className="ml-1 text-red-600 font-black">⚠</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600 capitalize">
                          {log.modul}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-sm">
                        <div className="line-clamp-2">{log.detail}</div>
                        {log.targetLabel && (
                          <span className="font-mono font-black text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                            #{log.targetLabel}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[10px] font-mono text-slate-600 max-w-[120px]">
                        <div className="break-all">{sebelumSesudah}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
