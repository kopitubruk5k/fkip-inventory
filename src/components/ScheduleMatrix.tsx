'use client'

import { useState, useMemo } from 'react'
import { format, isSameDay, getDaysInMonth, startOfMonth, addDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X } from 'lucide-react'

interface Room {
  id: string
  name: string
  location?: string
}

interface Booking {
  id: string
  room_id: string
  start_time: string
  end_time: string
  purpose: string
  status: string
  profiles?: { full_name: string } | null
  rooms?: { name: string } | null
}

export default function ScheduleMatrix({ rooms, bookings }: { rooms: Room[], bookings: Booking[] }) {
  const [selectedCell, setSelectedCell] = useState<{ date: Date, room: Room } | null>(null)

  // Generate an array of dates for the current calendar month
  const today = new Date()
  const daysInMonth = getDaysInMonth(today)
  const firstDay = startOfMonth(today)
  const dates = Array.from({ length: daysInMonth }).map((_, i) => addDays(firstDay, i))

  // Group bookings by room and date for quick lookup
  const bookingsMap = useMemo(() => {
    const map = new Map<string, Booking[]>()
    
    bookings.forEach(b => {
      if (b.status !== 'approved') return
      
      const start = new Date(b.start_time)
      const end = new Date(b.end_time)
      
      // Calculate each day this booking spans
      const startD = start.getDate()
      const endD = end.getDate()
      const yearMonth = `${start.getFullYear()}-${start.getMonth()}`
      
      // For simplicity in a monthly view, we assume bookings usually don't span multiple months, 
      // but if they do, we loop over days. (Simplified: loop from start day to end day matching current month).
      for (let day = startD; day <= endD; day++) {
         const key = `${b.room_id}_${yearMonth}-${day}`
         if (!map.has(key)) map.set(key, [])
         map.get(key)!.push(b)
      }
    })
    return map
  }, [bookings])

  function getBookingsForCell(roomId: string, date: Date) {
    const key = `${roomId}_${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return bookingsMap.get(key) || []
  }

  // Find active bookings in the selected cell
  const cellBookings = selectedCell ? getBookingsForCell(selectedCell.room.id, selectedCell.date) : []

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      {/* Scrollable Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', position: 'sticky', left: 0, background: '#f8fafc', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', zIndex: 10, width: '60px', color: '#64748b', fontWeight: 600 }}>Tanggal</th>
              {rooms.map(room => (
                <th key={room.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: 600, textAlign: 'left', minWidth: '120px' }}>
                  {room.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => (
              <tr key={date.toISOString()} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', position: 'sticky', left: 0, background: 'white', borderRight: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', textAlign: 'center', zIndex: 5 }}>
                  {format(date, 'dd')}
                </td>
                {rooms.map(room => {
                  const dayBookings = getBookingsForCell(room.id, date)
                  const hasBooking = dayBookings.length > 0
                  
                  return (
                    <td key={`${room.id}-${date.toISOString()}`} style={{ padding: '0.5rem', borderRight: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle', background: hasBooking ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                      {hasBooking && (
                        <button 
                          onClick={() => setSelectedCell({ date, room })}
                          style={{
                            background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px',
                            padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                            display: 'inline-block', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                          }}>
                          digunakan
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Penggunaan */}
      {selectedCell && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0, fontFamily: 'serif' }}>
                 Detail Penggunaan Tempat
              </h3>
              <button onClick={() => setSelectedCell(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                <div>Ruanq: <span style={{ fontWeight: 600 }}>{selectedCell.room.name}</span></div>
                <div>Tanggal: <span style={{ fontWeight: 600 }}>{format(selectedCell.date, 'dd-MM-yyyy')}</span></div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'center', color: '#475569', fontWeight: 600, width: '50px' }}>No.</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Peminjam <span style={{ fontStyle: 'italic', fontWeight: 400 }}>(Unit)</span></th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Kegiatan</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Pukul<br/><span style={{ fontSize: '0.75rem', fontWeight: 400 }}>(Mulai-Selesai)</span></th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cellBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data detail</td>
                      </tr>
                    ) : (
                      cellBookings.map((b, i) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: '#475569' }}>{i + 1}</td>
                          <td style={{ padding: '0.75rem', color: '#1e293b' }}>
                            {b.profiles?.full_name || 'Tanpa Nama'}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#475569' }}>{b.purpose || '-'}</td>
                          <td style={{ padding: '0.75rem', color: '#475569' }}>
                            {format(new Date(b.start_time), 'HH:mm')} - {format(new Date(b.end_time), 'HH:mm')}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                              {b.status === 'approved' ? 'disetujui' : b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button 
                onClick={() => setSelectedCell(null)}
                style={{ padding: '0.5rem 1.25rem', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
