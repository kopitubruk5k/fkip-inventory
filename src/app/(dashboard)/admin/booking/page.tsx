'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Check, X, Building2, AlertCircle, Filter } from 'lucide-react'

interface Booking {
  id: string
  start_time: string
  end_time: string
  purpose: string
  status: string
  admin_note: string | null
  created_at: string
  profiles: { full_name: string; nim: string; department: string } | null
  rooms: { name: string; location: string } | null
}

const STATUS_FILTERS = ['semua', 'pending', 'approved', 'rejected']

export default function AdminBookingPage() {
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('semua')
  const [actionId, setActionId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('room_bookings')
      .select('*, profiles(full_name, nim, department), rooms(name, location)')
      .order('created_at', { ascending: false })

    if (filterStatus !== 'semua') query = query.eq('status', filterStatus)

    const { data: rows } = await query
    setData((rows as unknown as Booking[]) ?? [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    setActionId(id)
    const supabase = createClient()
    await supabase.from('room_bookings').update({
      status,
      admin_note: noteMap[id] ?? null,
    }).eq('id', id)
    setActionId(null)
    load()
  }

  const STATUS_LABELS: Record<string, string> = {
    semua: 'Semua', pending: 'Pending', approved: 'Disetujui', rejected: 'Ditolak',
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Kelola Booking Ruangan</h1>
        <p>Approve atau tolak pengajuan booking ruangan</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <span style={{ color: 'var(--text-secondary)' }}>Memuat data...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="card"><div className="empty-state"><Building2 size={48} /><h3>Tidak ada data</h3><p>Belum ada booking dengan status ini</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Ruangan</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={14} color="var(--info)" />
                    {b.rooms?.name ?? '-'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{b.rooms?.location}</div>
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Peminjam</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.profiles?.full_name ?? '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.profiles?.nim} · {b.profiles?.department}</div>
                </div>

                <div style={{ flex: '1 1 220px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Waktu</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {format(new Date(b.start_time), 'd MMM yyyy HH:mm', { locale: localeId })}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    s/d {format(new Date(b.end_time), 'd MMM yyyy HH:mm', { locale: localeId })}
                  </div>
                </div>

                <div style={{ flex: '0 0 auto' }}>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </div>
              </div>

              {b.purpose && (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--border-strong)' }}>
                  {b.purpose}
                </div>
              )}

              {b.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <label className="label" htmlFor={`note-${b.id}`}>Catatan Admin (opsional)</label>
                    <input id={`note-${b.id}`} className="input" type="text" placeholder="Tambahkan catatan..." value={noteMap[b.id] ?? ''} onChange={e => setNoteMap(prev => ({ ...prev, [b.id]: e.target.value }))} />
                  </div>
                  <button className="btn btn-success" onClick={() => updateStatus(b.id, 'approved')} disabled={actionId === b.id}>
                    {actionId === b.id ? <span className="spinner" /> : <Check size={16} />} Setujui
                  </button>
                  <button className="btn btn-danger" onClick={() => updateStatus(b.id, 'rejected')} disabled={actionId === b.id}>
                    {actionId === b.id ? <span className="spinner" /> : <X size={16} />} Tolak
                  </button>
                </div>
              )}

              {b.admin_note && b.status !== 'pending' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={12} /> Catatan: {b.admin_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
