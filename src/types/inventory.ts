export type TurnoverStatus = 'FAST_MOVING' | 'MEDIUM_MOVING' | 'SLOW_MOVING';
export type SalesChannel = 'OFFLINE_STORE' | 'SHOPEE' | 'TOKOPEDIA' | 'GROSIR_OTHER';

export interface SparePart {
  id: string;
  kodeItem: string;
  oemNumber?: string;
  namaSparepart: string;
  brand: string;
  lokasiRak: string;
  satuan: string;
  stokRealtime: number;
  stokMin: number;
  stokMax?: number; // Threshold Overstock alert

  hargaBeli: number;  // HPP / Modal Asset
  hargaJual: number;  // Harga Jual Toko Offline / Direct

  // Dedicated Marketplace Pricing (Shopee & Tokopedia/TikTok Shop)
  hargaShopee?: number;
  adminFeeShopeePercent?: number;

  hargaTokopedia?: number;
  adminFeeTokopediaPercent?: number;

  // Backward compatibility optional fields
  hargaMarketplace?: number;
  adminFeePercent?: number;
  turnoverStatus?: TurnoverStatus;
  fotoProduk?: string;
  deskripsi?: string;
  terakhirDiupdate: string;
  kategori?: string;
  nomorPartPabrikan?: string;
  status?: string;
  gambar?: string | string[];
}

export interface TransactionLineItem {
  id: string;
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  brand: string;
  lokasiRak: string;
  satuan: string;
  stokTersedia: number;
  jumlahKirim?: number;
  jumlahTerima?: number;
  hargaBeli?: number;
  hargaJual?: number;
  hargaMarketplace?: number;
  fotoProduk?: string;
  keteranganStatus?: string;
}

export interface Transaction {
  id: string;
  noTransaksi: string;
  tanggal: string;
  createdDate?: string;
  jenisTransaksi: 'MUTASI_MASUK' | 'MUTASI_KELUAR' | 'STOCK_OPNAME' | 'MUTASI_LOKASI' | 'RETUR_ONLINE';
  salesChannel?: SalesChannel;
  gudangAsal: string;
  gudangTujuan?: string;
  pelanggan: string;
  salesPerson: string;
  keterangan?: string;
  notes?: string;
  noPOSupplier?: string;      // Pilar 3: No PO Supplier (Inbound)
  noSJSupplier?: string;      // Pilar 3: No SJ Supplier (Inbound)
  fotoBuktiPenerimaan?: string; // Pilar 3: Foto bukti fisik penerimaan
  fotoSerahTerima?: string;   // Pilar 3: Foto bukti serah terima (Outbound)
  totalNilai?: number;
  totalNilaiHpp?: number;
  totalNilaiJual?: number;
  totalKuantitasItem?: number;
  totalJumlahTerima?: number;
  items: TransactionLineItem[];
}

export interface OpnameItem {
  id: string;
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  brand?: string;
  lokasiRak: string;
  stokSistem: number;
  stokFisik?: number;
  stokFisikHitung?: number;
  selisih: number;
  catatan?: string;
  keterangan?: string;
  hargaBeli?: number;
  hargaJual?: number;
}

export interface StockOpnameRecord {
  id: string;
  tanggal: string;
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  lokasiRak: string;
  stokSistem: number;
  stokFisikHitung: number;
  selisih: number;
  keterangan: string;
  petugas: string;
}

// Pilar 1: Discrepancy Log — log selisih dari Stock Opname
export interface DiscrepancyLog {
  id: string;
  tanggalOpname: string;
  noOpname: string;
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  lokasiRak: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;           // Positif = kelebihan, Negatif = kekurangan
  nilaiSelisihRp: number;    // |selisih| * hargaBeli
  catatan: string;
  petugas: string;
  timestamp: string;
}

// Pilar 3: Location Mutation — riwayat perpindahan antar-rak/gudang
export interface LocationMutation {
  id: string;
  timestamp: string;
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  dariLokasi: string;
  keLokasi: string;
  jumlah: number;
  satuan: string;
  catatan?: string;
  petugas: string;
}

// Pilar 5: Activity Log — Audit Trail perubahan data oleh user
export type ActivityAction =
  | 'TAMBAH_ITEM'
  | 'EDIT_ITEM'
  | 'HAPUS_ITEM'
  | 'BARANG_MASUK'
  | 'BARANG_KELUAR'
  | 'STOCK_OPNAME'
  | 'MUTASI_LOKASI'
  | 'RETUR_BARANG'
  | 'REFURBISH_ITEM'
  | 'EDIT_PERMISSION'
  | 'TAMBAH_USER'
  | 'HAPUS_USER'
  | 'TOGGLE_STATUS_USER';

export type ReturnCondition = 'GOOD_CONDITION' | 'DEFECT_RUSAK';
export type ReturnStatus = 'PROCESSED' | 'REFURBISHED' | 'SCRAPPED';

export interface ReturnRecord {
  id: string;
  noRetur: string;
  tanggal: string;
  partId: string;
  kodeItem: string;
  namaSparepart: string;
  brand: string;
  lokasiRak: string;
  satuan: string;
  qty: number;
  
  salesChannel: SalesChannel;
  noResiKirim: string;
  noResiRetur: string;
  
  biayaCheckout: number;
  biayaRefund: number;
  biayaPackingLoss: number;
  biayaOngkirBbmLoss: number;
  totalKerugianOperasional: number;
  
  kondisiBarang: ReturnCondition;
  status: ReturnStatus;
  
  // Refurbished Details
  isRefurbished?: boolean;
  biayaRefurbish?: number;
  hargaJualRefurbished?: number;
  catatanRefurbish?: string;
  tanggalRefurbish?: string;
  
  petugas: string;
  catatan?: string;
  fotoBukti?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: ActivityAction;
  targetId?: string;          // ID item / transaksi yang berubah
  targetLabel?: string;       // Label human readable (misal kodeItem)
  sebelum?: string;           // Nilai sebelum (JSON string atau deskripsi)
  sesudah?: string;           // Nilai sesudah
  detail: string;             // Detail narasi: "Budi mengubah stok LF3349 dari 10 → 5"
  modul: string;              // Modul sumber: catalog, inbound, outbound, opname, security
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  ipAddress: string;
  action: string;
  status: 'SUCCESS' | 'BLOCKED' | 'SUSPICIOUS';
  details: string;
  isSuspicious: boolean;
}

export interface WhitelistUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN_GUDANG' | 'STAFF_KASIR' | 'AUDITOR';
  roleTitle: string;
  status: 'ACTIVE' | 'DISABLED';
  allowedModules: string[];
  addedAt: string;
  lastLogin?: string;
}
