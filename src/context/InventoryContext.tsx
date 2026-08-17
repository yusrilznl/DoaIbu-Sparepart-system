import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SparePart, Transaction, OpnameItem, ActivityLog, ActivityAction, DiscrepancyLog, LocationMutation } from '../types/inventory';
import { INITIAL_SPAREPARTS, INITIAL_TRANSACTIONS } from '../mock/initialData';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  totalRak: number;
}

const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: 'w-1', code: 'MGL-01', name: 'Gudang Utama Magelang', address: 'Jl. Raya Magelang - Jogja KM 7, Secang, Magelang', totalRak: 12 },
  { id: 'w-2', code: 'SMG-02', name: 'Gudang Transit Semarang', address: 'Kawasan Industri Terboyo Blok B-12, Semarang', totalRak: 6 },
  { id: 'w-3', code: 'BRN-03', name: 'Gudang Site Mining Borneo', address: 'Site Project Tambang Sangatta, East Kalimantan', totalRak: 8 }
];

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface InventoryContextType {
  parts: SparePart[];
  warehouses: Warehouse[];
  transactions: Transaction[];
  activityLogs: ActivityLog[];
  discrepancyLogs: DiscrepancyLog[];
  locationMutations: LocationMutation[];
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  saveSparePart: (partData: Omit<SparePart, 'id' | 'terakhirDiupdate'>, existingId?: string) => SparePart;
  addSparePart: (partData: Omit<SparePart, 'id'>) => SparePart;
  updateSparePart: (id: string, partData: Omit<SparePart, 'id'>) => SparePart;
  deleteSparePart: (id: string) => void;
  saveTransaction: (transactionData: Omit<Transaction, 'id' | 'createdDate'>) => Transaction;
  recordStockOpname: (opnameItems: OpnameItem[], warehouseName: string, notes?: string) => void;
  recordLocationMutation: (mutation: Omit<LocationMutation, 'id' | 'timestamp'>) => void;
  logActivity: (action: ActivityAction, detail: string, opts?: { targetId?: string; targetLabel?: string; sebelum?: string; sesudah?: string; modul?: string }) => void;
  getLowStockParts: () => SparePart[];
  getOverstockParts: () => SparePart[];
}

const LOCAL_STORAGE_KEY_PARTS = 'optipart_doaibu_parts_v5';
const LOCAL_STORAGE_KEY_TX = 'optipart_doaibu_tx_v5';
const LOCAL_STORAGE_KEY_ACTIVITY = 'optipart_doaibu_activity_v5';
const LOCAL_STORAGE_KEY_DISCREPANCY = 'optipart_doaibu_discrepancy_v5';
const LOCAL_STORAGE_KEY_LOCATION = 'optipart_doaibu_location_v5';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// 1. Mapping dari Supabase DB (snake_case) -> React State (camelCase)
const mapDbToSparePart = (row: any): SparePart => ({
  id: String(row.id),
  kodeItem: row.kode_item || row.kodeItem || '',
  namaSparepart: row.nama_sparepart || row.namaSparepart || '',
  brand: row.brand || 'GENUINE',
  kategori: row.kategori || row.kategori_mesin || row.kategoriMesin || 'Umum',
  lokasiRak: row.lokasi_rak || row.lokasiRak || '-',
  stokRealtime: Number(row.stok_realtime ?? row.stokRealtime ?? 0),
  stokMin: Number(row.stok_min ?? row.stokMin ?? 0),
  stokMax: row.stok_max !== undefined ? Number(row.stok_max) : (row.stokMax !== undefined ? Number(row.stokMax) : undefined),
  satuan: row.satuan || 'PCS',
  hargaBeli: Number(row.harga_beli ?? row.hargaBeli ?? 0),
  hargaJual: Number(row.harga_jual ?? row.hargaJual ?? 0),
  nomorPartPabrikan: row.nomor_part_pabrikan || row.nomorPartPabrikan,
  terakhirDiupdate: row.terakhir_diupdate || row.terakhirDiupdate || new Date().toISOString(),
  deskripsi: row.deskripsi,
  status: row.status,
  gambar: Array.isArray(row.gambar)
    ? row.gambar
    : (row.gambar ? JSON.parse(row.gambar) : []),
} as unknown as SparePart);

// 2. Mapping dari React State (camelCase) -> Supabase DB (snake_case)
// Mapping dari React State (camelCase) -> Supabase DB (snake_case)
const mapSparePartToDb = (part: any) => {
  const dbPayload: any = {
    kode_item: part.kodeItem,
    nama_sparepart: part.namaSparepart,
    brand: part.brand,
    kategori: part.kategori,
    lokasi_rak: part.lokasiRak,
    stok_realtime: part.stokRealtime,
    stok_min: part.stokMin,
    stok_max: part.stokMax,
    satuan: part.satuan,
    harga_beli: part.hargaBeli,
    harga_jual: part.hargaJual,
    nomor_part_pabrikan: part.nomorPartPabrikan,
    terakhir_diupdate: part.terakhirDiupdate,
    deskripsi: part.deskripsi,
    status: part.status,
    gambar: part.gambar || [],
  };

  // Hanya sertakan ID jika berupa angka/UUID murni (bukan ID temporer 'part-...')
  if (part.id && !String(part.id).startsWith('part-')) {
    dbPayload.id = part.id;
  }

  return dbPayload;
};

const InventoryProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const [parts, setParts] = useState<SparePart[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load parts: Utamakan Supabase agar data selalu terbaru

  useEffect(() => {
    const loadParts = async () => {
      // 1. Ambil data dari LocalStorage perangkat ini (jika ada)
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PARTS);
      let localData: SparePart[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localData = parsed;
          }
        } catch (e) {
          console.error('Failed to parse parts from localStorage', e);
        }
      }

      // 2. Utamakan ambil data dari tabel Supabase 'products'
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          const mappedParts = data.map(mapDbToSparePart);
          setParts(mappedParts);
          localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(mappedParts));
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Supabase fetch failed:', e);
      }

      // 3. Jika Supabase masih kosong, gunakan data lokal (agar data kamu tidak hilang)
      if (localData.length > 0) {
        setParts(localData);
      } else {
        // Jika di mana-mana kosong total, baru gunakan mock data
        setParts(INITIAL_SPAREPARTS);
        localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(INITIAL_SPAREPARTS));
      }
      setIsLoaded(true);
    };

    loadParts();
  }, []);

  const [warehouses] = useState<Warehouse[]>(DEFAULT_WAREHOUSES);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TX);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Failed to parse transactions', e); }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVITY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Failed to parse activity logs', e); }
    }
    return [];
  });

  const [discrepancyLogs, setDiscrepancyLogs] = useState<DiscrepancyLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DISCREPANCY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Failed to parse discrepancy logs', e); }
    }
    return [];
  });

  const [locationMutations, setLocationMutations] = useState<LocationMutation[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOCATION);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Failed to parse location mutations', e); }
    }
    return [];
  });

  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  // Auto-sync State ke LocalStorage
  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(parts));
  }, [parts, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_TX, JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITY, JSON.stringify(activityLogs));
  }, [activityLogs, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_DISCREPANCY, JSON.stringify(discrepancyLogs));
  }, [discrepancyLogs, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_LOCATION, JSON.stringify(locationMutations));
  }, [locationMutations, isLoaded]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3500);
  };

  const logActivity = useCallback((
    action: ActivityAction,
    detail: string,
    opts?: { targetId?: string; targetLabel?: string; sebelum?: string; sesudah?: string; modul?: string }
  ) => {
    const now = new Date();
    const user = auth?.currentUser;
    const newLog: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 8),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || '-',
      userRole: user?.role || '-',
      action,
      targetId: opts?.targetId,
      targetLabel: opts?.targetLabel,
      sebelum: opts?.sebelum,
      sesudah: opts?.sesudah,
      detail,
      modul: opts?.modul || 'system',
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 500));
  }, [auth?.currentUser]);

  const getLowStockParts = useCallback((): SparePart[] => {
    return parts.filter(p => p.stokRealtime <= p.stokMin);
  }, [parts]);

  const getOverstockParts = useCallback((): SparePart[] => {
    return parts.filter(p => p.stokMax !== undefined && p.stokRealtime >= p.stokMax);
  }, [parts]);

  const saveSparePart = (partData: Omit<SparePart, 'id' | 'terakhirDiupdate'>, existingId?: string): SparePart => {
    const nowStr = new Date().toISOString().substring(0, 10) + ' ' + new Date().toTimeString().substring(0, 5);

    if (existingId) {
      const prevPart = parts.find(p => p.id === existingId);
      const updatedPart = { ...partData, id: existingId, terakhirDiupdate: nowStr } as SparePart;
      
      const nextParts = parts.map(p => (p.id === existingId ? updatedPart : p));
      setParts(nextParts);
      localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(nextParts));

      showToast(`Data sparepart ${partData.kodeItem} berhasil diperbarui!`, 'success');

      const stokSebelum = prevPart?.stokRealtime;
      const stokSesudah = partData.stokRealtime;
      logActivity('EDIT_ITEM',
        `${auth?.currentUser?.name || 'User'} memperbarui item ${partData.kodeItem}${stokSebelum !== stokSesudah ? ` — Stok: ${stokSebelum} → ${stokSesudah}` : ''}`,
        { targetId: existingId, targetLabel: partData.kodeItem, sebelum: JSON.stringify({ stok: stokSebelum }), sesudah: JSON.stringify({ stok: stokSesudah }), modul: 'catalog' }
      );

      // Async sync ke Supabase dengan format snake_case
      const dbPayload = mapSparePartToDb(updatedPart);
      supabase.from('products').upsert([dbPayload]).then(({ error }) => {
        if (error) console.error('Supabase upsert error:', error.message);
      });

      return updatedPart;
    } else {
      const newPart = { ...partData, id: 'part-' + Date.now(), terakhirDiupdate: nowStr } as SparePart;
      
      const nextParts = [newPart, ...parts];
      setParts(nextParts);
      localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(nextParts));

      showToast(`Sparepart baru ${newPart.kodeItem} berhasil ditambahkan!`, 'success');
      logActivity('TAMBAH_ITEM',
        `${auth?.currentUser?.name || 'User'} menambahkan item baru ${newPart.kodeItem} (${newPart.namaSparepart})`,
        { targetId: newPart.id, targetLabel: newPart.kodeItem, modul: 'catalog' }
      );

      // Async sync ke Supabase dengan format snake_case
      const dbPayload = mapSparePartToDb(newPart);
      supabase.from('products').insert([dbPayload]).then(({ error }) => {
        if (error) console.error('Supabase insert error:', error.message);
      });

      return newPart;
    }
  };

  const addSparePart = (partData: Omit<SparePart, 'id'>): SparePart => {
    return saveSparePart(partData);
  };

  const updateSparePart = (id: string, partData: Omit<SparePart, 'id'>): SparePart => {
    return saveSparePart(partData, id);
  };

  const deleteSparePart = (id: string) => {
    const part = parts.find(p => p.id === id);
    const nextParts = parts.filter(p => p.id !== id);
    
    setParts(nextParts);
    localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(nextParts));

    logActivity('HAPUS_ITEM',
      `${auth?.currentUser?.name || 'User'} menghapus item ${part?.kodeItem || id} (${part?.namaSparepart || '-'})`,
      { targetId: id, targetLabel: part?.kodeItem, modul: 'catalog' }
    );

    supabase.from('products').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase delete error:', error.message);
    });
  };

  const saveTransaction = (txData: Omit<Transaction, 'id' | 'createdDate'>): Transaction => {
    const now = new Date();
    const nowStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 5);

    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now(),
      createdDate: nowStr
    };

    setParts(prevParts =>
      prevParts.map(part => {
        const itemLine = txData.items.find(i => i.partId === part.id);
        if (!itemLine) return part;

        let updatedQty = part.stokRealtime;
        if (txData.jenisTransaksi === 'MUTASI_KELUAR') {
          updatedQty = Math.max(0, part.stokRealtime - (itemLine.jumlahKirim || 0));
        } else if (txData.jenisTransaksi === 'MUTASI_MASUK') {
          updatedQty = part.stokRealtime + (itemLine.jumlahTerima || 0);
        }

        const updatedPart = { ...part, stokRealtime: updatedQty, terakhirDiupdate: nowStr };

        // Sync stok baru ke Supabase
        const dbPayload = mapSparePartToDb(updatedPart);
        supabase.from('products').upsert([dbPayload]).then(({ error }) => {
          if (error) console.error('Supabase stock update error:', error.message);
        });

        return updatedPart;
      })
    );

    setTransactions(prev => [newTx, ...prev]);

    const actionMap: Record<string, ActivityAction> = {
      MUTASI_MASUK: 'BARANG_MASUK',
      MUTASI_KELUAR: 'BARANG_KELUAR',
      STOCK_OPNAME: 'STOCK_OPNAME',
      MUTASI_LOKASI: 'MUTASI_LOKASI',
    };
    const action = actionMap[txData.jenisTransaksi] || 'BARANG_MASUK';
    const modulMap: Record<string, string> = {
      MUTASI_MASUK: 'inbound', MUTASI_KELUAR: 'outbound', STOCK_OPNAME: 'opname', MUTASI_LOKASI: 'catalog'
    };
    logActivity(action,
      `${auth?.currentUser?.name || 'User'} mencatat transaksi ${newTx.noTransaksi} (${txData.jenisTransaksi}) — ${txData.items.length} item`,
      { targetId: newTx.id, targetLabel: newTx.noTransaksi, modul: modulMap[txData.jenisTransaksi] || 'inbound' }
    );

    showToast(`Transaksi ${newTx.noTransaksi} berhasil disimpan & stok fisik diperbarui!`, 'success');
    return newTx;
  };

  const recordStockOpname = (opnameItems: OpnameItem[], warehouseName: string, notes?: string) => {
    const now = new Date();
    const nowStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 5);
    const noOpname = `TR-OP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    setParts(prevParts =>
      prevParts.map(part => {
        const opItem = opnameItems.find(i => i.partId === part.id);
        if (!opItem) return part;
        const targetPhysical = opItem.stokFisik !== undefined ? opItem.stokFisik : (opItem.stokFisikHitung !== undefined ? opItem.stokFisikHitung : part.stokRealtime);
        
        const updatedPart = { ...part, stokRealtime: targetPhysical, terakhirDiupdate: nowStr };

        // Sync hasil opname ke Supabase
        const dbPayload = mapSparePartToDb(updatedPart);
        supabase.from('products').upsert([dbPayload]).then(({ error }) => {
          if (error) console.error('Supabase opname update error:', error.message);
        });

        return updatedPart;
      })
    );

    const itemsWithDiff = opnameItems.filter(i => i.selisih !== 0);
    if (itemsWithDiff.length > 0) {
      const newDiscrepancies: DiscrepancyLog[] = itemsWithDiff.map(i => ({
        id: 'disc-' + Date.now() + '-' + i.partId,
        tanggalOpname: nowStr,
        noOpname,
        partId: i.partId,
        kodeItem: i.kodeItem,
        namaSparepart: i.namaSparepart,
        lokasiRak: i.lokasiRak,
        stokSistem: i.stokSistem,
        stokFisik: i.stokFisik !== undefined ? i.stokFisik : (i.stokFisikHitung || 0),
        selisih: i.selisih,
        nilaiSelisihRp: Math.abs(i.selisih) * (i.hargaBeli || 0),
        catatan: i.catatan || i.keterangan || '-',
        petugas: auth?.currentUser?.name || 'Petugas Gudang',
        timestamp: nowStr,
      }));
      setDiscrepancyLogs(prev => [...newDiscrepancies, ...prev]);
    }

    const opnameTx: Transaction = {
      id: 'tx-op-' + Date.now(),
      noTransaksi: noOpname,
      tanggal: nowStr,
      jenisTransaksi: 'STOCK_OPNAME',
      gudangAsal: warehouseName,
      pelanggan: 'Hasil Penyesuaian Fisik Opname Rak',
      salesPerson: auth?.currentUser?.name || 'Petugas Gudang (Opname)',
      keterangan: notes || 'Hasil Audit Hitung Fisik Stock Opname Rak',
      totalNilai: 0,
      items: opnameItems.map(i => ({
        id: 'li-op-' + i.partId,
        partId: i.partId,
        kodeItem: i.kodeItem,
        namaSparepart: i.namaSparepart,
        brand: i.brand || 'GENUINE',
        lokasiRak: i.lokasiRak,
        stokTersedia: i.stokSistem,
        jumlahKirim: Math.abs(i.selisih),
        jumlahTerima: i.stokFisik !== undefined ? i.stokFisik : (i.stokFisikHitung || 0),
        satuan: 'PCS',
        hargaBeli: i.hargaBeli || 0,
        hargaJual: i.hargaJual || 0,
        keteranganStatus: `Opname: ${i.selisih > 0 ? '+' : ''}${i.selisih} Pcs. ${i.catatan || i.keterangan || ''}`
      })),
      totalKuantitasItem: opnameItems.length,
      totalJumlahTerima: opnameItems.reduce((acc, i) => acc + (i.stokFisik !== undefined ? i.stokFisik : (i.stokFisikHitung || 0)), 0),
      notes: notes || 'Stock Opname Fisik Berkala',
      createdDate: nowStr
    };

    setTransactions(prev => [opnameTx, ...prev]);
    logActivity('STOCK_OPNAME',
      `${auth?.currentUser?.name || 'User'} melakukan Stock Opname ${noOpname} — ${opnameItems.length} item diperiksa, ${itemsWithDiff.length} selisih`,
      { targetId: opnameTx.id, targetLabel: noOpname, modul: 'opname' }
    );
  };

  const recordLocationMutation = (mutationData: Omit<LocationMutation, 'id' | 'timestamp'>) => {
    const now = new Date();
    const nowStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 5);

    const mutation: LocationMutation = {
      ...mutationData,
      id: 'lm-' + Date.now(),
      timestamp: nowStr,
    };

    setParts(prev => prev.map(p => {
      if (p.id === mutationData.partId) {
        const updatedPart = { ...p, lokasiRak: mutationData.keLokasi, terakhirDiupdate: nowStr };
        
        // Sync lokasi baru ke Supabase
        const dbPayload = mapSparePartToDb(updatedPart);
        supabase.from('products').upsert([dbPayload]).then(({ error }) => {
          if (error) console.error('Supabase location update error:', error.message);
        });

        return updatedPart;
      }
      return p;
    }));

    setLocationMutations(prev => [mutation, ...prev]);

    logActivity('MUTASI_LOKASI',
      `${auth?.currentUser?.name || 'User'} memindahkan ${mutationData.kodeItem} dari ${mutationData.dariLokasi} → ${mutationData.keLokasi} (${mutationData.jumlah} ${mutationData.satuan})`,
      { targetId: mutationData.partId, targetLabel: mutationData.kodeItem, sebelum: mutationData.dariLokasi, sesudah: mutationData.keLokasi, modul: 'catalog' }
    );

    showToast(`✅ Mutasi lokasi ${mutationData.kodeItem}: ${mutationData.dariLokasi} → ${mutationData.keLokasi} berhasil dicatat!`, 'success');
  };

  return (
    <InventoryContext.Provider
      value={{
        parts,
        warehouses,
        transactions,
        activityLogs,
        discrepancyLogs,
        locationMutations,
        toast,
        showToast,
        saveSparePart,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        saveTransaction,
        recordStockOpname,
        recordLocationMutation,
        logActivity,
        getLowStockParts,
        getOverstockParts,
      }}
    >
      {children}

      {/* Global Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl text-white font-extrabold text-xs flex items-center gap-2 border ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-400' :
            toast.type === 'error' ? 'bg-red-600 border-red-400' : 'bg-slate-900 border-slate-700'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </InventoryContext.Provider>
  );
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <InventoryProviderInner>{children}</InventoryProviderInner>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};