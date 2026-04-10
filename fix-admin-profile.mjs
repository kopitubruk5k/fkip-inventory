import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iueikkjcakksseramewa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZWlra2pjYWtrc3NlcmFtZXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY0NzY5MSwiZXhwIjoyMDkxMjIzNjkxfQ.Si2ZvH6WMqOB_tjfTwJ25Dc9M-lDGDafigNUrDRy_SA';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfile() {
  console.log("Fetching user...");
  const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error(authErr);
    return;
  }
  
  const adminUser = users.find(u => u.email === 'admin@ums.ac.id');
  
  if (adminUser) {
    console.log("Upserting profile for admin:", adminUser.id);
    const { error } = await supabaseAdmin.from('profiles').upsert({
      id: adminUser.id,
      full_name: 'Admin Utama FKIP',
      nim: 'ADMIN01',
      department: 'Fakultas Pendidikan',
      role: 'admin'
    });
    
    if (error) {
      console.error('Error fixing profile:', error);
    } else {
      console.log('Profile fixed successfully!');
    }
  } else {
    console.log('User not found.');
  }
}
fixProfile();
