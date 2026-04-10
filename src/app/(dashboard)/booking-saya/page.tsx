import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarCheck, Building2 } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export default async function BookingSayaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('room_bookings')
    .select('*, rooms(name, location)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Booking Saya</h1>
        <p>Riwayat dan status booking ruangan Anda</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CalendarCheck size={48} />
            <h3>Belum ada booking</h3>
            <p>Anda belum pernah mengajukan booking ruangan</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ruangan</th>
                <th>Lokasi</th>
                <th>Waktu Mulai</th>
                <th>Waktu Selesai</th>
                <th>Tujuan</th>
                <th>Status</th>
                <th>Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const room = b.rooms as { name: string; location: string } | null
                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={14} color="var(--info)" />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{room?.name ?? '-'}</span>
                      </div>
                    </td>
                    <td>{room?.location ?? '-'}</td>
                    <td>{format(new Date(b.start_time), 'd MMM yyyy HH:mm', { locale: localeId })}</td>
                    <td>{format(new Date(b.end_time), 'd MMM yyyy HH:mm', { locale: localeId })}</td>
                    <td style={{ maxWidth: 160 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {b.purpose ?? '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{STATUS_LABEL[b.status]}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontStyle: b.admin_note ? 'normal' : 'italic' }}>
                      {b.admin_note ?? 'Belum ada catatan'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
