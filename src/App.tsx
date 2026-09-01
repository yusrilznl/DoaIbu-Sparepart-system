import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { KpiCards } from './components/dashboard/KpiCards';
import { LowStockWidget } from './components/dashboard/LowStockWidget';
import { MovementChart } from './components/dashboard/MovementChart';
import { CatalogTable } from './components/catalog/CatalogTable';
import { SalesTransactionForm } from './components/transactions/SalesTransactionForm';
import { InboundTransactionForm } from './components/transactions/InboundTransactionForm';
import { StockOpnameModule } from './components/opname/StockOpnameModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { SecurityMonitoring } from './components/security/SecurityMonitoring';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { ItemDetailDrawer } from './components/catalog/ItemDetailDrawer';
import { DraggableCameraFab } from './components/common/DraggableCameraFab';
import { SparePart } from './types/inventory';
import { isSuperAdminRole } from './types/auth';

const AppContent: React.FC = () => {
  const { isAuthenticated, currentUser, logActivity } = useAuth();
  const { parts, showToast } = useInventory();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [preselectedPartId, setPreselectedPartId] = useState<string | undefined>(undefined);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  const [isFabScannerOpen, setIsFabScannerOpen] = useState<boolean>(false);
  const [fabScannedPart, setFabScannedPart] = useState<SparePart | null>(null);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isSuperAdminCategory = isSuperAdminRole(currentUser?.role);

  const TAB_NAMES: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    catalog: 'Katalog Sparepart & Stok',
    outbound: 'Outbound / Goods Issue',
    inbound: 'Inbound / Goods Receipt',
    opname: 'Stock Opname & Scanner',
    reports: 'Laporan Mutasi & Stok',
    security: 'Keamanan & Whitelist User',
    audit_log: 'Audit Trail & Activity Log',
    audit: 'Audit Trail & Activity Log'
  };

  const handleNavigate = (tab: string, partId?: string) => {
    // 1. Security Check
    if (tab === 'security' && !isSuperAdminCategory) {
      showToast('Akses Ditolak: Modul Keamanan hanya dapat dikelola oleh Super Admin, Owner, dan Deputi Direktur.', 'error');
      setActiveTab('dashboard');
      return;
    }

    // 2. Audit Trail & Activity Log Check (SUPER_ADMIN, OWNER, DEPUTI_DIREKTUR, AUDITOR)
    if ((tab === 'audit_log' || tab === 'audit') && !isSuperAdminCategory && currentUser?.role !== 'AUDITOR') {
      showToast('Akses Ditolak: Modul Audit Log hanya untuk Super Admin, Owner, Deputi Direktur, dan Auditor.', 'error');
      setActiveTab('dashboard');
      return;
    }

    // 3. Module Permissions Check
    if (currentUser?.allowedModules && currentUser.allowedModules.length > 0 && !isSuperAdminCategory) {
      const isAllowed = currentUser.allowedModules.includes(tab) ||
        ((tab === 'audit_log' || tab === 'audit') && currentUser.allowedModules.includes('audit'));

      if (!isAllowed) {
        showToast(`Akses Ditolak: Anda tidak memiliki izin untuk membuka modul ${tab}.`, 'error');
        setActiveTab('dashboard');
        return;
      }
    }

    if (activeTab !== tab) {
      logActivity(
        `Navigasi Menu: ${TAB_NAMES[tab] || tab}`,
        `User ${currentUser?.name} (${currentUser?.roleTitle}) membuka modul ${TAB_NAMES[tab] || tab}`
      );
    }

    setActiveTab(tab);
    setPreselectedPartId(partId);
    setIsSidebarOpenMobile(false);
  };

  const handleSelectForOutbound = (partId: string) => {
    setPreselectedPartId(partId);
    setActiveTab('outbound');
    setIsSidebarOpenMobile(false);
  };

  const handleSelectForInbound = (partId: string) => {
    setPreselectedPartId(partId);
    setActiveTab('inbound');
    setIsSidebarOpenMobile(false);
  };

  const handleFabScanSuccess = (scannedCode: string) => {
    const matchedPart = parts.find(p =>
      p.kodeItem.toLowerCase() === scannedCode.toLowerCase() ||
      (p.oemNumber && p.oemNumber.toLowerCase() === scannedCode.toLowerCase())
    );

    if (matchedPart) {
      setFabScannedPart(matchedPart);
      setIsFabScannerOpen(false);
      showToast(`📦 Scan Kilat: ${matchedPart.kodeItem} (${matchedPart.namaSparepart}) terdeteksi!`, 'success');
    } else {
      showToast(`⚠️ Barcode "${scannedCode}" tidak ditemukan di database!`, 'error');
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 text-slate-900 font-sans flex flex-col relative">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
        onSearchGlobal={(query) => { if (query) handleNavigate('catalog'); }}
        onNavigate={handleNavigate}
      />

      <div className="flex flex-1 w-full max-w-full items-start">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleNavigate}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6 min-w-0">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <KpiCards onNavigate={handleNavigate} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><MovementChart /></div>
                <div><LowStockWidget onRestockClick={handleSelectForInbound} /></div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <CatalogTable
              onSelectForOutbound={handleSelectForOutbound}
              onSelectForInbound={handleSelectForInbound}
            />
          )}

          {activeTab === 'outbound' && <SalesTransactionForm preselectedPartId={preselectedPartId} />}
          {activeTab === 'inbound' && <InboundTransactionForm preselectedPartId={preselectedPartId} />}
          {activeTab === 'opname' && <StockOpnameModule />}
          {activeTab === 'reports' && <ReportsModule />}

          {/* Module Security Center (Tab 1: Whitelist & Matriks Akses) */}
          {activeTab === 'security' && isSuperAdminCategory && (
            <SecurityMonitoring defaultTab="WHITELIST" />
          )}

          {/* Module Audit Trail & Activity Log (Tab 3: Security Audit Logs) */}
          {(activeTab === 'audit_log' || activeTab === 'audit') && (isSuperAdminCategory || currentUser?.role === 'AUDITOR') && (
            <SecurityMonitoring defaultTab="AUDIT_LOGS" />
          )}
        </main>
      </div>

      <DraggableCameraFab onClick={() => setIsFabScannerOpen(true)} />

      <BarcodeScannerModal
        isOpen={isFabScannerOpen}
        onClose={() => setIsFabScannerOpen(false)}
        onScanSuccess={handleFabScanSuccess}
        onUnrecognizedCode={(code) => {
          handleNavigate('catalog');
          showToast(`💡 Kode item "${code}" belum terdaftar. Menampilkan Katalog untuk menambah item baru.`, 'info');
        }}
        title="📷 Pemindai Barcode Kilat Kamera (FAB Scan)"
      />

      {fabScannedPart && (
        <ItemDetailDrawer
          part={fabScannedPart}
          onClose={() => setFabScannedPart(null)}
          onSelectForOutbound={(id) => { handleNavigate('outbound', id); setFabScannedPart(null); }}
          onSelectForInbound={(id) => { handleNavigate('inbound', id); setFabScannedPart(null); }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <AppContent />
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;
