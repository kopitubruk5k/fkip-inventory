import { createClient } from '@supabase/supabase-js'
import { Clock, CheckCircle2, User, MapPin } from 'lucide-react'
import ScheduleMatrix from '@/components/ScheduleMatrix'

export const dynamic = 'force-dynamic'

export default async function JadwalAktifUmum() {
  // Menggunakan SERVICE ROLE KEY untuk mem-bypass RLS (Hanya berjalan di Server secara aman)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch active tool borrowings
  const { data: tools } = await supabaseAdmin
    .from('tool_borrowings')
    .select(`
      *,
      profiles (full_name),
      inventory (name, location)
    `)
    .eq('status', 'approved')
    .order('start_date', { ascending: false })

  // Fetch all rooms for the matrix header
  const { data: allRooms } = await supabaseAdmin
    .from('rooms')
    .select('id, name, location')
    .order('name', { ascending: true })

  // Fetch active room bookings for the matrix data
  const { data: roomsBookings } = await supabaseAdmin
    .from('room_bookings')
    .select(`
      *,
      profiles (full_name),
      rooms (name, location)
    `)
    .eq('status', 'approved')
    .order('start_time', { ascending: false })

  return (
    <div className="page-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Jadwal Aktif Terpadu
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Keseluruhan peminjaman Alat dan jadwal Ruangan yang saat ini sedang aktif atau sudah disetujui. Cek ketersediaan di sini sebelum melakukan booking.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Active Rooms Section (Prioritized for visibility) */}
        <section className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Matrix Jadwal Ruangan</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Menampilkan jadwal penggunaan ruangan yang disetujui pada bulan berjalan.</p>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
              {allRooms?.length || 0} Ruangan
            </div>
          </div>

          <ScheduleMatrix rooms={allRooms || []} bookings={roomsBookings || []} />
        </section>

        {/* Active Tools Section */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Peminjaman Inventaris Alat</h2>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
              {tools?.length || 0} Aktif
            </div>
          </div>

          {!tools || tools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
              <p>Belum ada peminjaman alat yang aktif saat ini.</p>
            </div>
          ) : (
            <div className="grid-3">
              {tools.map((t: any) => (
                <div key={t.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                    {t.inventory?.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} />
                      <span>{t.profiles?.full_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} />
                      <span>{t.inventory?.location || 'Lokasi tidak diset'} - Jumlah: {t.quantity}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} />
                      <span>{new Date(t.start_date).toLocaleDateString()} s/d {new Date(t.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '0.25rem', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <strong>Keperluan:</strong> {t.purpose || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
