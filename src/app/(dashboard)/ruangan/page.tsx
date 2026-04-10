'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Search, Users, ChevronRight, Wifi, Monitor, Wind, Mic, Camera, MapPin, Image as ImageIcon, Check } from 'lucide-react'

interface Room {
  id: string
  name: string
  capacity: number
  facilities: string[]
  location: string
  status: string
  is_borrowable?: boolean
  description: string
  image_url: string | null
}

const FACILITY_ICONS: Record<string, React.ElementType> = {
  WiFi: Wifi,
  Proyektor: Monitor,
  AC: Wind,
  Mic: Mic,
  Kamera: Camera,
}

export default function RuanganPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('rooms').select('*').order('name')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query
    setRooms(data ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="page-content" style={{ maxWidth: 1400 }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Daftar Ruangan</h1>
        <p style={{ fontSize: '1rem', color: '#64748b' }}>Cari dan ajukan pemesanan (booking) ruangan lab atau kelas</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '2rem', background: 'white', padding: '1.25rem', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
         <div className="search-bar" style={{ margin: 0 }}>
           <Search size={18} color="#94a3b8" />
           <input className="input" type="text" placeholder="Ketik nama atau lokasi ruangan..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '3rem', fontSize: '1rem', background: '#f8fafc', borderColor: '#e2e8f0', height: '3rem' }} />
         </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8rem', gap: '1.5rem', flexDirection: 'column' }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderTopColor: '#5b4fe8' }} />
          <span style={{ color: '#64748b', fontWeight: 600 }}>Mencari ruangan...</span>
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', border: '1px dashed #cbd5e1', padding: '4rem 2rem' }}>
          <Building2 size={56} color="#cbd5e1" />
          <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginTop: '1rem' }}>Tidak ada ruangan ditemukan</h3>
          <p style={{ color: '#64748b' }}>Coba ubah kata kunci pencariannya</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {rooms.map(room => {
            const isBorrowable = room.is_borrowable !== false
            const isAvailable = room.status === 'tersedia' && isBorrowable
            
            return (
              <div key={room.id} className={`inventory-card ${!isBorrowable ? 'opacity-90' : ''}`} style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', ...( !isBorrowable ? { filter: 'grayscale(0.7)' } : {} ) }}>
                
                {/* Image Header */}
                <div style={{ 
                  height: 190, 
                  background: '#f1f5f9',
                  backgroundImage: room.image_url ? `url(${room.image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  position: 'relative'
                }}>
                   {!room.image_url && <ImageIcon size={48} color="#cbd5e1" />}
                   
                   {/* Status Badge overlay */}
                   <div style={{ position: 'absolute', top: 12, right: 12, left: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <span className={`badge badge-${room.status}`} style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.15)', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                         {room.status === 'tersedia' ? 'Tersedia' : room.status === 'dipinjam' ? 'Sedang Dipakai' : 'Perbaikan'}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.95)', padding: '0.3rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, color: '#334155', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Users size={12} color="#6366f1" />
                        <span>Maks {room.capacity}</span>
                      </div>
                   </div>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, background: 'white' }}>
                  
                  {/* Info Header */}
                  <div>
                    <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>{room.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                       <MapPin size={12} /> {room.location || 'Lokasi tidak spesifik'}
                    </div>
                  </div>

                  {/* Facilities */}
                  {room.facilities && room.facilities.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {room.facilities.slice(0, 5).map(f => {
                         const facName = f.trim()
                         const Icon = FACILITY_ICONS[facName] || Check
                        return (
                          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, color: '#475569', fontWeight: 500 }}>
                            <Icon size={10} color="#64748b" />
                            {facName}
                          </span>
                        )
                      })}
                      {room.facilities.length > 5 && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '0.2rem 0', fontWeight: 600 }}>+{room.facilities.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <Link href={isAvailable ? `/ruangan/booking/${room.id}` : '#'} style={{ textDecoration: 'none', marginTop: 'auto', paddingTop: '0.5rem', display: 'block' }}>
                    <button className={`btn ${(isAvailable) ? 'btn-primary' : 'btn-secondary'}`} disabled={!isAvailable} style={{ width: '100%', padding: '0.75rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: isAvailable ? 'pointer' : 'not-allowed' }}>
                      {isAvailable ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Booking Sekarang <ChevronRight size={16} /></div> : !isBorrowable ? 'Hanya Ditampilkan (Non-Booking)' : 'Sedang Tidak Tersedia'}
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
