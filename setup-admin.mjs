import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iueikkjcakksseramewa.supabase.co';
const supabaseKey = 'sb_publishable_vJfPlSd22IAewmyrX22sLw_aSpBXV_b';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'admin@ums.ac.id';
  const password = 'password123';

  console.log('Signing up admin...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Admin Utama FKIP',
        role: 'admin',
        nim: 'ADMIN01',
        department: 'Fakultas Pendidikan'
      }
    }
  });

  if (error) {
    if (error.message.includes('registered') || error.message.includes('already exists')) {
        console.log('User already registered, logging in...');
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
            console.error('Sign In Error:', signInErr);
            return;
        }
        console.log('Logged in. Updating role to admin...');
        const { error: updateErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', signInData.user.id);
        if (updateErr) {
             console.log('Update Error:', updateErr);
        } else {
             console.log('Success! Email:', email, 'Password:', password);
        }
    } else {
        console.log('Signup error:', error);
    }
    return;
  }

  if (data.user) {
    console.log('Changing role to admin...');
    // Tunggu sedikit buffer sebelum trigger dari Supabase selesai mendaftarkan profile
    await new Promise(r => setTimeout(r, 2000));
    const { error: updateErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
    if (updateErr) {
       console.log('Update error:', updateErr);
    } else {
       console.log('Success! Admin created with Email:', email, 'Password:', password);
    }
  }
}
main();
