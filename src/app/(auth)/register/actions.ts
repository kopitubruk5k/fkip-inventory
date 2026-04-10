'use server'

import { createClient } from '@supabase/supabase-js'

export async function serverSideRegister(form: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Bypass registration verification by using Admin API and email_confirm: true
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: {
        full_name: form.full_name,
        nim: form.nim,
        department: form.department,
        phone: form.phone,
        role: 'user',
      }
    })

    if (error) {
      console.error('Registration bypass error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan internal server' }
  }
}
