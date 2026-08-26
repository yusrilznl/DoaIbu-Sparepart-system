const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INITIAL_SPAREPARTS = [
  {
    id: 'part-1',
    kode_item: 'FS1280',
    nama_sparepart: 'Water Separator Fuel Filter Fleetguard',
    brand: 'FLEETGUARD',
    lokasi_rak: 'A-01-01',
    satuan: 'PCS',
    stok_realtime: 18,
    stok_min: 5,
    harga_beli: 145000,
    harga_jual: 215000,
    harga_shopee: 235000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 235000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-12 14:30'
  },
  {
    id: 'part-2',
    kode_item: 'LF3349',
    nama_sparepart: 'Lube Oil Filter Heavy Duty Fleetguard',
    brand: 'FLEETGUARD',
    lokasi_rak: 'A-01-02',
    satuan: 'PCS',
    stok_realtime: 24,
    stok_min: 6,
    harga_beli: 185000,
    harga_jual: 275000,
    harga_shopee: 299000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 299000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-11 11:20'
  },
  {
    id: 'part-3',
    kode_item: 'FF5052',
    nama_sparepart: 'Fuel Filter Secondary Fleetguard Excavator',
    brand: 'FLEETGUARD',
    lokasi_rak: 'B-02-01',
    satuan: 'PCS',
    stok_realtime: 12,
    stok_min: 4,
    harga_beli: 125000,
    harga_jual: 190000,
    harga_shopee: 210000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 210000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-10 16:00'
  },
  {
    id: 'part-4',
    kode_item: 'FS1242',
    nama_sparepart: 'Fuel Water Separator High Capacity Fleetguard',
    brand: 'FLEETGUARD',
    lokasi_rak: 'B-02-03',
    satuan: 'PCS',
    stok_realtime: 4,
    stok_min: 5,
    harga_beli: 210000,
    harga_jual: 320000,
    harga_shopee: 350000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 350000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-09 09:45'
  },
  {
    id: 'part-5',
    kode_item: '1000700909',
    nama_sparepart: 'Hydraulic Return Filter Element Loader',
    brand: 'LOADER',
    lokasi_rak: 'B-03-01',
    satuan: 'PCS',
    stok_realtime: 8,
    stok_min: 3,
    harga_beli: 450000,
    harga_jual: 680000,
    harga_shopee: 740000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 740000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-08 13:10'
  },
  {
    id: 'part-6',
    kode_item: '1000736512',
    nama_sparepart: 'Suction Hydraulic Filter Strainer',
    brand: 'LOADER',
    lokasi_rak: 'B-03-02',
    satuan: 'SET',
    stok_realtime: 2,
    stok_min: 3,
    harga_beli: 520000,
    harga_jual: 790000,
    harga_shopee: 860000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 860000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-07 10:15'
  },
  {
    id: 'part-7',
    kode_item: 'LF9009',
    nama_sparepart: 'Lube Combo Filter Venturi Combo Fleetguard',
    brand: 'FLEETGUARD',
    lokasi_rak: 'C-01-02',
    satuan: 'PCS',
    stok_realtime: 15,
    stok_min: 5,
    harga_beli: 310000,
    harga_jual: 460000,
    harga_shopee: 499000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 499000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-06 15:30'
  },
  {
    id: 'part-8',
    kode_item: '1R-0716',
    nama_sparepart: 'Engine Oil Filter Caterpillar D6N / D7R',
    brand: 'CATERPILLAR',
    lokasi_rak: 'C-02-04',
    satuan: 'PCS',
    stok_realtime: 10,
    stok_min: 4,
    harga_beli: 280000,
    harga_jual: 410000,
    harga_shopee: 445000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 445000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-05 11:00'
  },
  {
    id: 'part-9',
    kode_item: '600-211-1340',
    nama_sparepart: 'Fuel Filter Cartridge Komatsu PC200-8',
    brand: 'KOMATSU',
    lokasi_rak: 'D-01-01',
    satuan: 'PCS',
    stok_realtime: 3,
    stok_min: 5,
    harga_beli: 195000,
    harga_jual: 295000,
    harga_shopee: 320000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 320000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-04 14:20'
  },
  {
    id: 'part-10',
    kode_item: 'P550388',
    nama_sparepart: 'Fuel Filter Spin-On Donaldson Heavy Equipment',
    brand: 'DONALDSON',
    lokasi_rak: 'D-02-05',
    satuan: 'PCS',
    stok_realtime: 20,
    stok_min: 5,
    harga_beli: 135000,
    harga_jual: 205000,
    harga_shopee: 225000,
    admin_fee_shopee_percent: 8,
    harga_tokopedia: 225000,
    admin_fee_tokopedia_percent: 8,
    terakhir_diupdate: '2026-08-03 09:10'
  }
];

const INITIAL_USERS = [
  {
    email: 'davidwahyudi733@gmail.com',
    full_name: 'David Wahyudi',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'yusrilznl@gmail.com',
    full_name: 'Yusril Zainal',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'rismauji12@gmail.com',
    full_name: 'Muhammad Rismauji',
    role: 'OWNER'
  },
  {
    email: 'saputratimur123@gmail.com',
    full_name: 'Dony',
    role: 'ADMIN_GUDANG'
  }
];

async function syncAllToSupabase() {
  console.log('====================================================');
  console.log('   FULL SUPABASE CLOUD DATABASE AUDIT & SYNC');
  console.log('====================================================\n');

  // 1. Check and Sync Users Table
  console.log('1️⃣ Checking & Syncing Users Table...');
  const { data: dbUsers, error: userFetchErr } = await supabase.from('users').select('*');
  if (userFetchErr) {
    console.error('❌ Error reading users table:', userFetchErr.message);
  } else {
    console.log(`   Found ${dbUsers.length} user(s) in Supabase DB.`);
    for (const u of INITIAL_USERS) {
      const exists = dbUsers.some(row => row.email.toLowerCase() === u.email.toLowerCase());
      if (!exists) {
        console.log(`   + Adding missing user: ${u.email} (${u.full_name})...`);
        const { error: insErr } = await supabase.from('users').upsert([u], { onConflict: 'email' });
        if (insErr) console.error(`   ❌ Failed to insert ${u.email}:`, insErr.message);
        else console.log(`   ✓ Successfully synced ${u.email}`);
      } else {
        console.log(`   ✓ Verified existing user: ${u.email}`);
      }
    }
  }

  // 2. Check and Sync Products Table
  console.log('\n2️⃣ Checking & Syncing Products Catalog Table...');
  const { data: dbProducts, error: prodFetchErr } = await supabase.from('products').select('*');
  if (prodFetchErr) {
    console.error('❌ Error reading products table:', prodFetchErr.message);
  } else {
    console.log(`   Found ${dbProducts ? dbProducts.length : 0} product(s) in Supabase DB.`);
    
    // Check if products table supports camelCase or snake_case columns
    for (const item of INITIAL_SPAREPARTS) {
      const exists = dbProducts && dbProducts.some(p => (p.kode_item || p.kodeItem || '').toLowerCase() === item.kode_item.toLowerCase());
      if (!exists) {
        console.log(`   + Adding missing catalog item: ${item.kode_item} (${item.nama_sparepart})...`);
        
        // Try snake_case first
        let { error: insertErr } = await supabase.from('products').insert([item]);
        if (insertErr) {
          // Try camelCase fallback
          const camelItem = {
            id: item.id,
            kodeItem: item.kode_item,
            namaSparepart: item.nama_sparepart,
            brand: item.brand,
            lokasiRak: item.lokasi_rak,
            satuan: item.satuan,
            stokRealtime: item.stok_realtime,
            stokMin: item.stok_min,
            hargaBeli: item.harga_beli,
            hargaJual: item.harga_jual,
            hargaShopee: item.harga_shopee,
            adminFeeShopeePercent: item.admin_fee_shopee_percent,
            hargaTokopedia: item.harga_tokopedia,
            adminFeeTokopediaPercent: item.admin_fee_tokopedia_percent,
            terakhirDiupdate: item.terakhir_diupdate
          };
          const { error: camelErr } = await supabase.from('products').insert([camelItem]);
          if (camelErr) {
            console.error(`   ❌ Failed to insert product ${item.kode_item}:`, camelErr.message);
          } else {
            console.log(`   ✓ Successfully synced product (camelCase) ${item.kode_item}`);
          }
        } else {
          console.log(`   ✓ Successfully synced product ${item.kode_item}`);
        }
      } else {
        console.log(`   ✓ Verified existing product: ${item.kode_item}`);
      }
    }
  }

  // 3. Check Transactions Table Status
  console.log('\n3️⃣ Checking Transactions Table...');
  const { data: dbTx, error: txErr } = await supabase.from('transactions').select('*').limit(1);
  if (txErr) {
    console.log(`   ⚠️ Table "transactions": ${txErr.message} (Requires SQL table creation if empty production start)`);
  } else {
    console.log(`   ✓ Table "transactions" is active in Supabase DB.`);
  }

  // 4. Check Security Logs Table Status
  console.log('\n4️⃣ Checking Security Audit Logs Table...');
  const { data: dbLogs, error: logErr } = await supabase.from('security_logs').select('*').limit(1);
  if (logErr) {
    console.log(`   ⚠️ Table "security_logs": ${logErr.message}`);
  } else {
    console.log(`   ✓ Table "security_logs" is active in Supabase DB.`);
  }

  console.log('\n====================================================');
  console.log('   FULL SUPABASE SYNC COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

syncAllToSupabase();
