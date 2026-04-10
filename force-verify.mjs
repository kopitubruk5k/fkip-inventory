import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iueikkjcakksseramewa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZWlra2pjYWtrc3NlcmFtZXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY0NzY5MSwiZXhwIjoyMDkxMjIzNjkxfQ.Si2ZvH6WMqOB_tjfTwJ25Dc9M-lDGDafigNUrDRy_SA';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyAdmin() {
  console.log("Fetching users...");
  
  // Ambil semua pengguna dari sistem otentikasi
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
     console.error('Error fetching users:', authError.message);
     return;
  }
  
  const adminUser = users.find(u => u.email === 'admin@ums.ac.id');
  
  if (adminUser) {
      console.log('Admin user found:', adminUser.id);
      
      // Update data auth secara paksa (konfirmasi email)
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { email_confirm: true }
      );
      
      if (error) {
          console.error("Gagal verifikasi:", error.message);
      } else {
          console.log("BERHASIL! Akun admin berhasil diverifikasi dari backend.");
      }
  } else {
      console.log('User admin@ums.ac.id tidak ditemukan.')
  }
}
verifyAdmin();
