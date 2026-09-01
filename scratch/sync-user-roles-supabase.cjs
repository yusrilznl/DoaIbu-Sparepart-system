const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncUserRoles() {
  console.log('Updating user roles in Supabase Cloud database...');

  const usersToSync = [
    {
      email: 'rismauji12@gmail.com',
      full_name: 'Muhammad Rismauji',
      role: 'OWNER'
    },
    {
      email: 'yusrilznl@gmail.com',
      full_name: 'Yusril Zainal',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'davidwahyudi733@gmail.com',
      full_name: 'David Wahyudi',
      role: 'SUPER_ADMIN'
    }
  ];

  for (const u of usersToSync) {
    console.log(`Syncing ${u.email} as ${u.role}...`);
    const { error } = await supabase.from('users').upsert([u], { onConflict: 'email' });
    if (error) {
      console.error(`Error syncing ${u.email}:`, error.message);
    } else {
      console.log(`✓ Successfully updated ${u.email}`);
    }
  }

  console.log('Done!');
}

syncUserRoles();
