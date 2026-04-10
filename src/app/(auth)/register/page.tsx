'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Package, User, Lock, EyeOff, Building2, Phone, Hash, Mail, UserPlus, AlertCircle, CheckCircle, Home, LogIn } from 'lucide-react'
import { serverSideRegister } from './actions'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    nim: '',
    department: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama.')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Memanggil Server Action untuk Bypass Email Verification
    const res = await serverSideRegister(form)

    if (!res.success) {
      setError(res.error || 'Gagal mendaftar akun')
      setLoading(false)
      return
    }

    // Akun sudah dibuat dan auto-confirmed, lakukan login otomatis
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    if (signInError) {
      setError('Akun berhasil dibuat namun gagal login otomatis. Mengalihkan...')
      setLoading(false)
      setTimeout(() => router.push('/login'), 2500)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const departments = [
    'Pendidikan Akuntansi',
    'Pendidikan Pancasila dan Kewarganegaraan (PPKn)',
    'Pendidikan Bahasa dan Sastra Indonesia',
    'Pendidikan Bahasa Inggris',
    'Pendidikan Matematika',
    'Pendidikan Biologi',
    'Pendidikan Guru Sekolah Dasar (PGSD)',
    'Pendidikan Guru Pendidikan Anak Usia Dini (PAUD)',
    'Pendidikan Geografi',
    'Pendidikan Teknik Informatika (PTI)',
    'Pendidikan Olahraga',
  ]

  // Komponen Input Kustom
  const InputGroup = ({ icon: Icon, label, children }: any) => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.4rem 0.75rem', borderRadius: 8, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.1rem' }}>
        <Icon size={10} /> {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )

  const inputStyle = { width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', padding: '0' }
  const selectStyle = { ...inputStyle, width: '100%', cursor: 'pointer' }

  if (success) {
    return (
      <div style={{ width: '100%', maxWidth: 450, background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.2)' }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>Registrasi Berhasil!</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Akun Anda berhasil dibuat. Mengalihkan ke dashboard...
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 450, background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
      {/* Top Banner */}
      <div style={{ background: '#4f46e5', padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <Package size={22} color="#4f46e5" />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem', letterSpacing: '0.02em' }}>Pendaftaran Akun FKIP</h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Universitas Muhammadiyah Surakarta</p>
      </div>

      {/* Body Area */}
      <div style={{ padding: '1.5rem' }}>
        
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem', color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <InputGroup icon={User} label="Nama Lengkap">
             <input id="full_name" name="full_name" type="text" placeholder="Masukkan nama" required value={form.full_name} onChange={handleChange} style={inputStyle} />
          </InputGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <InputGroup icon={Hash} label="NIM">
               <input id="nim" name="nim" type="text" placeholder="Masukkan NIM" value={form.nim} onChange={handleChange} style={inputStyle} />
            </InputGroup>
            
            <InputGroup icon={Phone} label="No. WhatsApp">
               <input id="phone" name="phone" type="tel" placeholder="08xx..." value={form.phone} onChange={handleChange} style={inputStyle} />
            </InputGroup>
          </div>

          <InputGroup icon={Building2} label="Program Studi">
            <select id="department" name="department" value={form.department} onChange={handleChange} style={selectStyle}>
              <option value="">-- Pilih Program Studi --</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </InputGroup>

          <InputGroup icon={Mail} label="Email Akademik">
             <input id="email" name="email" type="email" placeholder="nama@ums.ac.id" required value={form.email} onChange={handleChange} style={inputStyle} />
          </InputGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <InputGroup icon={Lock} label="Password">
              <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 kar" required value={form.password} onChange={handleChange} style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', marginLeft: 'auto' }}><EyeOff size={14} /></button>
            </InputGroup>

            <InputGroup icon={Lock} label="Konfirmasi Pwd">
               <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Ulangi pwd" required value={form.confirmPassword} onChange={handleChange} style={inputStyle} />
               <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', marginLeft: 'auto' }}><EyeOff size={14} /></button>
            </InputGroup>
          </div>

          <button type="submit" disabled={loading} style={{
            background: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: 8, fontWeight: 700,
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', marginTop: '0.5rem'
          }}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} /> : <UserPlus size={16} />}
            {loading ? 'Memproses...' : 'Daftar Akun'}
          </button>
        </form>

      </div>

      {/* Footer Links */}
      <div style={{ borderTop: '1px solid #f1f5f9', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link href="/" style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Home size={12} /> Beranda
        </Link>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <Link href="/login" style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LogIn size={12} /> Sudah punya akun? Masuk
        </Link>
      </div>
    </div>
  )
}
