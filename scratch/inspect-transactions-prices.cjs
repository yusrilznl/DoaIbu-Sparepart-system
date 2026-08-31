const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTransactions() {
  console.log('Inspecting transactions details...');
  const { data: txList, error } = await supabase.from('transactions').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${txList.length} transactions:`);
  txList.forEach(t => {
    console.log(`\nTx No: ${t.no_transaksi || t.noTransaksi} (${t.jenis_transaksi || t.jenisTransaksi})`);
    let items = t.items || [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) {}
    }
    if (Array.isArray(items)) {
      items.forEach(item => {
        console.log(`   - Item: ${item.kodeItem || item.kode_item} | Qty: ${item.jumlahTerima || item.jumlahKirim || 0} | Price/Beli: ${item.hargaBeli || item.harga_beli || 0} | Jual: ${item.hargaJual || item.harga_jual || 0}`);
      });
    } else {
      console.log('   Raw items:', items);
    }
  });
}

inspectTransactions();
