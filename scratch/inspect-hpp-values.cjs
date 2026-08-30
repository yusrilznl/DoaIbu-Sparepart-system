const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectHpp() {
  console.log('Fetching all products from Supabase...');
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Total products found in Supabase DB: ${products.length}`);
  
  let withHpp = 0;
  let zeroHpp = 0;

  products.forEach((p, idx) => {
    const hpp = p.harga_beli !== undefined ? p.harga_beli : (p.hargaBeli !== undefined ? p.hargaBeli : 0);
    const jual = p.harga_jual !== undefined ? p.harga_jual : (p.hargaJual !== undefined ? p.hargaJual : 0);
    const kode = p.kode_item || p.kodeItem || `Item-${idx+1}`;
    const nama = p.nama_sparepart || p.namaSparepart || 'No Name';

    if (Number(hpp) > 0) {
      withHpp++;
      console.log(`[HPP ${hpp}] ${kode} - ${nama} (Jual: ${jual})`);
    } else {
      zeroHpp++;
      console.log(`[HPP 0] ${kode} - ${nama} (Jual: ${jual})`);
    }
  });

  console.log('\n--- SUMMARY ---');
  console.log(`Products with HPP > 0: ${withHpp}`);
  console.log(`Products with HPP = 0: ${zeroHpp}`);
}

inspectHpp();
