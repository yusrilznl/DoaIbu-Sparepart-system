import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { isSuperAdminRole } from '../../types/auth';
import { Menu, LogOut, Bell, Search, Eye, EyeOff } from 'lucide-react';
import { DoaIbuLogo } from './DoaIbuLogo';
import { SparePart } from '../../types/inventory';
import { ItemDetailDrawer } from '../catalog/ItemDetailDrawer';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onSearchGlobal?: (query: string) => void;
  onNavigate?: (tab: string, partId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onSearchGlobal, onNavigate }) => {
  const { currentUser, logout, isFinancialPrivacyEnabled, toggleFinancialPrivacy } = useAuth();
  const { showToast } = useInventory();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [scannedQuickPart, setScannedQuickPart] = useState<SparePart | null>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Alert Stok Kritis',
      message: 'Sparepart FS1280 (Water Separator) sisa 4 Pcs di bawah batas minimum.',
      time: '10 menit lalu',
      unread: true,
      type: 'WARNING'
    },
    {
      id: 'notif-2',
      title: 'Percobaan Akses Non-Whitelist',
      message: '2 Percobaan login gagal terdeteksi dari IP 103.22.109.12.',
      time: '1 jam lalu',
      unread: true,
      type: 'SECURITY'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast('Seluruh pemberitahuan telah ditandai dibaca.', 'info');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchGlobal && globalSearch.trim()) {
      onSearchGlobal(globalSearch.trim());
    }
  };

  const handleTogglePrivacy = () => {
    toggleFinancialPrivacy();
    if (!isFinancialPrivacyEnabled) {
      showToast('Kerahasiaan Harga Ditingkatkan: Data HPP & Valuasi Uang disensor (Rp •••••••).', 'info');
    } else {
      showToast('Data Finansial & HPP Ditampilkan Penuh.', 'success');
    }
  };

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);

  // Professional avatar fallback URL
  const userPhotoUrl = currentUser?.email === 'yusrilznl@gmail.com'
    ? 'https://ui-avatars.com/api/?name=Yusril+Zainal&background=0B3C85&color=ffffff&bold=true&size=128'
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0B3C85&color=ffffff&bold=true&size=128`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-xs w-full max-w-full overflow-hidden">
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 w-full max-w-full overflow-hidden">
        {/* Left Side: Hamburger + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-xl text-slate-800 hover:bg-slate-100 transition shrink-0"
              title="Buka Navigasi Menu (Hamburger ☰)"
            >
              <Menu className="w-6 h-6 text-slate-900 font-black" />
            </button>
          )}

          <DoaIbuLogo size="sm" showSubtitle={true} />
        </div>

        {/* Middle: Global Search Input (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari part number / nama barang / lokasi rak..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#0B3C85] focus:outline-none transition"
            />
          </form>
        </div>

        {/* Right Side: Privacy Toggle + Bell + Profile Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Only: Super Admin Eye Privacy Toggle Button */}
          {isSuperAdminCategory && (
            <button
              onClick={handleTogglePrivacy}
              className={`hidden md:flex px-2.5 py-1.5 rounded-xl border font-extrabold text-xs items-center gap-1.5 transition ${
                isFinancialPrivacyEnabled
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-blue-50 text-[#0B3C85] border-blue-200 hover:bg-blue-100'
              }`}
              title={isFinancialPrivacyEnabled ? 'Tampilkan Data Finansial (HPP & Omset)' : 'Sembunyikan/Sensor Data Finansial (Rp •••••••)'}
            >
              {isFinancialPrivacyEnabled ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-700" />
                  <span className="text-[11px]">HPP Disensor</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-[#0B3C85]" />
                  <span className="text-[11px]">Finansial Terbuka</span>
                </>
              )}
            </button>
          )}

          {/* Desktop Only: Notifications Popover */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsNotificationOpen(prev => !prev)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              title="Pemberitahuan Sistem"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white font-mono font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <span className="font-extrabold text-xs">Pemberitahuan System</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] text-sky-300 font-bold">Tandai Dibaca</button>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-3 text-xs space-y-0.5">
                      <h5 className="font-black text-slate-900">{notif.title}</h5>
                      <p className="text-slate-600 font-medium">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar Profil User */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2 shrink-0">
            <div className="relative shrink-0">
              <img
                src={userPhotoUrl}
                alt={currentUser?.name || 'User Avatar'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-blue-600 shadow-xs object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" title="Status Online" />
            </div>

            <div className="hidden md:flex flex-col text-left justify-center">
              <span className="text-xs font-black text-slate-900 leading-tight truncate max-w-[140px]">
                {currentUser?.name}
              </span>
              <span className="text-[10px] font-bold text-[#0B3C85] leading-none mt-0.5 whitespace-nowrap">
                {currentUser?.roleTitle || 'Super Admin (Deputi Direktur)'}
              </span>
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={logout}
              className="hidden md:block p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Keluar dari Sistem (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {scannedQuickPart && (
        <ItemDetailDrawer
          part={scannedQuickPart}
          onClose={() => setScannedQuickPart(null)}
          onSelectForOutbound={(id) => {
            if (onNavigate) onNavigate('outbound', id);
            setScannedQuickPart(null);
          }}
          onSelectForInbound={(id) => {
            if (onNavigate) onNavigate('inbound', id);
            setScannedQuickPart(null);
          }}
        />
      )}
    </header>
  );
};
