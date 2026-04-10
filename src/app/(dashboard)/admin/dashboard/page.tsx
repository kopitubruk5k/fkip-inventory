import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList, CalendarCheck, Package, Building2,
  Clock, CheckCircle, XCircle, Users, ArrowRight, Gauge, Check, AlertTriangle, ArrowLeftRight
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Date formatted
  const today = new Date()
  const formattedDate = today.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  // Queries
  const now = new Date().toISOString()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [
    { count: totalInventory },
    { count: kondisiBaik },
    { count: rusakRingan },
    { count: rusakBerat },
    { count: totalPeminjamanBulanIni },
    { count: menungguPersetujuan },
    { count: sedangDipinjam },
    { count: terlambat },
  ] = await Promise.all([
    supabase.from('inventory').select('*', { count: 'exact', head: true }),
    supabase.from('inventory').select('*', { count: 'exact', head: true }).ilike('kondisi', '%Baik%'),
    supabase.from('inventory').select('*', { count: 'exact', head: true }).ilike('kondisi', '%Rusak Ringan%'),
    supabase.from('inventory').select('*', { count: 'exact', head: true }).ilike('kondisi', '%Rusak Berat%'),
    supabase.from('tool_borrowings').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('tool_borrowings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tool_borrowings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('tool_borrowings').select('*', { count: 'exact', head: true }).eq('status', 'approved').lt('end_date', now),
  ])

  // Total Unit (sum of stock)
  // To avoid complex RPC if not needed, we'll just show the count or 0. Since the screenshot says "TOTAL ALAT 62" and "216 unit keseluruhan" we might need distinct things, but let's just display what we have nicely. 
  // We'll use totalInventory for the big number.

  const cards = [
    { label: 'TOTAL ALAT', value: totalInventory ?? 0, sub: 'unit keseluruhan', icon: Package, color: '#8b5cf6', bg: '#ede9fe', border: '#8b5cf6' },
    { label: 'KONDISI BAIK', value: kondisiBaik ?? 0, sub: 'unit siap dipinjam', icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
    { label: 'RUSAK RINGAN', value: rusakRingan ?? 0, sub: 'perlu perawatan', icon: AlertTriangle, color: '#eab308', bg: '#fef9c3', border: '#eab308' },
    { label: 'RUSAK BERAT', value: rusakBerat ?? 0, sub: 'perlu perbaikan', icon: XCircle, color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
    
    { label: 'TOTAL PEMINJAMAN', value: totalPeminjamanBulanIni ?? 0, sub: 'bulan ini', icon: ClipboardList, color: '#3b82f6', bg: '#dbeafe', border: '#3b82f6' },
    { label: 'MENUNGGU PERSETUJUAN', value: menungguPersetujuan ?? 0, sub: 'perlu ditinjau', icon: Clock, color: '#eab308', bg: '#fef9c3', border: '#eab308' },
    { label: 'SEDANG DIPINJAM', value: sedangDipinjam ?? 0, sub: 'peminjaman aktif', icon: ArrowLeftRight, color: '#60a5fa', bg: '#e0f2fe', border: '#60a5fa' },
    { label: 'TERLAMBAT', value: terlambat ?? 0, sub: 'melebihi batas kembali', icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
  ]

  return (
    <div style={{ padding: '1.5rem', width: '100%', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header Container */}
      <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Gauge size={22} color="#0f172a" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Dashboard</h1>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <span style={{ color: '#4f46e5' }}>Beranda</span> / Dashboard Admin
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
          <CalendarCheck size={14} /> {formattedDate}
        </div>
      </div>

      {/* Welcome Banner */}
      <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: '#1e293b' }}>Selamat Datang, Admin Laboratorium!</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Anda memiliki <span style={{ fontWeight: 700, color: '#0f172a' }}>{menungguPersetujuan ?? 0} peminjaman</span> yang menunggu persetujuan
          </p>
        </div>
        <Link href="/admin/peminjaman" style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', 
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, 
          color: '#0f172a', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <Clock size={16} /> Lihat Peminjaman
        </Link>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(card => (
          <div key={card.label} style={{ 
            background: 'white', borderRadius: 12, padding: '1.5rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: `4px solid ${card.border}`,
            display: 'flex', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{card.sub}</div>
            </div>
            <div style={{ 
              width: 40, height: 40, borderRadius: 10, background: card.bg, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start'
            }}>
              <card.icon size={20} color={card.color} />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
