'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Pencil, Trash2, X, Check, AlertCircle, Search, Filter, Camera, Users, MonitorPlay, CheckCircle2, ShieldAlert, Image as ImageIcon } from 'lucide-react'

interface Room {
  id: string
  name: string
  capacity: number
  facilities: string[]
  location: string
  status: string
  is_borrowable: boolean
  description: string
  image_url: string | null
}

const STATUSES = ['semua', 'tersedia', 'dipinjam', 'perbaikan']
const FORM_STATUSES = ['tersedia', 'dipinjam', 'perbaikan']

const emptyForm = { name: '', capacity: 0, facilities: '', location: '', status: 'tersedia', is_borrowable: true, description: '', image_url: '' }

export default function AdminRuanganPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  
  // Image Upload
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('rooms').select('*').order('name')
    if (search) q = q.ilike('name', `%${search}%`)
    if (filterStatus !== 'semua') q = q.eq('status', filterStatus)
    
    const { data } = await q
    setRooms(data ?? [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { load() }, [load])

  // Stats
  const totalRuangan = rooms.length
  const totalKapasitas = rooms.reduce((acc, curr) => acc + curr.capacity, 0)
  const totalTersedia = rooms.filter(r => r.status === 'tersedia').length
  const totalDipinjam = rooms.filter(r => r.status === 'dipinjam').length
  const totalPerbaikan = rooms.filter(r => r.status === 'perbaikan').length

  function openAdd() {
    setEditRoom(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(room: Room) {
    setEditRoom(room)
    setForm({
      name: room.name,
      capacity: room.capacity,
      facilities: (room.facilities ?? []).join(', '),
      location: room.location ?? '',
      status: room.status,
      is_borrowable: room.is_borrowable ?? true,
      description: room.description ?? '',
      image_url: room.image_url ?? ''
    })
    setImageFile(null)
    setImagePreview(room.image_url || null)
    setError('')
    setShowModal(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const supabase = createClient()

    let finalImageUrl = form.image_url

    if (imageFile) {
      setUploadingImage(true)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `rooms/${fileName}`

      const { error: uploadError } = await supabase.storage.from('fkip_media').upload(filePath, imageFile)
      
      if (uploadError) {
        setError(`Gagal mengunggah gambar: ${uploadError.message}`)
        setUploadingImage(false)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('fkip_media').getPublicUrl(filePath)
      finalImageUrl = data.publicUrl
      setUploadingImage(false)
    }

    const facilitiesArray = form.facilities.split(',').map(f => f.trim()).filter(Boolean)

    const payload = {
      name: form.name,
      capacity: Number(form.capacity),
      facilities: facilitiesArray,
      location: form.location,
      status: form.status,
      is_borrowable: form.is_borrowable,
      description: form.description,
      image_url: finalImageUrl
    }

    if (editRoom) {
      const { error: e } = await supabase.from('rooms').update(payload).eq('id', editRoom.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('rooms').insert(payload)
      if (e) { setError(e.message); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus ruangan ini?')) return
    setDeleteId(id)
    const supabase = createClient()
    await supabase.from('rooms').delete().eq('id', id)
    setDeleteId(null)
    load()
  }

  return (
    <div className="page-content" style={{ maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
         <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Building2 size={24} color="var(--accent-primary)" />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Data Ruangan</h1>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Dashboard / Data Ruangan</div>
         </div>
         <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={openAdd} style={{ padding: '0.6rem 1.25rem', borderRadius: 8 }}>
              <Plus size={16} /> Tambah Ruangan
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'white' }}>
              Export ▾
            </button>
         </div>
      </div>

      {/* Main Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #6366f1' }}>
           <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Building2 size={24} color="#6366f1" />
           </div>
           <div>
             <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalRuangan}</div>
             <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '0.25rem', textTransform: 'uppercase' }}>Total Ruangan</div>
             <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ruang Kelas & Lab</div>
           </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #10b981' }}>
           <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <CheckCircle2 size={24} color="#10b981" />
           </div>
           <div>
             <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalTersedia}</div>
             <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '0.25rem', textTransform: 'uppercase' }}>Tersedia</div>
             <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Kosong & Siap Dipinjam</div>
           </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
           <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Users size={24} color="#3b82f6" />
           </div>
           <div>
             <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalKapasitas}</div>
             <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '0.25rem', textTransform: 'uppercase' }}>Total Kapasitas</div>
             <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Daya Tampung Kursi Maksimal</div>
           </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
           <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <ShieldAlert size={24} color="#f59e0b" />
           </div>
           <div>
             <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalPerbaikan + totalDipinjam}</div>
             <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: '0.25rem', textTransform: 'uppercase' }}>Tidak Tersedia</div>
             <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Dipinjam / Perbaikan</div>
           </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: 'white' }}>
         <div style={{ flex: 1, minWidth: 250 }}>
            <label className="label" style={{ fontSize: '0.7rem' }}>Pencarian</label>
            <div className="search-bar">
               <Search size={16} />
               <input className="input" type="text" placeholder="Cari nama ruangan..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem', background: '#f8fafc', borderColor: '#e2e8f0' }} />
            </div>
         </div>
         <div style={{ width: 220 }}>
            <label className="label" style={{ fontSize: '0.7rem' }}>Status</label>
            <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#f8fafc', borderColor: '#e2e8f0', textTransform: 'capitalize' }}>
               {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <button className="btn btn-primary" style={{ background: '#5b4fe8' }} onClick={load}>
            <Filter size={16} /> Filter
         </button>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
               <Building2 size={18} /> Daftar Ruangan
            </div>
            <div className="badge" style={{ background: '#3b82f6', color: 'white' }}>{rooms.length} Data</div>
         </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: '#5b4fe8' }} />
        </div>
      ) : (
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ width: '100%', minWidth: 900 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                <th style={{ paddingLeft: 0 }}>Ruangan & Gambar</th>
                <th style={{ textAlign: 'center' }}>Kapasitas</th>
                <th>Lokasi</th>
                <th>Fasilitas Unggulan</th>
                <th style={{ textAlign: 'center' }}>Bisa Dipinjam?</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Tidak ada data ruangan yang sesuai</td></tr>
              ) : rooms.map((room, idx) => (
                <tr key={room.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td style={{ paddingLeft: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                         width: 54, height: 42, borderRadius: 6, background: '#f1f5f9', flexShrink: 0,
                         border: '1px solid #e2e8f0', backgroundImage: room.image_url ? `url(${room.image_url})` : 'none',
                         backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                         {!room.image_url && <ImageIcon size={20} color="#94a3b8" />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{room.name}</span>
                         {room.description && <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{room.description}</span>}
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0' }}>
                        <Users size={12} color="#64748b" /> {room.capacity}
                     </div>
                  </td>

                  <td style={{ color: '#475569', fontSize: '0.85rem' }}>{room.location ?? '-'}</td>
                  
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {(room.facilities ?? []).slice(0, 3).map(f => (
                        <span key={f} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, color: '#64748b', fontWeight: 500 }}>{f}</span>
                      ))}
                      {(room.facilities ?? []).length > 3 && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, padding: '0.2rem 0.2rem' }}>+{room.facilities.length - 3} lagi</span>}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                     {room.is_borrowable ? (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}><Check size={12} style={{ display: 'inline', marginTop: -2 }}/> Ya</span>
                     ) : (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}><X size={12} style={{ display: 'inline', marginTop: -2 }}/> Tidak</span>
                     )}
                  </td>

                  <td style={{ textAlign: 'center' }}><span className={`badge badge-${room.status}`} style={{ fontSize: '0.7rem' }}>{room.status}</span></td>
                  
                  <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(room)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(room.id)} disabled={deleteId === room.id} style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }} title="Hapus">
                        {deleteId === room.id ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#dc2626' }} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }} style={{ padding: '2rem 0', overflowY: 'auto' }}>
          <div className="modal" style={{ maxWidth: 600, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b' }}>{editRoom ? 'Ubah Ruangan' : 'Tambah Ruangan Baru'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)} style={{ padding: 6 }}><X size={18} /></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><AlertCircle size={16} /><span>{error}</span></div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Image Uploader */}
              <div>
                 <label className="label">Foto Ruangan</label>
                 <div style={{ 
                    border: '2px dashed #cbd5e1', borderRadius: 12, padding: '1.5rem', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#f8fafc', cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: 180
                 }} onClick={() => fileInputRef.current?.click()}>
                    {imagePreview ? (
                       <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    ) : (
                       <>
                          <MonitorPlay size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                          <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Klik untuk unggah foto ruang</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gunakan foto landhsape (16:9). PNG, JPG up to 5MB</div>
                       </>
                    )}
                 </div>
                 {imagePreview && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setForm(p => ({...p, image_url: ''})) }} 
                            style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                       Hapus Preview
                    </button>
                 )}
                 <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
              </div>

              <div>
                <label className="label">Nama Ruangan</label>
                <input className="input" type="text" placeholder="Contoh: Lab Komputer" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label">Kapasitas Maksimal (Orang)</label>
                  <input className="input" type="number" min={1} required value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="label">Status Ruangan Saat Ini</label>
                  <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ textTransform: 'capitalize' }}>
                    {FORM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Lokasi Detail</label>
                <input className="input" type="text" placeholder="Contoh: Gedung B Lantai 2 Sayap Timur" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                <input id="room-is-borrowable" type="checkbox" checked={form.is_borrowable} onChange={e => setForm(p => ({ ...p, is_borrowable: e.target.checked }))} style={{ width: 22, height: 22, accentColor: '#5b4fe8' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <label htmlFor="room-is-borrowable" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>Izinkan Mahasiswa Meminjam?</label>
                   <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Jika dibebaskan, tombol booking akan aktif untuk publik.</span>
                </div>
              </div>

              <div>
                <label className="label">Daftar Fasilitas Utama (Pisahkan dengan koma)</label>
                <input className="input" type="text" placeholder="Proyektor, AC Sentral, Whiteboard, Kursi Lipat..." value={form.facilities} onChange={e => setForm(p => ({ ...p, facilities: e.target.value }))} />
              </div>

              <div>
                <label className="label">Keterangan / Panduan Ruang (Opsional)</label>
                <textarea className="textarea" placeholder="Peraturan ruang, deskripsi detail, kontak piket, dll..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 80 }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '0.7rem 1.5rem', borderRadius: 8 }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploadingImage} style={{ padding: '0.7rem 1.5rem', borderRadius: 8 }}>
                  {saving || uploadingImage ? <><span className="spinner" /> {uploadingImage ? 'Mengunggah Foto...' : 'Menyimpan...'}</> : <><Check size={18} /> Simpan Data Ruangan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
