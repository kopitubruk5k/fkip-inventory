import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iueikkjcakksseramewa.supabase.co';
const supabaseKey = 'sb_publishable_vJfPlSd22IAewmyrX22sLw_aSpBXV_b';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@ums.ac.id',
    password: 'password123'
  });
  if (error) {
     console.error('Login Error:', error.message);
  } else {
     console.log('Login Success. User:', data.user.id);
  }
}
check();
