const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanDummyUsers() {
  console.log('Cleaning up dummy demo accounts from Supabase Cloud DB...');

  const dummyEmails = [
    'deputi.direktur@doaibusparepart.com',
    'admin.gudang@doaibusparepart.com',
    'petugas.mgl@doaibusparepart.com',
    'auditor@doaibusparepart.com'
  ];

  for (const email of dummyEmails) {
    const { error } = await supabase.from('users').delete().eq('email', email);
    if (error) console.error(`Failed to delete ${email}:`, error.message);
    else console.log(`✓ Removed dummy account: ${email}`);
  }

  // Ensure Dony (saputratimur123@gmail.com) is inserted in Supabase
  const realUsers = [
    {
      email: 'yusrilznl@gmail.com',
      full_name: 'Yusril Zainal',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'davidwahyudi733@gmail.com',
      full_name: 'David Wahyudi',
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

  for (const u of realUsers) {
    const { error } = await supabase.from('users').upsert([u], { onConflict: 'email' });
    if (error) console.error(`Failed to upsert ${u.email}:`, error.message);
    else console.log(`✓ Verified real user account: ${u.email} (${u.full_name} - ${u.role})`);
  }

  console.log('\nFinal User List in Supabase DB:');
  const { data } = await supabase.from('users').select('*');
  console.log(data);
}

cleanDummyUsers();
