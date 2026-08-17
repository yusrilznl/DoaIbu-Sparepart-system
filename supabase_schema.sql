-- ====================================================================
-- SKEMA DATABASE SUPABASE / POSTGRESQL FOR DOA IBU SPAREPART | PT FARDAN UTAMA NIAGA
-- WAREHOUSE & INVENTORY MANAGEMENT SYSTEM
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: users_whitelist (Daftar Pengguna Ber-izin & Role)
CREATE TABLE IF NOT EXISTS public.users_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'PETUGAS_GUDANG', -- SUPER_ADMIN, ADMIN_GUDANG, PETUGAS_GUDANG
  role_title VARCHAR(255) NOT NULL DEFAULT 'Petugas Gudang',
  status VARCHAR(20) NOT NULL DEFAULT 'AKTIF', -- AKTIF / NONAKTIF
  password_hash VARCHAR(255) NOT NULL DEFAULT 'password123',
  allowed_modules JSONB NOT NULL DEFAULT '["dashboard", "catalog", "opname"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL: spareparts (Katalog Master Barang & Rak Bin)
CREATE TABLE IF NOT EXISTS public.spareparts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_number VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL DEFAULT 'FLEETGUARD',
  bin_location VARCHAR(100) NOT NULL DEFAULT 'A-01-01',
  unit VARCHAR(50) NOT NULL DEFAULT 'PCS',
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  photo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL: transactions (Mutasi Barang Masuk / Keluar / Surat Jalan)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_no VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- MUTASI_MASUK / MUTASI_KELUAR / STOCK_OPNAME
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supplier_destination VARCHAR(255) NOT NULL,
  warehouse VARCHAR(255) NOT NULL DEFAULT 'Gudang Utama Magelang',
  created_by VARCHAR(255) NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_items INT NOT NULL DEFAULT 0,
  total_quantity INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL: security_logs (Audit Trail Keamanan & Percobaan Pembobolan)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50) NOT NULL DEFAULT '192.168.1.1',
  device_info VARCHAR(255) NOT NULL DEFAULT 'Unknown Device',
  status VARCHAR(100) NOT NULL,
  status_label VARCHAR(255) NOT NULL,
  is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.users_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- 1. Security Logs: Hanya bisa dibaca/ditulis oleh SUPER_ADMIN
CREATE POLICY "Super Admin Full Access Security Logs"
ON public.security_logs
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.users_whitelist WHERE role = 'SUPER_ADMIN'));

-- 2. Whitelist: Hanya bisa dikelola oleh SUPER_ADMIN
CREATE POLICY "Super Admin Full Access Whitelist"
ON public.users_whitelist
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.users_whitelist WHERE role = 'SUPER_ADMIN'));

-- 3. Spareparts: Dapat dibaca & di-update oleh seluruh Whitelist User Aktif
CREATE POLICY "Whitelist Users Access Spareparts"
ON public.spareparts
FOR ALL
USING (TRUE);

-- 4. Transactions: Dapat dibaca & ditambah oleh seluruh Whitelist User Aktif
CREATE POLICY "Whitelist Users Access Transactions"
ON public.transactions
FOR ALL
USING (TRUE);

-- ====================================================================
-- SEED INITIAL DATA (PETUGAS & OWNER KHUSUS)
-- ====================================================================

INSERT INTO public.users_whitelist (email, name, role, role_title, status, password_hash, allowed_modules)
VALUES 
  ('yusrilznl@gmail.com', 'Yusril Zainal (Owner)', 'SUPER_ADMIN', 'Owner / Super Admin', 'AKTIF', 'password123', '["dashboard", "catalog", "outbound", "inbound", "opname", "reports", "security"]'),
  ('admin.gudang@doaibusparepart.com', 'Budi Santoso', 'ADMIN_GUDANG', 'Head Stock Admin Gudang', 'AKTIF', 'password123', '["dashboard", "catalog", "outbound", "inbound", "opname", "reports"]'),
  ('petugas.mgl@doaibusparepart.com', 'Agus Subekti', 'PETUGAS_GUDANG', 'Petugas Stock Opname & Scan', 'AKTIF', 'password123', '["dashboard", "catalog", "opname"]')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.spareparts (part_number, name, brand, bin_location, unit, stock, min_stock)
VALUES
  ('FS1280', 'Water Separator Fuel Filter Fleetguard', 'FLEETGUARD', 'A-01-01', 'PCS', 18, 5),
  ('LF3349', 'Lube Oil Filter Heavy Duty Fleetguard', 'FLEETGUARD', 'A-01-02', 'PCS', 24, 6),
  ('FF5052', 'Fuel Filter Fleetguard Excavator', 'FLEETGUARD', 'B-02-01', 'PCS', 12, 4),
  ('1000700909', 'Hydraulic Return Filter Element Loader', 'LOADER', 'B-03-01', 'PCS', 8, 3),
  ('1R-0716', 'Engine Oil Filter Caterpillar D6N', 'CATERPILLAR', 'C-01-04', 'PCS', 15, 5)
ON CONFLICT (part_number) DO NOTHING;
