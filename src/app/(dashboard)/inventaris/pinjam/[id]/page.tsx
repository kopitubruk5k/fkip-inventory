'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Calendar, Hash, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface InventoryItem {
  id: string
  name: string
  category: string
  available: number
  quantity: number
  condition: string
  location: string
  description: string
}

export default function PinjamPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    quantity: 1,
    start_date: today,
    end_date: today,
    purpose: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('inventory').select('*').eq('id', itemId).single()
      setItem(data)
      setLoading(false)
    }
    load()
  }, [itemId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.quantity || !form.start_date || !form.end_date || !form.purpose.trim()) {
      setError('Mohon lengkapi semua isian terlebih dahulu!')
      return
    }

    if (form.end_date < form.start_date) {
      setError('Tanggal selesai harus setelah tanggal mulai.')
      return
    }
    if (form.quantity > (item?.available ?? 0)) {
      setError(`Stok tidak cukup. Tersedia: ${item?.available} unit.`)
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: dbError } = await supabase.from('tool_borrowings').insert({
      user_id: user?.id,
      inventory_id: itemId,
      quantity: form.quantity,
      start_date: form.start_date,
      end_date: form.end_date,
      purpose: form.purpose,
      status: 'pending',
    })

    if (dbError) {
      setError('Gagal mengajukan peminjaman. Silakan coba lagi.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.push('/peminjaman-saya'), 2000)
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Alat tidak ditemukan</h3>
          <Link href="/inventaris" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Kembali</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={36} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pengajuan Berhasil!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Peminjaman Anda sedang menunggu persetujuan admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <Link href="/inventaris" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Kembali ke Inventaris
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Item info */}
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={26} color="var(--accent-secondary)" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item.name}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.location}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Kategori', value: item.category },
              { label: 'Kondisi', value: item.condition },
              { label: 'Total Stok', value: `${item.quantity} unit` },
              { label: 'Tersedia', value: `${item.available} unit`, highlight: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: row.highlight ? 'var(--success)' : 'var(--text-primary)', textTransform: 'capitalize' }}>{String(row.value)}</span>
              </div>
            ))}
            {item.description && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>{item.description}</p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Form Peminjaman</h3>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label" htmlFor="quantity">Jumlah Unit</label>
              <div style={{ position: 'relative' }}>
                <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="quantity"
                  className="input"
                  type="number"
                  min={1}
                  max={item.available}
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Maksimal {item.available} unit</p>
            </div>

            <div>
              <label className="label" htmlFor="start_date">Tanggal Mulai</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="start_date" className="input" type="date" min={today} value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="end_date">Tanggal Selesai</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="end_date" className="input" type="date" min={form.start_date} value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="purpose">Tujuan Peminjaman</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '1rem', top: '0.875rem', color: 'var(--text-muted)' }} />
                <textarea id="purpose" className="textarea" placeholder="Jelaskan keperluan peminjaman alat ini..." value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? <><span className="spinner" /> Mengajukan...</> : 'Ajukan Peminjaman'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
