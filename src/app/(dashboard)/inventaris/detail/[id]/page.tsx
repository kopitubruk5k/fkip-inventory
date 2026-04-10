'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Package, MapPin, Tag, Wrench, Info,
  ShoppingBag, Plus, Minus, Send, Check, AlertTriangle,
  Image as ImageIcon, Calendar, Hash
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  merk: string | null
  category: string
  quantity: number
  available: number
  condition: string
  location: string
  description: string
  image_url: string | null
  tahun_beli: number | null
}

const CONDITION_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  baik:      { bg: '#dcfce7', color: '#15803d', label: 'Baik' },
  perbaikan: { bg: '#fef3c7', color: '#b45309', label: 'Sedang Perbaikan' },
  rusak:     { bg: '#fee2e2', color: '#dc2626', label: 'Rusak' },
}

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  elektronik: { bg: '#dbeafe', color: '#1d4ed8' },
  furnitur:   { bg: '#ede9fe', color: '#6d28d9' },
  lab:        { bg: '#dcfce7', color: '#15803d' },
  olahraga:   { bg: '#fef9c3', color: '#854d0e' },
  media:      { bg: '#e0f2fe', color: '#0369a1' },
  lainnya:    { bg: '#f1f5f9', color: '#475569' },
}

export default function DetailAlatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]
  })
  const [purpose, setPurpose] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    supabase.from('inventory').select('*').eq('id', id).single()
      .then(({ data }) => { setItem(data); setLoading(false) })
  }, [id])

  const maxEnd = new Date(startDate)
  maxEnd.setDate(maxEnd.getDate() + 7)

  const canBorrow = item && item.available > 0 && item.condition === 'baik'
  const percent = item ? (item.available / item.quantity) * 100 : 0
  const condStyle = CONDITION_STYLE[item?.condition ?? 'baik'] ?? CONDITION_STYLE.baik
  const catStyle = CAT_COLORS[item?.category ?? 'lainnya'] ?? CAT_COLORS.lainnya

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!purpose.trim()) { setError('Isi keperluan peminjaman.'); return }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('tool_borrowings').insert({
      user_id: user.id,
      inventory_id: id,
      quantity: qty,
      start_date: startDate,
      end_date: endDate,
      purpose,
      status: 'pending',
    })

    if (err) { setError(err.message); setSubmitting(false); return }
    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderTopColor: '#5b4fe8' }} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '5rem' }}>
        <Package size={48} color="#d1d5db" />
        <h2 style={{ color: '#64748b', marginTop: '1rem' }}>Alat tidak ditemukan</h2>
        <Link href="/inventaris"><button className="btn btn-primary" style={{ marginTop: '1rem' }}>← Kembali</button></Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="page-content" style={{ maxWidth: 480, textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Check size={36} color="#16a34a" />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#15803d', marginBottom: '0.5rem' }}>Berhasil Diajukan!</h2>
        <p style={{ color: '#64748b' }}>Peminjaman <strong>{item.name}</strong> sedang menunggu persetujuan admin.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link href="/peminjaman-saya">
            <button className="btn btn-primary">Lihat Peminjaman Saya</button>
          </Link>
          <Link href="/inventaris">
            <button className="btn btn-secondary">Kembali ke Katalog</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#94a3b8' }}>
        <Link href="/inventaris" style={{ color: '#5b4fe8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <ArrowLeft size={14} /> Inventaris Alat
        </Link>
        <span>/</span>
        <span style={{ color: '#64748b' }}>{item.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Image */}
          <div style={{
            borderRadius: 16, overflow: 'hidden', background: '#f8fafc',
            border: '1px solid #e2e8f0', height: 280, position: 'relative',
            backgroundImage: item.image_url ? `url(${item.image_url})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {!item.image_url && <ImageIcon size={56} color="#d1d5db" />}
            {/* Condition Badge */}
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <span style={{ background: condStyle.bg, color: condStyle.color, fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                {condStyle.label}
              </span>
            </div>
          </div>

          {/* Info Card */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            {/* Category */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: catStyle.bg, color: catStyle.color, fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 6, marginBottom: '0.75rem' }}>
              <Tag size={11} /> {item.category}
            </span>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', lineHeight: 1.3 }}>{item.name}</h1>
            {item.merk && <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Merk: <strong style={{ color: '#334155' }}>{item.merk}</strong></div>}

            {/* Description */}
            {item.description && (
              <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.7, marginBottom: '1.25rem', padding: '0.85rem', background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #5b4fe8' }}>
                {item.description}
              </div>
            )}

            {/* Detail grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {[
                { icon: <MapPin size={15} color="#5b4fe8" />, label: 'Lokasi', val: item.location || '–' },
                { icon: <Calendar size={15} color="#5b4fe8" />, label: 'Tahun Beli', val: item.tahun_beli?.toString() || '–' },
                { icon: <Hash size={15} color="#5b4fe8" />, label: 'Total Stok', val: `${item.quantity} unit` },
                { icon: <Wrench size={15} color="#5b4fe8" />, label: 'Kondisi', val: condStyle.label },
              ].map(d => (
                <div key={d.label} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: '#f8fafc', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ marginTop: 1 }}>{d.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>{d.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Availability bar */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Ketersediaan</span>
                <span style={{ fontWeight: 700, color: canBorrow ? '#16a34a' : '#dc2626' }}>{item.available}/{item.quantity} unit</span>
              </div>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: percent > 50 ? '#10b981' : percent > 20 ? '#f59e0b' : '#ef4444', borderRadius: 999 }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Borrow Form */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={16} color="#5b4fe8" /> Ajukan Peminjaman
            </div>

            {!canBorrow ? (
              <div style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <AlertTriangle size={24} color="#dc2626" />
                </div>
                <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.4rem' }}>Tidak Tersedia</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  {item.condition !== 'baik' ? `Alat sedang dalam kondisi ${item.condition}` : 'Stok alat habis saat ini'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#dc2626', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="label">Jumlah Unit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', width: 32, textAlign: 'center', color: '#0f172a' }}>{qty}</span>
                    <button type="button" onClick={() => setQty(q => Math.min(item.available, q + 1))}
                      style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                      <Plus size={14} />
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>maks {item.available} unit</span>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <label className="label">Tanggal Pinjam</label>
                  <input className="input" type="date" value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Tanggal Kembali</label>
                  <input className="input" type="date" value={endDate}
                    min={startDate} max={maxEnd.toISOString().split('T')[0]}
                    onChange={e => setEndDate(e.target.value)} required />
                  <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: '0.2rem' }}>Maksimal 7 hari dari tanggal pinjam</div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="label">Keperluan / Tujuan <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="textarea" placeholder="Jelaskan tujuan peminjaman..." value={purpose}
                    onChange={e => setPurpose(e.target.value)} required style={{ minHeight: 80 }} />
                </div>

                <button type="submit" disabled={submitting}
                  style={{ width: '100%', background: '#5b4fe8', color: 'white', border: 'none', borderRadius: 10, padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}>
                  {submitting
                    ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} /> Memproses...</>
                    : <><Send size={16} /> Ajukan Peminjaman</>}
                </button>
              </form>
            )}
          </div>

          {/* Info note */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '0.85rem 1rem', marginTop: '0.85rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <Info size={15} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', lineHeight: 1.6 }}>
              Pengajuan akan diproses oleh admin dalam 1×24 jam. Bawa <strong>KTM</strong> saat pengambilan alat.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
