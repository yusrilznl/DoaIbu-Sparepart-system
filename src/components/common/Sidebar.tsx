import React, { useState } from 'react';
import { LayoutDashboard, Package, ArrowUpRight, ArrowDownToLine, ClipboardCheck, FileText, X, ShieldCheck, LogOut, Eye, EyeOff, Activity } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminRole } from '../../types/auth';
import { DoaIbuLogo } from './DoaIbuLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { parts } = useInventory();
  const { currentUser, securityLogs, logout, isFinancialPrivacyEnabled, toggleFinancialPrivacy } = useAuth();

  const [mobileSearch, setMobileSearch] = useState('');

  const lowStockCount = parts.filter(p => p.stokRealtime <= p.stokMin).length;
  const suspiciousCount = securityLogs.filter(l => l.isSuspicious).length;

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'catalog', label: 'Master Sparepart & Rak', icon: Package, badge: parts.length },
    { id: 'outbound', label: 'Barang Keluar (Surat Jalan)', icon: ArrowUpRight },
    { id: 'inbound', label: 'Barang Masuk (Restock)', icon: ArrowDownToLine },
    { id: 'opname', label: 'Stock Opname & Scanner', icon: ClipboardCheck, badge: lowStockCount > 0 ? `${lowStockCount} Alert` : undefined, isBadgeWarning: lowStockCount > 0 },
    { id: 'reports', label: 'Laporan Mutasi & Keuangan', icon: FileText },
    { id: 'audit_log', label: 'Audit Trail & Activity Log', icon: Activity, isAuditOnly: true },
    { id: 'security', label: 'Keamanan & Akses Email', icon: ShieldCheck, badge: suspiciousCount > 0 ? `${suspiciousCount} Alert` : undefined, isBadgeWarning: suspiciousCount > 0, isSuperAdminOnly: true }
  ];

  // Dynamic Menu Filtering based on User Allowed Modules & Super Admin Category Check
  const menuItems = allMenuItems.filter(item => {
    // 1. Security tab is STRICTLY for Super Admin Category (Super Admin, Owner, Deputi Direktur)
    if (item.isSuperAdminOnly && !isSuperAdminCategory) {
      return false;
    }

    // 2. Audit tab is for Super Admin Category and AUDITOR
    if ((item as any).isAuditOnly && !isSuperAdminCategory && currentUser?.role !== 'AUDITOR') {
      return false;
    }

    // 3. Super Admin Category gets full access
    if (isSuperAdminCategory) {
      return true;
    }

    // 4. Filter allowed modules configured for other roles
    if (currentUser?.allowedModules && currentUser.allowedModules.length > 0) {
      return currentUser.allowedModules.includes(item.id) || (item.id === 'audit_log' && currentUser.allowedModules.includes('audit'));
    }

    return true;
  });

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Professional avatar fallback URL
  const userPhotoUrl = currentUser?.email === 'yusrilznl@gmail.com'
    ? 'https://ui-avatars.com/api/?name=Yusril+Zainal&background=0B3C85&color=ffffff&bold=true&size=128'
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0B3C85&color=ffffff&bold=true&size=128`;

  const renderContent = (
    <div className="flex flex-col justify-between h-full p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Mobile Header with Logo & Close Button */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <DoaIbuLogo size="sm" showSubtitle={true} />
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-200 shrink-0 mt-1"
              title="Tutup Menu (Close X)"
            >
              <X className="w-6 h-6 text-slate-900 font-extrabold" />
            </button>
          )}
        </div>

        {/* Mobile Super Admin Eye Privacy Toggle */}
        {isSuperAdminCategory && (
          <div className="lg:hidden">
            <button
              onClick={toggleFinancialPrivacy}
              className={`w-full px-3 py-2 rounded-xl border font-extrabold text-xs flex items-center justify-between transition ${
                isFinancialPrivacyEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-blue-50 text-[#0B3C85] border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isFinancialPrivacyEnabled ? <EyeOff className="w-4 h-4 text-amber-700" /> : <Eye className="w-4 h-4 text-[#0B3C85]" />}
                <span>{isFinancialPrivacyEnabled ? 'Hide Asset Value' : 'Show Asset Value'}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/60">Toggle</span>
            </button>
          </div>
        )}

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 block mb-2">
            MODUL MANAJEMEN GUDANG
          </span>

          <div className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'audit_log' && activeTab === 'audit');

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0B3C85] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-300' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ml-1 ${
                      isActive ? 'bg-white/20 text-white' :
                      item.isBadgeWarning ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info & Mobile User Logout Box */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        {/* Mobile User Profile & Logout Widget inside Drawer */}
        <div className="lg:hidden p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={userPhotoUrl}
              alt={currentUser?.name || 'User Avatar'}
              className="w-9 h-9 rounded-full border border-blue-600 object-cover shrink-0"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                {currentUser?.name}
              </span>
              <span className="text-[10px] font-bold text-[#0B3C85]">
                {currentUser?.roleTitle}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
            title="Keluar dari Sistem (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-[11px] font-extrabold text-black truncate">Doa Ibu Sparepart | PT Fardan Utama Niaga</p>
          <p className="text-[10px] font-semibold text-slate-400">Inventory System v3.0 — 5 Pilar</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="w-64 sm:w-72 bg-white border-r border-slate-200 shrink-0 hidden lg:block shadow-2xs sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto transition-all duration-300 z-30">
        {renderContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
            {renderContent}
          </div>
        </div>
      )}
    </>
  );
};
