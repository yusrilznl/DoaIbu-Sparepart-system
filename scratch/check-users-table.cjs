const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dggjscnevyktewtwigxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2pzY25ldnlrdGV3dHdpZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY4OTcsImV4cCI6MjEwMjI5Mjg5N30.SOeVak7WiHcupb1ym1l8vhKTl20gZmNm8Zt_uvKnY38';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('Fetching users table from Supabase Cloud...');
  const { data: users, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} users in Supabase:`);
  console.log(JSON.stringify(users, null, 2));
}

checkUsers();
