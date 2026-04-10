import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Gunakan service role key untuk bisa membuat user baru dari admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, role, nim, department, phone } = await req.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, dan nama wajib diisi.' }, { status: 400 })
    }

    // 1. Buat user di auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // langsung verified, tidak perlu email konfirmasi
      user_metadata: { full_name, role: role ?? 'user', nim, department, phone },
    })

    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    // 2. Update profile (sudah dibuat otomatis oleh trigger, tapi kita upsert untuk pastikan email tersimpan)
    await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      full_name,
      role: role ?? 'user',
      nim: nim ?? null,
      department: department ?? null,
      phone: phone ?? null,
      email,
    }, { onConflict: 'id' })

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId wajib diisi.' }, { status: 400 })

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
