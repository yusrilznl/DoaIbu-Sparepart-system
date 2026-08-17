export type UserRole = 'SUPER_ADMIN' | 'ADMIN_GUDANG' | 'PETUGAS_GUDANG' | 'AUDITOR';

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

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Owner / Super Admin',
  ADMIN_GUDANG: 'Admin Kepala Gudang',
  PETUGAS_GUDANG: 'Petugas Gudang / Scanner',
  AUDITOR: 'Auditor (Read-Only)',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-900 border-purple-300',
  ADMIN_GUDANG: 'bg-blue-100 text-blue-900 border-blue-300',
  PETUGAS_GUDANG: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  AUDITOR: 'bg-amber-100 text-amber-900 border-amber-300',
};
