import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { ShieldCheck, UserPlus, AlertOctagon, Activity, Trash2, Power, Search, KeyRound, CheckCircle2, Lock, Copy, SlidersHorizontal, UserCheck } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { WhitelistRecord } from '../../types/security';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini sesuai (supabase atau supabaseClient)

interface ModuleDef {
  id: string;
  label: string;
  isSuperAdminOnly?: boolean;
}

const MODULE_LIST: ModuleDef[] = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'catalog', label: 'Master Sparepart & Rak' },
  { id: 'outbound', label: 'Barang Keluar (Surat Jalan)' },
  { id: 'inbound', label: 'Barang Masuk (Restock)' },
  { id: 'opname', label: 'Stock Opname & Scanner' },
  { id: 'reports', label: 'Laporan Mutasi & Audit Log' },
  { id: 'security', label: 'Keamanan & Akses Email (Khusus Super Admin)', isSuperAdminOnly: true }
];

export const SecurityMonitoring: React.FC = () => {
  const { whitelistUsers, securityLogs, activeOtps, addWhitelistUser, toggleUserStatus, deleteWhitelistUser, updateUserPermissions } = useAuth();
  const { showToast } = useInventory();

  const [activeTab, setActiveTab] = useState<'WHITELIST' | 'AUDIT_LOGS' | 'OTP_DESK'>('WHITELIST');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Whitelist Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('ADMIN_GUDANG');
  const [newRoleTitle, setNewRoleTitle] = useState<string>('Head Stock Admin Gudang');
  const [newPassword, setNewPassword] = useState<string>('password123');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Permission Matrix Modal state
  const [permissionTargetUser, setPermissionTargetUser] = useState<WhitelistRecord | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Summary Metrics
  const totalActiveUsers = whitelistUsers.filter(u => u.status === 'AKTIF').length;
  const successfulLoginsCount = securityLogs.filter(l => l.status === 'SUCCESS').length;
  const suspiciousAttemptsCount = securityLogs.filter(l => l.isSuspicious).length;

  // 🚀 FUNGSI SIMPAN TERHUBUNG LANGSUNG KE SUPABASE
  const handleCreateWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) {
      showToast('Email dan Nama User wajib diisi!', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const emailFormatted = newEmail.trim().toLowerCase();

      // 1. Simpan ke Database Supabase (Tabel 'users')
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: emailFormatted,
            full_name: newName.trim(),
            role: newRole, // e.g. 'SUPER_ADMIN', 'OWNER', 'DEPUTI_DIREKTUR', dll.
          }
        ])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // 2. Update state lokal di AuthContext jika ada
      if (addWhitelistUser) {
        addWhitelistUser({
          email: emailFormatted,
          name: newName.trim(),
          role: newRole,
          roleTitle: newRoleTitle,
          status: 'AKTIF',
          passwordHash: newPassword || 'password123'
        });
      }

      showToast(`Email "${emailFormatted}" berhasil disimpan ke Supabase!`, 'success');
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewName('');
    } catch (err: any) {
      console.error('Error inserting user to Supabase:', err);
      showToast(`Gagal menyimpan ke Supabase: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: string) => {
    toggleUserStatus(id);
    showToast(`Akses login ${name} diubah menjadi ${currentStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF'}.`, 'info');
  };

  const handleDeleteWhitelist = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin MENCABUT HAK AKSES (Revoke) email "${name}" dari sistem?`)) {
      deleteWhitelistUser(id);
      showToast(`Izin email ${name} resmi dicabut!`, 'error');
    }
  };

  const handleCopyOtp = (code: string, user: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Kode OTP (${code}) untuk ${user} berhasil disalin!`, 'success');
  };

  const handleOpenPermissionsModal = (user: WhitelistRecord) => {
    setPermissionTargetUser(user);
    setSelectedModules(user.allowedModules || ['dashboard', 'catalog', 'opname']);
  };

  const handleToggleModuleCheck = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter(m => m !== moduleId));
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  const handleSavePermissions = () => {
    if (!permissionTargetUser) return;
    updateUserPermissions(permissionTargetUser.id, selectedModules);
    showToast(`Hak Akses Menu untuk "${permissionTargetUser.name}" berhasil diperbarui!`, 'success');
    setPermissionTargetUser(null);
  };

  const filteredWhitelist = whitelistUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = securityLogs.filter(l =>
    l.emailAttempted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.ipAddress.includes(searchQuery) ||
    l.statusLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOtps = activeOtps.filter(o =>
    o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.otpCode.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-black flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0B3C85]" /> Security Center & Matriks Hak Akses User
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kontrol penuh hak akses menu & monitoring keamanan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
          >
            <UserPlus className="w-4 h-4 text-sky-300" /> + Tambah Email Whitelist
          </button>
        </div>
      </div>

      {/* KPI Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total User Whitelist</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalActiveUsers} User Aktif</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Login Berhasil (OTP)</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{successfulLoginsCount} Sesi Resmi</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs border-l-4 border-l-red-600">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Percobaan Akses Ilegal</p>
            <p className="text-2xl font-black text-red-700 mt-0.5">{suspiciousAttemptsCount} Alert Dideteksi</p>
          </div>
        </div>
      </div>

      {/* Subtab Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab('WHITELIST')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'WHITELIST'
                ? 'bg-[#0B3C85] text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Kelola Whitelist & Hak Akses ({whitelistUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('OTP_DESK')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'OTP_DESK'
                ? 'bg-[#0B3C85] text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-400" /> Desk Bantuan OTP ({activeOtps.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-[#0B3C85] text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <Activity className="w-4 h-4" /> Security Audit Log ({securityLogs.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari user / IP / OTP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-black focus:border-[#0B3C85] focus:outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Whitelist Email Management & Permissions Table */}
      {activeTab === 'WHITELIST' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama User</th>
                  <th className="py-3 px-4">Email Terdaftar (Whitelist)</th>
                  <th className="py-3 px-4">Role & Jabatan</th>
                  <th className="py-3 px-4 text-center">Modul Diizinkan</th>
                  <th className="py-3 px-4 text-center">Status Sesi</th>
                  <th className="py-3 px-4 text-center">Aksi & Matriks Izin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                {filteredWhitelist.map((user, index) => {
                  const allowedCount = user.allowedModules ? user.allowedModules.length : 3;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-400 font-bold">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-black">{user.name}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-[#0B3C85]">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block">{user.roleTitle}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{user.role}</span>
                      </td>
                      <td className="py-3 px-4 text-center min-w-[140px] whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono font-extrabold text-[11px] rounded-lg border border-slate-300 inline-block whitespace-nowrap">
                          {allowedCount} Modul Menu
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          user.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0B3C85] border border-blue-200 hover:bg-[#0B3C85] hover:text-white font-extrabold text-xs flex items-center gap-1 transition shadow-2xs"
                            title="Atur Hak Akses Menu User"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Atur Izin
                          </button>

                          <button
                            onClick={() => handleToggleStatus(user.id, user.name, user.status)}
                            className={`p-1.5 rounded-lg border transition ${
                              user.status === 'AKTIF'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            }`}
                            title={user.status === 'AKTIF' ? 'Nonaktifkan Izin Login' : 'Aktifkan Izin Login'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteWhitelist(user.id, user.name)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition"
                            title="Hapus / Cabut Hak Akses (Revoke)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Desk Bantuan OTP (Active OTP Logs for Owner) */}
      {activeTab === 'OTP_DESK' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-black text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0B3C85]" /> Monitoring Desk Bantuan OTP Login Staf
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Daftar kode OTP yang sedang dikirimkan/aktif. Owner dapat memberikan kode ini jika staf gudang meminta bantuan login.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Email Staf Gudang</th>
                  <th className="py-3 px-4 text-center">Kode OTP Aktif</th>
                  <th className="py-3 px-4">Waktu Buat</th>
                  <th className="py-3 px-4">Waktu Kadaluarsa</th>
                  <th className="py-3 px-4 text-center">Status OTP</th>
                  <th className="py-3 px-4 text-center">Salin Kode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                {filteredOtps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                      Belum ada permintaan OTP aktif saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredOtps.map(otp => (
                    <tr key={otp.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-black">{otp.userName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0B3C85]">{otp.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-black text-base tracking-widest text-[#0B3C85] bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg inline-block">
                          {otp.otpCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{otp.createdAt}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{otp.expiresAt}</td>
                      <td className="py-3 px-4 text-center">
                        {otp.isUsed ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-lg border">
                            Sudah Digunakan
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300">
                            ✓ Aktif Digunakan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleCopyOtp(otp.otpCode, otp.userName)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 mx-auto transition shadow-2xs"
                        >
                          <Copy className="w-3.5 h-3.5" /> Salin OTP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit Logs & Intrusion Monitor */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Waktu & Tanggal</th>
                  <th className="py-3 px-4">Email yang Dicoba</th>
                  <th className="py-3 px-4">Alamat IP (Client)</th>
                  <th className="py-3 px-4">Perangkat & Browser</th>
                  <th className="py-3 px-4 text-center">Status Login</th>
                  <th className="py-3 px-4">Catatan Deteksi System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                {filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    className={`transition ${
                      log.isSuspicious ? 'bg-red-50/70 border-l-4 border-l-red-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{log.timestamp}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-black">{log.emailAttempted}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{log.deviceInfo}</td>
                    <td className="py-3 px-4 text-center">
                      {log.isSuspicious ? (
                        <span className="px-2.5 py-1 bg-red-600 text-white font-black text-[10px] rounded-lg shadow-2xs inline-flex items-center gap-1 animate-pulse">
                          🚨 PERCOBAAN PEMBOBOLAN / SUSPICIOUS
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300">
                          ✓ {log.statusLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Whitelist User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-[95%] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 mx-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-black text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0B3C85]" /> Tambah Email Whitelist Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWhitelist} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap User*</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Rudi Hermawan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black font-bold focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Resmi Terdaftar*</label>
                <input
                  type="email"
                  required
                  placeholder="nama@doaibusparepart.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black font-bold focus:border-[#0B3C85] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Role Akses*</label>
                <select
                  value={newRole}
                  onChange={e => {
                    const role = e.target.value as UserRole;
                    setNewRole(role);
                    if (role === 'SUPER_ADMIN') setNewRoleTitle('Super Admin');
                    else if (role === 'OWNER') setNewRoleTitle('Owner / Pemilik Toko');
                    else if (role === 'DEPUTI_DIREKTUR') setNewRoleTitle('Deputi Direktur');
                    else if (role === 'ADMIN_GUDANG') setNewRoleTitle('Head Stock Admin Gudang');
                    else if (role === 'PETUGAS_GUDANG') setNewRoleTitle('Petugas Stock Opname & Scan');
                    else setNewRoleTitle('Auditor System');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black font-bold focus:border-[#0B3C85] focus:outline-none"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh Super Admin)</option>
                  <option value="OWNER">OWNER (Owner)</option>
                  <option value="DEPUTI_DIREKTUR">DEPUTI_DIREKTUR (Deputi Direktur)</option>
                  <option value="ADMIN_GUDANG">ADMIN_GUDANG (Kelola Katalog & Mutasi)</option>
                  <option value="PETUGAS_GUDANG">PETUGAS_GUDANG (Stock Opname & Scan Only)</option>
                  <option value="AUDITOR">AUDITOR (Read-Only Audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Default Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-black font-mono font-bold focus:border-[#0B3C85] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold shadow transition disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Whitelist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Permission Matrix (Atur Hak Akses Menu) */}
      {permissionTargetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 mx-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-black text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#0B3C85]" /> Pengaturan Izin Akses Menu
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Target User: <strong>{permissionTargetUser.name}</strong> ({permissionTargetUser.email})
                </p>
              </div>
              <button
                onClick={() => setPermissionTargetUser(null)}
                className="text-slate-400 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                CENTANG MODUL MENU YANG DIIZINKAN UNTUK DIAKSES:
              </span>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                {MODULE_LIST.map(mod => {
                  const isChecked = selectedModules.includes(mod.id);
                  const isLocked = mod.isSuperAdminOnly && permissionTargetUser.role !== 'SUPER_ADMIN';

                  return (
                    <label
                      key={mod.id}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                        isLocked ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={isLocked}
                          checked={isChecked}
                          onChange={() => handleToggleModuleCheck(mod.id)}
                          className="w-4 h-4 text-[#0B3C85] rounded border-slate-300 focus:ring-[#0B3C85]"
                        />
                        <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                      </div>

                      {isLocked && (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Terkuak Khusus Super Admin
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPermissionTargetUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs shadow transition"
              >
                Simpan Matriks Izin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};