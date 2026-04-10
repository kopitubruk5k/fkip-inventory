import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Package, Building2, ClipboardList, CheckCircle,
  Clock, Inbox, RotateCcw, Zap, Info, Plus
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: myBorrowings } = await supabase
    .from('tool_borrowings').select('id, status, created_at, inventory_id').eq('user_id', user.id)

  const { data: inventoryAvail } = await supabase
    .from('inventory').select('available')

  const totalAvailable = inventoryAvail?.reduce((s, i) => s + (i.available ?? 0), 0) ?? 0
  const totalBorrowings = myBorrowings?.length ?? 0
  const pendingCount = myBorrowings?.filter(b => b.status === 'pending').length ?? 0
  const approvedCount = myBorrowings?.filter(b => b.status === 'approved').length ?? 0
  const returnedCount = myBorrowings?.filter(b => b.status === 'returned').length ?? 0
  const rejectedCount = myBorrowings?.filter(b => b.status === 'rejected').length ?? 0

  // Active borrowings (approved status)
  const activeBorrowings = myBorrowings?.filter(b => b.status === 'approved') ?? []

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="page-content" style={{ maxWidth: 1200 }}>

      {/* Top bar: title + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={22} color="#5b4fe8" /> Dashboard
          </h1>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>Beranda / Dashboard Mahasiswa</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
          📅 {today}
        </div>
      </div>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',
        borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(99,102,241,0.25)'
      }}>
        <div style={{ color: 'white' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            😊 Selamat Datang, {profile?.full_name ?? 'Mahasiswa'}!
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.85, marginBottom: '0.25rem' }}>
            Sistem Inventaris dan Peminjaman Alat Laboratorium PTI UMS.
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
            Email: {user.email} {profile?.nim ? `• NIM: ${profile.nim}` : ''}
          </div>
        </div>
        <Link href="/inventaris" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button style={{
            background: 'white', color: '#5b4fe8', border: 'none', borderRadius: 10,
            padding: '0.65rem 1.25rem', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}>
            <Plus size={16} /> Ajukan Peminjaman Baru
          </button>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Menunggu Persetujuan', val: pendingCount, icon: <Clock size={20} color="#f59e0b" />, iconBg: 'rgba(245,158,11,0.12)', border: '#f59e0b', href: '/peminjaman-saya' },
          { label: 'Disetujui', val: approvedCount, icon: <CheckCircle size={20} color="#6366f1" />, iconBg: 'rgba(99,102,241,0.12)', border: '#6366f1', href: '/peminjaman-saya' },
          { label: 'Sedang Dipinjam', val: approvedCount, icon: <Package size={20} color="#8b5cf6" />, iconBg: 'rgba(139,92,246,0.12)', border: '#8b5cf6', href: '/peminjaman-saya' },
          { label: 'Sudah Dikembalikan', val: returnedCount, icon: <RotateCcw size={20} color="#10b981" />, iconBg: 'rgba(16,185,129,0.12)', border: '#10b981', href: '/peminjaman-saya' },
        ].map(c => (
          <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: 14, padding: '1.1rem 1.25rem',
              border: '1px solid #e2e8f0', cursor: 'pointer',
              transition: 'box-shadow 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>→</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>

        {/* Left: Peminjaman Aktif */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={16} color="#5b4fe8" /> Peminjaman Aktif
            </div>
            <Link href="/peminjaman-saya" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.35rem 0.9rem', fontSize: '0.78rem', color: '#5b4fe8', fontWeight: 600, cursor: 'pointer' }}>
                Lihat Semua
              </button>
            </Link>
          </div>
          <div style={{ padding: '1.25rem' }}>
            {activeBorrowings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Inbox size={40} color="#d1d5db" style={{ marginBottom: '0.75rem' }} />
                <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem' }}>Belum ada peminjaman aktif</div>
                <Link href="/inventaris" style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: '#5b4fe8', color: 'white', border: 'none', borderRadius: 10,
                    padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                  }}>
                    <Plus size={15} /> Ajukan Peminjaman
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeBorrowings.slice(0, 5).map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={16} color="#6366f1" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Peminjaman Alat</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(b.created_at).toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>Aktif</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Aksi Cepat */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={15} color="#f59e0b" /> Aksi Cepat
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Link href="/inventaris" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '0.65rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, color: '#5b4fe8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Package size={14} /> Lihat Daftar Alat
                </button>
              </Link>
              <Link href="/ruangan" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '0.65rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, color: '#5b4fe8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Building2 size={14} /> Lihat Ruangan
                </button>
              </Link>
              <Link href="/inventaris" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '0.65rem', background: '#5b4fe8', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Plus size={14} /> Ajukan Peminjaman
                </button>
              </Link>
            </div>
          </div>

          {/* Informasi */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={15} color="#64748b" /> Informasi
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { icon: '✅', label: 'Total Alat Tersedia', val: `${totalAvailable} unit`, color: '#15803d' },
                { icon: '⏳', label: 'Peminjaman Menunggu', val: `${pendingCount} pengajuan`, color: '#b45309' },
                { icon: '📋', label: 'Total Peminjaman', val: `${totalBorrowings} kali`, color: '#1d4ed8' },
                { icon: '❌', label: 'Ditolak', val: `${rejectedCount} pengajuan`, color: '#dc2626' },
              ].map(info => (
                <div key={info.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem' }}>{info.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>{info.label}:</div>
                      <div style={{ fontSize: '0.78rem', color: info.color }}>{info.val}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
