'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Clock, FileText, ArrowLeft, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Room {
  id: string
  name: string
  capacity: number
  facilities: string[]
  location: string
  status: string
  is_borrowable?: boolean
  description: string
}

export default function BookingRuanganPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const minDateTime = format(now, "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    start_time: '',
    end_time: '',
    purpose: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      setRoom(data)
      setLoading(false)
    }
    load()
  }, [roomId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.start_time || !form.end_time || !form.purpose.trim()) {
      setError('Mohon lengkapi semua isian terlebih dahulu!')
      return
    }

    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError('Waktu selesai harus setelah waktu mulai.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: dbError } = await supabase.from('room_bookings').insert({
      user_id: user?.id,
      room_id: roomId,
      start_time: form.start_time,
      end_time: form.end_time,
      purpose: form.purpose,
      status: 'pending',
    })

    if (room && room.is_borrowable === false) {
      setError('Maaf, ruangan ini dikonfigurasi admin hanya untuk ditampilkan dan tidak dapat dipinjam.')
      setSubmitting(false)
      return
    }

    if (dbError) {
      if (dbError.code === '23P01') {
        setError('Ruangan sudah dibooking pada waktu tersebut. Pilih waktu lain.')
      } else {
        setError('Gagal mengajukan booking. Silakan coba lagi.')
      }
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.push('/booking-saya'), 2000)
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Ruangan tidak ditemukan</h3>
          <Link href="/ruangan" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Kembali</Link>
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Booking Berhasil!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Booking Anda sedang menunggu persetujuan admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <Link href="/ruangan" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Kembali ke Ruangan
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Room info */}
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={26} color="var(--info)" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{room.name}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{room.location}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} /> Kapasitas
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{room.capacity} orang</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</span>
              <span className={`badge badge-${room.status}`}>{room.status}</span>
            </div>

            {room.facilities && (
              <div style={{ padding: '0.625rem 0' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fasilitas</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {room.facilities.map(f => (
                    <span key={f} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {room.description && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{room.description}</p>
            )}
          </div>
        </div>

        {/* Booking form */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Form Booking Ruangan</h3>

          {room.is_borrowable === false && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem', background: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle size={16} />
              <span>Ruangan ini dikonfigurasi sebagai <b>Tidak Dapat Dipinjam</b>. Silakan cari ruangan lain yang tersedia.</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label" htmlFor="start_time">Waktu Mulai</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="start_time" className="input" type="datetime-local" min={minDateTime} value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="end_time">Waktu Selesai</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="end_time" className="input" type="datetime-local" min={form.start_time || minDateTime} value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="purpose">Tujuan Booking</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '1rem', top: '0.875rem', color: 'var(--text-muted)' }} />
                <textarea id="purpose" className="textarea" placeholder="Jelaskan tujuan penggunaan ruangan ini..." value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <div className="alert alert-info">
              <AlertCircle size={16} />
              <span>Sistem akan otomatis menolak booking yang konfliks dengan jadwal yang sudah ada.</span>
            </div>

            <button type="submit" className={`btn ${room.is_borrowable === false ? 'btn-secondary' : 'btn-primary'} btn-lg`} disabled={submitting || room.is_borrowable === false} style={{ width: '100%', cursor: room.is_borrowable === false ? 'not-allowed' : 'pointer' }}>
              {submitting ? <><span className="spinner" /> Mengajukan...</> : room.is_borrowable === false ? 'Tidak Dapat Dipinjam' : 'Ajukan Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
