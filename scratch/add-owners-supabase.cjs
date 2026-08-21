const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addAdminGudang() {
  console.log('--- Adding Admin Gudang to Supabase DB ---');

  const newUser = {
    email: 'saputratimur123@gmail.com',
    full_name: 'Dony',
    role: 'ADMIN_GUDANG'
  };

  const { data, error } = await supabase
    .from('users')
    .upsert([newUser], { onConflict: 'email' })
    .select();

  if (error) {
    console.error(`❌ Error inserting ${newUser.email}:`, error.message);
  } else {
    console.log(`✅ Successfully added/updated ${newUser.email}:`, data);
  }

  // Verify all users in table
  const { data: allUsers, error: listErr } = await supabase.from('users').select('*');
  if (!listErr) {
    console.log('\n--- Current Active Users in Supabase DB ---');
    console.log(JSON.stringify(allUsers, null, 2));
  }
}

addAdminGudang();
