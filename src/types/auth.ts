export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OWNER' 
  | 'DEPUTI_DIREKTUR' 
  | 'ADMIN_GUDANG' 
  | 'PETUGAS_GUDANG' 
  | 'AUDITOR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  warehouseCode?: string;
  avatarUrl?: string;
  allowedModules?: string[]; // e.g. ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports', 'audit']
}

export interface WhitelistUser {
  email: string;
  passwordHash: string; // Plaintext for demo simulation
  profile: UserProfile;
}

export interface WhitelistRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  passwordHash?: string;
  allowedModules: string[];
  status: 'AKTIF' | 'NONAKTIF';
  registeredDate: string;
}

export const isSuperAdminRole = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'SUPER_ADMIN' || r === 'OWNER' || r === 'DEPUTI_DIREKTUR';
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin (Deputi Direktur)',
  OWNER: 'Owner (Pemilik Toko/Perusahaan)',
  DEPUTI_DIREKTUR: 'Deputi Direktur',
  ADMIN_GUDANG: 'Admin Kepala Gudang',
  PETUGAS_GUDANG: 'Petugas Gudang / Scanner',
  AUDITOR: 'Auditor (Read-Only)',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-900 border-purple-300',
  OWNER: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  DEPUTI_DIREKTUR: 'bg-sky-100 text-sky-900 border-sky-300',
  ADMIN_GUDANG: 'bg-blue-100 text-blue-900 border-blue-300',
  PETUGAS_GUDANG: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  AUDITOR: 'bg-amber-100 text-amber-900 border-amber-300',
};