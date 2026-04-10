'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User, BookOpen, UserPlus, Trash2, X, Check,
  Shield, AlertTriangle, Phone, Hash, Mail, Lock, Search
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  role: string
  nim: string | null
  department: string | null
  phone: string | null
  email: string | null
  created_at: string
}

const DEPT_OPTIONS = [
  'Pendidikan Bahasa Inggris', 'Pendidikan Bahasa Indonesia', 'Pendidikan Matematika',
  'Pendidikan Biologi', 'Pendidikan Akuntansi', 'Pendidikan Ekonomi',
  'Pendidikan Guru SD', 'Pendidikan Anak Usia Dini', 'Pendidikan Olahraga',
  'Pendidikan Guru SMK', 'Bimbingan Konseling',
]

export default function AdminPenggunaPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('semua')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('user')
  const [nim, setNim] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')

  // Confirm delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setProfiles((data ?? []) as Profile[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = profiles.filter(p => {
    const matchRole = filterRole === 'semua' || p.role === filterRole
    const matchSearch = !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) || p.nim?.includes(search)
    return matchRole && matchSearch
  })

  function resetForm() {
    setEmail(''); setPassword(''); setFullName(''); setRole('user')
    setNim(''); setDepartment(''); setPhone(''); setFormError(''); setFormSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!email || !password || !fullName) { setFormError('Email, password, dan nama lengkap wajib diisi.'); return }
    if (password.length < 6) { setFormError('Password minimal 6 karakter.'); return }

    setSubmitting(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role, nim, department, phone }),
    })
    const json = await res.json()
    if (!res.ok) { setFormError(json.error); setSubmitting(false); return }

    setFormSuccess(true)
    setSubmitting(false)
    load()
    setTimeout(() => { resetForm(); setShowModal(false) }, 1500)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    })
    setDeleteId(null)
    setDeleting(false)
    load()
  }

  const totalAdmin = profiles.filter(p => p.role === 'admin').length
  const totalUser = profiles.filter(p => p.role === 'user').length

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>Daftar Pengguna</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Kelola akun mahasiswa dan admin sistem</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }}
          style={{ background: '#5b4fe8', color: 'white', border: 'none', borderRadius: 12, padding: '0.65rem 1.25rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(91,79,232,0.3)' }}>
          <UserPlus size={16} /> Tambah Pengguna
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Pengguna', value: profiles.length, icon: <User size={22} color="#5b4fe8" />, bg: '#ede9fe', color: '#5b4fe8' },
          { label: 'Mahasiswa', value: totalUser, icon: <BookOpen size={22} color="#0369a1" />, bg: '#e0f2fe', color: '#0369a1' },
          { label: 'Administrator', value: totalAdmin, icon: <Shield size={22} color="#b45309" />, bg: '#fef9c3', color: '#b45309' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input" type="text" placeholder="Cari nama, email, NIM..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.1rem', height: '2.2rem', fontSize: '0.83rem', background: '#f8fafc' }} />
        </div>
        {['semua', 'user', 'admin'].map(r => (
          <button key={r} onClick={() => setFilterRole(r)} style={{
            padding: '0.4rem 1rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
            borderColor: filterRole === r ? '#5b4fe8' : '#e2e8f0',
            background: filterRole === r ? '#5b4fe8' : 'white',
            color: filterRole === r ? 'white' : '#64748b', transition: 'all 0.15s'
          }}>
            {r === 'semua' ? 'Semua' : r === 'user' ? 'Mahasiswa' : 'Admin'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '1rem', alignItems: 'center' }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: '#5b4fe8' }} />
          <span style={{ color: '#94a3b8' }}>Memuat data...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1px dashed #e2e8f0', borderRadius: 14, padding: '4rem', textAlign: 'center' }}>
          <User size={42} color="#d1d5db" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#94a3b8' }}>Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Pengguna', 'Email', 'Role', 'NIM', 'Program Studi', 'Telepon', 'Tanggal Daftar', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: p.role === 'admin' ? '#ede9fe' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: p.role === 'admin' ? '#5b4fe8' : '#0369a1', flexShrink: 0 }}>
                        {p.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{p.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#475569' }}>{p.email || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      background: p.role === 'admin' ? '#fef9c3' : '#dcfce7',
                      color: p.role === 'admin' ? '#854d0e' : '#15803d',
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase'
                    }}>
                      {p.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      {p.role === 'admin' ? 'Admin' : 'Mahasiswa'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{p.nim || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.department || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{p.phone || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {deleteId === p.id ? (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleDelete(p.id)} disabled={deleting}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>
                          {deleting ? '...' : 'Hapus?'}
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer', color: '#64748b' }}>Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(p.id)}
                        style={{ background: '#fee2e2', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Pengguna */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#5b4fe8,#7c3aed)', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                <UserPlus size={18} /> Tambah Pengguna Baru
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="white" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {formSuccess && (
                <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#15803d', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Check size={16} /> Pengguna berhasil ditambahkan!
                </div>
              )}

              {formError && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#dc2626', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertTriangle size={16} /> {formError}
                </div>
              )}

              {/* Nama & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label"><User size={12} style={{ display:'inline', marginRight:4 }}/>Nama Lengkap *</label>
                  <input className="input" type="text" placeholder="Nama lengkap..." value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="label"><Mail size={12} style={{ display:'inline', marginRight:4 }}/>Email *</label>
                  <input className="input" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label"><Lock size={12} style={{ display:'inline', marginRight:4 }}/>Password *</label>
                  <input className="input" type="password" placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="label"><Shield size={12} style={{ display:'inline', marginRight:4 }}/>Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[{ val: 'user', label: '👤 Mahasiswa' }, { val: 'admin', label: '🛡️ Admin' }].map(r => (
                    <button key={r.val} type="button" onClick={() => setRole(r.val)} style={{
                      flex: 1, padding: '0.6rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                      border: '2px solid', borderColor: role === r.val ? '#5b4fe8' : '#e2e8f0',
                      background: role === r.val ? '#ede9fe' : 'white', color: role === r.val ? '#5b4fe8' : '#64748b',
                      transition: 'all 0.15s'
                    }}>{r.label}</button>
                  ))}
                </div>
              </div>

              {/* NIM, Prodi, Telepon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label"><Hash size={12} style={{ display:'inline', marginRight:4 }}/>NIM</label>
                  <input className="input" type="text" placeholder="NIM mahasiswa" value={nim} onChange={e => setNim(e.target.value)} />
                </div>
                <div>
                  <label className="label"><Phone size={12} style={{ display:'inline', marginRight:4 }}/>No. Telepon</label>
                  <input className="input" type="text" placeholder="08xx-xxxx-xxxx" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label"><BookOpen size={12} style={{ display:'inline', marginRight:4 }}/>Program Studi</label>
                  <select className="select" value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="">-- Pilih Program Studi --</option>
                    {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 2, padding: '0.75rem', borderRadius: 10, border: 'none', background: '#5b4fe8', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} /> Menyimpan...</> : <><UserPlus size={16} /> Buat Akun</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
