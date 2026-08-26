const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProductsSchema() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error fetching product row:', error);
  } else if (data && data.length > 0) {
    console.log('Product columns in Supabase DB:', Object.keys(data[0]));
    console.log('Sample product row:', data[0]);
  } else {
    console.log('No rows in products table.');
  }
}

inspectProductsSchema();
