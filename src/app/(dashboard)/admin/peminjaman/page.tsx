'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Check, X, Package, AlertCircle, Filter, FileDown, FileText, Trash2 } from 'lucide-react'

interface Borrowing {
  id: string
  user_id: string
  quantity: number
  start_date: string
  end_date: string
  purpose: string
  status: string
  admin_note: string | null
  created_at: string
  profiles: { full_name: string; nim: string; department: string; email?: string } | null
  inventory: { name: string; category: string } | null
}

const STATUS_FILTERS = ['semua', 'pending', 'approved', 'rejected', 'returned']

const STATUS_LABELS_ID: Record<string, string> = {
  pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak', returned: 'Dikembalikan',
}

export default function AdminPeminjamanPage() {
  const [data, setData] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('semua')
  const [actionId, setActionId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState<'pdf'|'csv'|null>(null)
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // ── CSV Export ──────────────────────────────────────────
  function exportCSV() {
    setExporting('csv')
    const headers = ['No', 'Nama Peminjam', 'NIM', 'Program Studi', 'Email', 'Nama Alat', 'Kategori', 'Jumlah', 'Tgl Pinjam', 'Tgl Kembali', 'Status', 'Keperluan', 'Catatan Admin', 'Tgl Pengajuan']
    const rows = data.map((b, i) => [
      i + 1,
      b.profiles?.full_name ?? '-',
      b.profiles?.nim ?? '-',
      b.profiles?.department ?? '-',
      b.profiles?.email ?? '-',
      b.inventory?.name ?? '-',
      b.inventory?.category ?? '-',
      b.quantity,
      b.start_date,
      b.end_date,
      STATUS_LABELS_ID[b.status] ?? b.status,
      b.purpose ?? '-',
      b.admin_note ?? '-',
      b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID') : '-',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `peminjaman-alat-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
    setExporting(null)
  }

  // ── PDF Export ──────────────────────────────────────────
  async function exportPDF() {
    setExporting('pdf')
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Header
    doc.setFillColor(91, 79, 232)
    doc.rect(0, 0, 297, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('FKIP UMS — Laporan Peminjaman Alat', 14, 10)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}  |  Total: ${data.length} data  |  Filter: ${filterStatus === 'semua' ? 'Semua Status' : STATUS_LABELS_ID[filterStatus] ?? filterStatus}`, 14, 17)

    autoTable(doc, {
      startY: 26,
      head: [['No', 'Peminjam', 'NIM', 'Alat', 'Jumlah', 'Tgl Pinjam', 'Tgl Kembali', 'Status', 'Keperluan']],
      body: data.map((b, i) => [
        i + 1,
        b.profiles?.full_name ?? '-',
        b.profiles?.nim ?? '-',
        b.inventory?.name ?? '-',
        `${b.quantity} unit`,
        b.start_date,
        b.end_date,
        STATUS_LABELS_ID[b.status] ?? b.status,
        (b.purpose ?? '-').substring(0, 40),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [91, 79, 232], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        4: { halign: 'center', cellWidth: 16 },
        5: { cellWidth: 24 }, 6: { cellWidth: 24 },
        7: { halign: 'center', cellWidth: 24 },
      },
      didDrawCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 7) {
          const s = String(hookData.cell.raw ?? '')
          const colors: Record<string, number[]> = {
            'Disetujui': [22, 163, 74], 'Menunggu': [180, 83, 9],
            'Ditolak': [220, 38, 38], 'Dikembalikan': [37, 99, 235],
          }
          if (colors[s]) hookData.cell.styles.textColor = colors[s]
        }
      },
    })

    // Footer
    const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7); doc.setTextColor(150)
      doc.text(`Halaman ${i} dari ${pageCount}  |  FKIP UMS Inventory System`, 14, doc.internal.pageSize.height - 5)
    }

    doc.save(`peminjaman-alat-${new Date().toISOString().split('T')[0]}.pdf`)
    setExporting(null)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('tool_borrowings')
      .select('*, profiles(full_name, nim, department, email), inventory(name, category)')
      .order('created_at', { ascending: false })

    if (filterStatus !== 'semua') query = query.eq('status', filterStatus)

    const { data: rows } = await query
    setData((rows as unknown as Borrowing[]) ?? [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    setActionId(id)
    const supabase = createClient()
    await supabase.from('tool_borrowings').update({
      status,
      admin_note: noteMap[id] ?? null,
    }).eq('id', id)

    // Send email notification to student
    if (status === 'approved' || status === 'rejected') {
      const borrowing = data.find(b => b.id === id)
      if (borrowing && borrowing.profiles?.email) {
        fetch('/api/send-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            studentEmail: borrowing.profiles.email,
            studentName: borrowing.profiles?.full_name ?? 'Mahasiswa',
            itemName: borrowing.inventory?.name ?? '-',
            quantity: borrowing.quantity,
            startDate: borrowing.start_date,
            endDate: borrowing.end_date,
            adminNote: noteMap[id] ?? null,
          }),
        }).catch(() => {})
      }
    }

    setActionId(null)
    load()
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleAll() {
    if (selectedIds.length === data.length && data.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(b => b.id))
    }
  }

  async function handleDeleteSelected() {
    if (!window.confirm(`Peringatan: Yakin ingin menghapus ${selectedIds.length} data peminjaman beserta seluruh catatan histori yang terpilih?`)) return
    
    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/peminjaman', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus data')
      
      setSelectedIds([])
      load()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    semua: 'Semua',
    pending: 'Pending',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    returned: 'Dikembalikan',
  }

  return (
    <div className="page-content">
      {/* Header + Export Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Kelola Peminjaman Alat</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Approve atau tolak pengajuan peminjaman dari mahasiswa</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={exportCSV} disabled={exporting !== null || data.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', cursor: (exporting || data.length === 0) ? 'not-allowed' : 'pointer', opacity: (exporting || data.length === 0) ? 0.6 : 1, transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {exporting === 'csv' ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#16a34a' }} /> : <FileDown size={15} />}
            Export CSV
          </button>
          <button onClick={exportPDF} disabled={exporting !== null || data.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: 10, border: 'none', background: '#5b4fe8', color: 'white', fontWeight: 700, fontSize: '0.82rem', cursor: (exporting || data.length === 0) ? 'not-allowed' : 'pointer', opacity: (exporting || data.length === 0) ? 0.6 : 1, transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(91,79,232,0.25)' }}>
            {exporting === 'pdf' ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} /> : <FileText size={15} />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
            {STATUS_LABELS[s]}
          </button>
        ))}
        {data.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94a3b8' }}>
            {data.length} data ditampilkan
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <span style={{ color: 'var(--text-secondary)' }}>Memuat data...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="card"><div className="empty-state"><Package size={48} /><h3>Tidak ada data</h3><p>Belum ada peminjaman dengan status ini</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Master Control: Bulk Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={toggleAll}>
              <input type="checkbox" checked={selectedIds.length === data.length && data.length > 0} readOnly style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#5b4fe8' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Pilih Semua Data ({data.length})</span>
            </div>
            
            {selectedIds.length > 0 && (
              <button 
                onClick={handleDeleteSelected} 
                disabled={isDeleting} 
                style={{ marginLeft: 'auto', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
              >
                {isDeleting ? <span className="spinner" style={{width: 14, height: 14, borderTopColor: '#dc2626'}}/> : <Trash2 size={15} />}
                Hapus {selectedIds.length} Terpilih
              </button>
            )}
          </div>

          {data.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: selectedIds.includes(b.id) ? '1px solid #5b4fe8' : '1px solid var(--border)', transition: 'border-color 0.2s', position: 'relative' }}>
              
              {/* Checkbox item */}
              <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                 <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelection(b.id)} style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#5b4fe8' }} />
              </div>

              {/* Row 1: info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Alat</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={14} color="var(--accent-secondary)" />
                    {b.inventory?.name ?? '-'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'capitalize' }}>{b.inventory?.category}</div>
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Peminjam</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.profiles?.full_name ?? '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.profiles?.nim} · {b.profiles?.department}</div>
                </div>

                <div style={{ flex: '1 1 120px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Jumlah</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.quantity} unit</div>
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Periode</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {format(new Date(b.start_date), 'd MMM', { locale: localeId })} – {format(new Date(b.end_date), 'd MMM yyyy', { locale: localeId })}
                  </div>
                </div>

                <div style={{ flex: '0 0 auto' }}>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </div>
              </div>

              {/* Tujuan */}
              {b.purpose && (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--border-strong)' }}>
                  {b.purpose}
                </div>
              )}

              {/* Admin actions (only if pending) */}
              {b.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <label className="label" htmlFor={`note-${b.id}`}>Catatan Admin (opsional)</label>
                    <input
                      id={`note-${b.id}`}
                      className="input"
                      type="text"
                      placeholder="Tambahkan catatan..."
                      value={noteMap[b.id] ?? ''}
                      onChange={e => setNoteMap(prev => ({ ...prev, [b.id]: e.target.value }))}
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => updateStatus(b.id, 'approved')}
                    disabled={actionId === b.id}
                  >
                    {actionId === b.id ? <span className="spinner" /> : <Check size={16} />}
                    Setujui
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => updateStatus(b.id, 'rejected')}
                    disabled={actionId === b.id}
                  >
                    {actionId === b.id ? <span className="spinner" /> : <X size={16} />}
                    Tolak
                  </button>
                </div>
              )}

              {/* Mark as returned (if approved) */}
              {b.status === 'approved' && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <AlertCircle size={14} color="var(--warning)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1 }}>Alat sedang dipinjam</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(b.id, 'returned')} disabled={actionId === b.id}>
                    {actionId === b.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
                    Tandai Dikembalikan
                  </button>
                </div>
              )}

              {/* Admin note display */}
              {b.admin_note && b.status !== 'pending' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={12} />
                  Catatan: {b.admin_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
