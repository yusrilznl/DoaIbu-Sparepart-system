import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SparePart, Transaction, OpnameItem, ActivityLog, ActivityAction, DiscrepancyLog, LocationMutation, ReturnRecord } from '../types/inventory';
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
  { id: 'w-[#0B3C85]', code: 'BRN-03', name: 'Gudang Site Mining Borneo', address: 'Site Project Tambang Sangatta, East Kalimantan', totalRak: 8 }
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
  returns: ReturnRecord[];
  activityLogs: ActivityLog[];
  discrepancyLogs: DiscrepancyLog[];
  locationMutations: LocationMutation[];
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  saveSparePart: (partData: Omit<SparePart, 'id' | 'terakhirDiupdate'>, existingId?: string) => SparePart;
  addSparePart: (partData: Omit<SparePart, 'id'>) => SparePart;
  updateSparePart: (id: string, partData: Partial<SparePart>) => SparePart;
  deleteSparePart: (id: string) => void;
  saveTransaction: (transactionData: Omit<Transaction, 'id' | 'createdDate'>) => Transaction;
  deleteTransaction: (id: string) => void;
  addReturnRecord: (data: Omit<ReturnRecord, 'id' | 'noRetur' | 'tanggal' | 'status' | 'petugas'>) => ReturnRecord;
  updateReturnRecord: (id: string, updatedData: Partial<ReturnRecord>) => void;
  confirmReturnRecord: (id: string) => void;
  refurbishReturnItem: (returnId: string, refurbishData: { biayaRefurbish: number; hargaJualRefurbished: number; catatanRefurbish: string; restockToInventory?: boolean }) => void;
  getGoodConditionReturnCount: (partId: string) => number;
  recordStockOpname: (opnameItems: OpnameItem[], warehouseName: string, notes?: string) => void;
  recordLocationMutation: (mutation: Omit<LocationMutation, 'id' | 'timestamp'>) => void;
  logActivity: (action: ActivityAction, detail: string, opts?: { targetId?: string; targetLabel?: string; sebelum?: string; sesudah?: string; modul?: string }) => void;
  getLowStockParts: () => SparePart[];
  getOverstockParts: () => SparePart[];
  syncLocalToSupabase?: () => Promise<void>;
}

const LOCAL_STORAGE_KEY_PARTS = 'optipart_doaibu_parts_v5';
const LOCAL_STORAGE_KEY_TX = 'optipart_doaibu_tx_v5';
const LOCAL_STORAGE_KEY_RETURNS = 'optipart_doaibu_returns_v5';
const LOCAL_STORAGE_KEY_ACTIVITY = 'optipart_doaibu_activity_v5';
const LOCAL_STORAGE_KEY_DISCREPANCY = 'optipart_doaibu_discrepancy_v5';
const LOCAL_STORAGE_KEY_LOCATION = 'optipart_doaibu_location_v5';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// 1. Mapping DB -> React State
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
  nomorPartPabrikan: row.nomor_part_pabrikan || row.nomorPartPabrikan || row.oemNumber,
  oemNumber: row.oem_number || row.oemNumber || row.nomor_part_pabrikan,
  terakhirDiupdate: row.terakhir_diupdate || row.terakhirDiupdate || new Date().toISOString(),
  deskripsi: row.deskripsi || '',
  status: row.status || 'AKTIF',
  gambar: Array.isArray(row.gambar)
    ? row.gambar
    : (row.gambar ? JSON.parse(row.gambar) : []),
} as unknown as SparePart);

// 2. Mapping React State -> DB
const mapSparePartToDb = (part: any) => {
  const imageSource = part.fotoProduk || part.gambar || [];

  const gambarData = Array.isArray(imageSource)
    ? JSON.stringify(imageSource)
    : (typeof imageSource === 'string' && imageSource ? JSON.stringify([imageSource]) : '[]');

  const dbPayload: any = {
    kode_item: part.kodeItem || '',
    nama_sparepart: part.namaSparepart || '',
    brand: part.brand || 'GENUINE',
    kategori: part.kategori || 'Umum',
    lokasi_rak: part.lokasiRak || '-',
    stok_realtime: Number(part.stokRealtime ?? 0),
    stok_min: Number(part.stokMin ?? 0),
    stok_max: part.stokMax !== undefined && part.stokMax !== null ? Number(part.stokMax) : 0,
    satuan: part.satuan || 'PCS',
    harga_beli: Number(part.hargaBeli ?? 0),
    harga_jual: Number(part.hargaJual ?? 0),
    nomor_part_pabrikan: part.nomorPartPabrikan || part.oemNumber || '-',
    terakhir_diupdate: part.terakhirDiupdate || new Date().toISOString(),
    deskripsi: part.deskripsi || '',
    status: part.status || 'AKTIF',
    gambar: gambarData,
  };

  if (part.id && !isNaN(Number(part.id))) {
    dbPayload.id = Number(part.id);
  }

  return dbPayload;
};

const InventoryProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const [parts, setParts] = useState<SparePart[]>(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY_PARTS);
    return localData ? JSON.parse(localData) : INITIAL_SPAREPARTS;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load & 2-Way Auto-Sync Parts from Supabase DB on Mount
  useEffect(() => {
    const loadParts = async () => {
      let currentLocal: SparePart[] = [];
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PARTS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentLocal = parsed;
          }
        } catch (e) {
          console.error('Failed to parse parts from localStorage', e);
        }
      }

      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          const mappedParts = data.map(mapDbToSparePart);
          
          if (currentLocal.length > 0) {
            const merged = [...mappedParts];
            let needsDbSync = false;

            currentLocal.forEach(localItem => {
              const dbIndex = merged.findIndex(dbItem => dbItem.kodeItem.toLowerCase() === localItem.kodeItem.toLowerCase());
              if (dbIndex === -1) {
                merged.push(localItem);
                needsDbSync = true;
              } else {
                if ((localItem.hargaBeli || 0) > 0 && (merged[dbIndex].hargaBeli || 0) === 0) {
                  merged[dbIndex] = {
                    ...merged[dbIndex],
                    hargaBeli: localItem.hargaBeli,
                    hargaJual: localItem.hargaJual || merged[dbIndex].hargaJual,
                    hargaShopee: localItem.hargaShopee || merged[dbIndex].hargaShopee,
                    hargaTokopedia: localItem.hargaTokopedia || merged[dbIndex].hargaTokopedia
                  };
                  needsDbSync = true;
                }
              }
            });

            setParts(merged);
            localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(merged));
            setIsLoaded(true);

            if (needsDbSync) {
              const dbPayload = merged.map(mapSparePartToDb);
              supabase.from('products').upsert(dbPayload).then(({ error: syncErr }) => {
                if (syncErr) console.warn('Background Supabase auto-sync notice:', syncErr.message);
                else console.log('✅ Auto-synced local parts & prices to Supabase Cloud DB!');
              });
            }
            return;
          }

          setParts(mappedParts);
          localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(mappedParts));
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Supabase fetch failed:', e);
      }

      // Fallback jika Supabase DB belum ada baris
      if (currentLocal.length > 0) {
        setParts(currentLocal);
      } else {
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

  // Fetch Transactions from Supabase DB on Mount
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const { data, error } = await supabase.from('transactions').select('*');
        if (!error && data) {
          const mappedTx: Transaction[] = data.map((t: any) => ({
            id: String(t.id),
            noTransaksi: t.no_transaksi || t.noTransaksi || '',
            tanggal: t.tanggal || t.created_at || '',
            jenisTransaksi: t.jenis_transaksi || t.jenisTransaksi || 'MUTASI_MASUK',
            salesChannel: t.sales_channel || t.salesChannel || 'OFFLINE_STORE',
            gudangAsal: t.gudang_asal || t.gudangAsal || 'Gudang Utama Magelang',
            pelanggan: t.pelanggan || '-',
            salesPerson: t.sales_person || t.salesPerson || '-',
            items: typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []),
            totalKuantitasItem: Number(t.total_kuantitas_item ?? t.totalKuantitasItem ?? 0),
            totalJumlahTerima: Number(t.total_jumlah_terima ?? t.totalJumlahTerima ?? 0),
            totalNilaiHpp: Number(t.total_nilai_hpp ?? t.totalNilaiHpp ?? 0),
            totalNilaiJual: Number(t.total_nilai_jual ?? t.totalNilaiJual ?? 0),
            notes: t.notes || '',
            createdDate: t.created_date || t.createdDate || t.tanggal || ''
          }));
          setTransactions(mappedTx);
          localStorage.setItem(LOCAL_STORAGE_KEY_TX, JSON.stringify(mappedTx));
        }
      } catch (e) {
        console.error('Failed to load transactions from Supabase:', e);
      }
    };

    loadTransactions();
  }, []);

  const [returns, setReturns] = useState<ReturnRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RETURNS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [discrepancyLogs, setDiscrepancyLogs] = useState<DiscrepancyLog[]>([]);
  const [locationMutations, setLocationMutations] = useState<LocationMutation[]>([]);

  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(parts));
  }, [parts, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_TX, JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(LOCAL_STORAGE_KEY_RETURNS, JSON.stringify(returns));
  }, [returns, isLoaded]);

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

      const dbPayload = mapSparePartToDb(updatedPart);
      if (isNaN(Number(dbPayload.id))) {
        delete dbPayload.id;
      } else {
        dbPayload.id = Number(dbPayload.id);
      }

      supabase.from('products').upsert([dbPayload]).then(({ error }) => {
        if (error) {
          console.error('❌ Supabase Update Error:', error.message);
          showToast(`Gagal sync Supabase: ${error.message}`, 'error');
        } else {
          console.log('✅ Berhasil update Supabase!');
          showToast('✅ Tersimpan di Supabase!', 'success');
        }
      });

      return updatedPart;
    } else {
      const numericId = Date.now();
      const newPart = { ...partData, id: String(numericId), terakhirDiupdate: nowStr } as SparePart;

      const nextParts = [newPart, ...parts];
      setParts(nextParts);
      localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(nextParts));

      showToast(`Sparepart baru ${newPart.kodeItem} berhasil ditambahkan!`, 'success');
      logActivity('TAMBAH_ITEM',
        `${auth?.currentUser?.name || 'User'} menambahkan item baru ${newPart.kodeItem} (${newPart.namaSparepart})`,
        { targetId: newPart.id, targetLabel: newPart.kodeItem, modul: 'catalog' }
      );

      const dbPayload = mapSparePartToDb(newPart);
      dbPayload.id = numericId;

      supabase.from('products').insert([dbPayload]).select().then(({ data, error }) => {
        if (error) {
          console.error('❌ Supabase Insert Error:', error.message);
          showToast(`Gagal simpan ke Supabase: ${error.message}`, 'error');
        } else {
          console.log('✅ Berhasil simpan ke Supabase:', data);
          showToast('✅ Berhasil tersimpan di Supabase!', 'success');
        }
      });

      return newPart;
    }
  };

  const syncLocalToSupabase = async () => {
    if (parts.length === 0) return;
    try {
      const dbPayload = parts.map(mapSparePartToDb);
      const { data, error } = await supabase
        .from('products')
        .upsert(dbPayload, { onConflict: 'id' });

      if (error) {
        console.error('Gagal sync ke Supabase:', error.message);
        alert('Gagal simpan ke Supabase: ' + error.message);
      } else {
        console.log('Berhasil sync ke Supabase:', data);
        alert('Berhasil upload data ke Supabase!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addSparePart = (partData: Omit<SparePart, 'id'>): SparePart => {
    return saveSparePart(partData);
  };

  const updateSparePart = (id: string, partData: Partial<SparePart>): SparePart => {
    return saveSparePart(partData as any, id);
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

        const dbPayload = mapSparePartToDb(updatedPart);
        supabase.from('products').upsert([dbPayload]).then(({ error }) => {
          if (error) console.error('Supabase stock update error:', error.message);
        });

        return updatedPart;
      })
    );

    setTransactions(prev => [newTx, ...prev]);

    // Insert to Supabase DB `transactions` table
    supabase.from('transactions').insert([{
      no_transaksi: newTx.noTransaksi,
      tanggal: newTx.tanggal,
      jenis_transaksi: newTx.jenisTransaksi,
      sales_channel: newTx.salesChannel || 'OFFLINE_STORE',
      gudang_asal: newTx.gudangAsal,
      pelanggan: newTx.pelanggan,
      sales_person: newTx.salesPerson,
      items: JSON.stringify(newTx.items),
      total_kuantitas_item: newTx.totalKuantitasItem,
      total_jumlah_terima: newTx.totalJumlahTerima,
      total_nilai_hpp: newTx.totalNilaiHpp,
      total_nilai_jual: newTx.totalNilaiJual,
      notes: newTx.notes || '',
      created_date: newTx.createdDate
    }]).then(({ error }) => {
      if (error) console.error('Supabase transaction insert error:', error.message);
    });

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

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    const nextTx = transactions.filter(t => t.id !== id);
    setTransactions(nextTx);
    localStorage.setItem(LOCAL_STORAGE_KEY_TX, JSON.stringify(nextTx));

    logActivity(
      'HAPUS_ITEM',
      `${auth?.currentUser?.name || 'User'} membatalkan/menghapus transaksi ${txToDelete.noTransaksi} (${txToDelete.jenisTransaksi})`,
      { targetId: id, targetLabel: txToDelete.noTransaksi, modul: 'reports' }
    );

    showToast(`Transaksi ${txToDelete.noTransaksi} berhasil dibatalkan & dihapus!`, 'info');

    supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase delete transaction error:', error.message);
    });
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

  // Helper: Get Good Condition Return Count for a specific part
  const getGoodConditionReturnCount = (partId: string) => {
    return returns
      .filter(r => r.partId === partId && r.kondisiBarang === 'GOOD_CONDITION')
      .reduce((sum, r) => sum + r.qty, 0);
  };

  // Add New Return Record
  const addReturnRecord = (data: Omit<ReturnRecord, 'id' | 'noRetur' | 'tanggal' | 'status' | 'petugas'>): ReturnRecord => {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const randStr = Math.floor(1000 + Math.random() * 9000).toString();
    const noRetur = `RET-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${randStr}`;

    const newRecord: ReturnRecord = {
      ...data,
      id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      noRetur,
      tanggal: dateStr,
      status: 'PROCESSED',
      petugas: auth?.currentUser?.name || 'Admin Gudang',
    };

    setReturns(prev => [newRecord, ...prev]);

    // If Good Condition, automatically restock to ready-to-sell inventory (+qty)
    if (data.kondisiBarang === 'GOOD_CONDITION') {
      setParts(prev => prev.map(p => {
        if (p.id === data.partId) {
          const updated = {
            ...p,
            stokRealtime: p.stokRealtime + data.qty,
            terakhirDiupdate: new Date().toISOString()
          };
          supabase.from('products').upsert([mapSparePartToDb(updated)]).then(({ error }) => {
            if (error) console.error('Supabase return restock error:', error.message);
          });
          return updated;
        }
        return p;
      }));
    }

    logActivity(
      'RETUR_BARANG',
      `[RETURN] ${auth?.currentUser?.name || 'User'} mencatat Retur Online #${noRetur} (${data.salesChannel} - Resi: ${data.noResiRetur}) untuk ${data.kodeItem} (${data.qty} ${data.satuan}) - Kondisi: ${data.kondisiBarang === 'GOOD_CONDITION' ? 'Good Condition (Restocked)' : 'Cacat/Rusak (Afkir)'}`,
      { targetId: data.partId, targetLabel: data.kodeItem, modul: 'return' }
    );

    showToast(`✅ Retur Online #${noRetur} berhasil dicatat! ${data.kondisiBarang === 'GOOD_CONDITION' ? `(+${data.qty} Stok Restock)` : '(Masuk Karantina)'}`, 'success');
    return newRecord;
  };

  // Update Return Record
  const updateReturnRecord = (id: string, updatedData: Partial<ReturnRecord>) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    showToast('✅ Data retur berhasil diperbarui!', 'success');
  };

  // Confirm Return Record Status
  const confirmReturnRecord = (id: string) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: 'TERKONFIRMASI' } : r));
    showToast('✅ Status retur berhasil dikonfirmasi!', 'success');
  };

  // Refurbish Return Item
  const refurbishReturnItem = (
    returnId: string,
    refurbishData: { biayaRefurbish: number; hargaJualRefurbished: number; catatanRefurbish: string; restockToInventory?: boolean }
  ) => {
    const targetReturn = returns.find(r => r.id === returnId);
    if (!targetReturn) return;

    const nowStr = new Date().toLocaleDateString('id-ID');

    setReturns(prev => prev.map(r => {
      if (r.id === returnId) {
        return {
          ...r,
          isRefurbished: true,
          status: 'REFURBISHED',
          biayaRefurbish: refurbishData.biayaRefurbish,
          hargaJualRefurbished: refurbishData.hargaJualRefurbished,
          catatanRefurbish: refurbishData.catatanRefurbish,
          tanggalRefurbish: nowStr,
        };
      }
      return r;
    }));

    if (refurbishData.restockToInventory) {
      setParts(prev => prev.map(p => {
        if (p.id === targetReturn.partId) {
          const updated = {
            ...p,
            stokRealtime: p.stokRealtime + targetReturn.qty,
            terakhirDiupdate: new Date().toISOString()
          };
          supabase.from('products').upsert([mapSparePartToDb(updated)]).then(({ error }) => {
            if (error) console.error('Supabase refurbish restock error:', error.message);
          });
          return updated;
        }
        return p;
      }));
    }

    logActivity(
      'REFURBISH_ITEM',
      `[RETURN] ${auth?.currentUser?.name || 'User'} melakukan Refurbish/Perbaikan barang retur ${targetReturn.kodeItem} (${targetReturn.noRetur}) - Biaya Ops: Rp ${refurbishData.biayaRefurbish.toLocaleString('id-ID')} — ${refurbishData.catatanRefurbish}`,
      { targetId: targetReturn.partId, targetLabel: targetReturn.kodeItem, modul: 'return' }
    );

    showToast(`🔧 Perbaikan (Refurbished) ${targetReturn.kodeItem} berhasil dicatat!`, 'success');
  };

  return (
    <InventoryContext.Provider
      value={{
        parts,
        warehouses,
        transactions,
        returns,
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
        deleteTransaction,
        addReturnRecord,
        updateReturnRecord,
        confirmReturnRecord,
        refurbishReturnItem,
        getGoodConditionReturnCount,
        recordStockOpname,
        recordLocationMutation,
        logActivity,
        getLowStockParts,
        getOverstockParts,
        syncLocalToSupabase,
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