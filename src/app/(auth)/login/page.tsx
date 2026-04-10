'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Package, User, Lock, EyeOff, LogIn, AlertCircle, Home, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email atau password salah. Silakan coba lagi.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Placeholder for Google Login
  const handleGoogleLogin = () => {
    alert("Login Google belum dikonfigurasi saat ini. Silakan gunakan login manual.")
  }

  return (
    <div style={{
      width: '100%', maxWidth: 400,
      background: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    }}>
      {/* Top Banner */}
      <div style={{
        background: '#4f46e5', // or linear gradient
        padding: '2rem 1rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* White circle icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          <Package size={24} color="#4f46e5" />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem', letterSpacing: '0.02em' }}>
          Inventaris Lab FKIP
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Universitas Muhammadiyah Surakarta
        </p>
      </div>

      {/* Body Area */}
      <div style={{ padding: '1.5rem' }}>
        
        {/* Google Alert/Banner */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #dcfce7',
          padding: '0.65rem',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.75rem', color: '#166534', fontWeight: 600,
          marginBottom: '0.85rem'
        }}>
          <div style={{ background: '#bbf7d0', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
          Mahasiswa? Login cepat dengan akun Google
        </div>

        {/* Google Login Button */}
        <button onClick={handleGoogleLogin} style={{
          width: '100%', padding: '0.65rem',
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#333',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          cursor: 'pointer', marginBottom: '1.25rem'
        }}>
          {/* Simple Google G icon SVG */}
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          Masuk dengan Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ padding: '0 0.8rem', fontSize: '0.7rem', color: '#94a3b8' }}>atau login manual</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem', color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Input Box Design Custom */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.4rem 0.75rem', borderRadius: 8, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.1rem' }}>
              <User size={10} /> Email / Username
            </div>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Masukkan email..."
              required
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', padding: '0' }}
            />
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.4rem 0.75rem', borderRadius: 8, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.1rem' }}>
              <Lock size={10} /> Password
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', padding: '0' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <EyeOff size={14} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            background: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: 8, fontWeight: 700,
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', marginTop: '0.5rem'
          }}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} /> : <LogIn size={16} />}
            {loading ? 'Masuk...' : 'Masuk'}
          </button>

        </form>

      </div>

      {/* Footer Links */}
      <div style={{ borderTop: '1px solid #f1f5f9', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link href="/" style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Home size={12} /> Beranda
        </Link>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <Link href="/register" style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserPlus size={12} /> Daftar Baru
        </Link>
      </div>

    </div>
  )
}
