const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllDataSources() {
  console.log('===================================================');
  console.log('Searching Supabase & Data Sources for Rismauji HPP');
  console.log('===================================================\n');

  // 1. Check Supabase products table
  console.log('1️⃣ Checking Supabase products table...');
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) console.error('Error products:', pErr.message);
  else {
    console.log(`Found ${products.length} products.`);
    const nonZeroHpp = products.filter(p => (p.harga_beli || p.hargaBeli || 0) > 0);
    console.log(`Products with non-zero HPP: ${nonZeroHpp.length}`);
    nonZeroHpp.forEach(p => console.log(`   - ${p.kode_item || p.kodeItem}: HPP = ${p.harga_beli || p.hargaBeli}`));
  }

  // 2. Check Supabase transactions table
  console.log('\n2️⃣ Checking Supabase transactions table...');
  const { data: transactions, error: tErr } = await supabase.from('transactions').select('*');
  if (tErr) console.log('Transactions table info:', tErr.message);
  else if (transactions) {
    console.log(`Found ${transactions.length} transactions.`);
    transactions.forEach(t => console.log('Tx:', t.no_transaksi || t.noTransaksi, t.petugas || t.sales_person));
  }

  // 3. Check Supabase security_logs table
  console.log('\n3️⃣ Checking Supabase security_logs table...');
  const { data: logs, error: lErr } = await supabase.from('security_logs').select('*');
  if (lErr) console.log('Security logs table info:', lErr.message);
  else if (logs) {
    console.log(`Found ${logs.length} security log entries.`);
    logs.forEach(l => {
      if (JSON.stringify(l).toLowerCase().includes('harga') || JSON.stringify(l).toLowerCase().includes('hpp') || JSON.stringify(l).toLowerCase().includes('rismauji')) {
        console.log('Log entry:', l.action || l.aktivitas, l.notes || l.catatan);
      }
    });
  }
}

checkAllDataSources();
