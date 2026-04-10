'use client'

import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Plus, Pencil, Trash2, X, Check, AlertCircle, Search, Filter, Camera, ArrowRightLeft, ShieldAlert, Wrench, Image as ImageIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Settings } from 'lucide-react'

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

const CATEGORIES = ['semua', 'elektronik', 'furnitur', 'lab', 'olahraga', 'media', 'lainnya']
const CONDITIONS = ['semua', 'baik', 'rusak', 'perbaikan']
const FORM_CONDITIONS = ['baik', 'rusak', 'perbaikan']
const PAGE_SIZES = [10, 25, 50]

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  elektronik: { bg: '#fef3c7', color: '#b45309' },
  furnitur:   { bg: '#ede9fe', color: '#6d28d9' },
  lab:        { bg: '#dbeafe', color: '#1d4ed8' },
  olahraga:   { bg: '#dcfce7', color: '#15803d' },
  media:      { bg: '#fce7f3', color: '#be185d' },
  lainnya:    { bg: '#f1f5f9', color: '#475569' },
}

const emptyForm: Omit<InventoryItem, 'id'> = { name: '', merk: '', category: 'elektronik', quantity: 0, available: 0, condition: 'baik', location: '', description: '', image_url: '', tahun_beli: new Date().getFullYear() }

export default function AdminInventarisPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('semua')
  const [filterCond, setFilterCond] = useState('semua')

  // Pagination
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('inventory').select('*').order('name')
    if (search) q = q.ilike('name', `%${search}%`)
    if (filterCat !== 'semua') q = q.eq('category', filterCat)
    if (filterCond !== 'semua') q = q.eq('condition', filterCond)
    const { data } = await q
    setItems(data ?? [])
    setPage(1)
    setLoading(false)
  }, [search, filterCat, filterCond])

  useEffect(() => { load() }, [load])

  // Pagination logic
  const totalPages = Math.ceil(items.length / pageSize)
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize)

  // Stats
  const totalUnit = items.reduce((acc, i) => acc + i.quantity, 0)
  const totalAvailable = items.reduce((acc, i) => acc + i.available, 0)
  const totalBorrowed = totalUnit - totalAvailable
  const needAttention = items.filter(i => i.condition !== 'baik').length

  function openAdd() {
    setEditItem(null); setForm(emptyForm); setImageFile(null); setImagePreview(null); setError(''); setShowModal(true)
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({
      name: item.name, merk: item.merk ?? '', category: item.category,
      quantity: item.quantity, available: item.available,
      condition: item.condition, location: item.location ?? '',
      description: item.description ?? '', image_url: item.image_url ?? '',
      tahun_beli: item.tahun_beli ?? new Date().getFullYear()
    })
    setImageFile(null); setImagePreview(item.image_url || null); setError(''); setShowModal(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (Number(form.available) > Number(form.quantity)) { setError('Stok tersedia tidak boleh melebihi total stok.'); return }
    setSaving(true)
    const supabase = createClient()
    let finalImageUrl = form.image_url

    if (imageFile) {
      setUploadingImage(true)
      const fileExt = imageFile.name.split('.').pop()
      const filePath = `inventory/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('fkip_media').upload(filePath, imageFile)
      if (uploadError) { setError(`Gagal upload: ${uploadError.message}`); setUploadingImage(false); setSaving(false); return }
      finalImageUrl = supabase.storage.from('fkip_media').getPublicUrl(filePath).data.publicUrl
      setUploadingImage(false)
    }

    const payload = { ...form, image_url: finalImageUrl }
    if (editItem) {
      const { error: e } = await supabase.from('inventory').update(payload).eq('id', editItem.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('inventory').insert(payload)
      if (e) { setError(e.message); setSaving(false); return }
    }
    setSaving(false); setShowModal(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus alat ini?')) return
    setDeleteId(id)
    await createClient().from('inventory').delete().eq('id', id)
    setDeleteId(null); load()
  }

  return (
    <div className="page-content" style={{ maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <Package size={22} color="#5b4fe8" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Data Alat</h1>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dashboard / Kelola Inventaris Alat</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ background: 'white', fontSize: '0.85rem' }}>Export ▾</button>
          <button className="btn btn-primary" onClick={openAdd} style={{ fontSize: '0.85rem' }}>
            <Plus size={16} /> Tambah Alat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Jenis', val: items.length, sub: `${totalUnit} unit`, color: '#6366f1', icon: <Package size={20} color="#6366f1" />, bg: 'rgba(99,102,241,0.1)' },
          { label: 'Tersedia', val: totalAvailable, sub: 'Siap dipinjam', color: '#10b981', icon: <Check size={20} color="#10b981" />, bg: 'rgba(16,185,129,0.1)' },
          { label: 'Dipinjam', val: totalBorrowed, sub: 'Sedang digunakan', color: '#3b82f6', icon: <ArrowRightLeft size={20} color="#3b82f6" />, bg: 'rgba(59,130,246,0.1)' },
          { label: 'Perlu Perhatian', val: needAttention, sub: 'Rusak / Perbaikan', color: '#f59e0b', icon: <ShieldAlert size={20} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${s.color}`, padding: '1rem 1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tampilkan</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="select" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem', height: 'auto' }}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>data per halaman</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem', height: 'auto', textTransform: 'capitalize' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'semua' ? 'Semua Kategori' : c}</option>)}
            </select>
            <select className="select" value={filterCond} onChange={e => setFilterCond(e.target.value)} style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem', height: 'auto', textTransform: 'capitalize' }}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c === 'semua' ? 'Semua Kondisi' : c}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input className="input" type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem', height: '2.1rem', fontSize: '0.85rem', width: 200 }} />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: '#5b4fe8' }} />
          </div>
        ) : (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: 36 }}>No</th>
                  <th style={{ padding: '0.5rem 0.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '22%' }}>Alat</th>
                  <th style={{ padding: '0.5rem 0.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '9%' }}>Merk</th>
                  <th style={{ padding: '0.5rem 0.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '10%' }}>Kategori</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '7%' }}>Stok</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '8%' }}>Kondisi</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '7%' }}>Pinjam</th>
                  <th style={{ padding: '0.5rem 0.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '14%' }}>Lokasi</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '6%' }}>Thn</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '8%' }}>Status</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '7%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>Tidak ada data yang sesuai</td></tr>
                ) : paginatedItems.map((item, idx) => {
                  const canBorrow = item.available > 0 && item.condition === 'baik'
                  const catStyle = CAT_COLORS[item.category] ?? CAT_COLORS.lainnya
                  const globalIdx = (page - 1) * pageSize + idx + 1

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* No */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{globalIdx}</td>

                      {/* Alat */}
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', flexShrink: 0,
                            border: '1px solid #e2e8f0', backgroundImage: item.image_url ? `url(${item.image_url})` : 'none',
                            backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {!item.image_url && <ImageIcon size={14} color="#cbd5e1" />}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '0.68rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Merk */}
                      <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.merk || <span style={{ color: '#cbd5e1' }}>–</span>}</td>

                      {/* Kategori */}
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <span style={{ background: catStyle.bg, color: catStyle.color, padding: '2px 7px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {item.category}
                        </span>
                      </td>

                      {/* Stok */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#16a34a', lineHeight: 1 }}>{item.available}/{item.quantity}</div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>tersedia</div>
                      </td>

                      {/* Kondisi */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                          background: item.condition === 'baik' ? '#dcfce7' : item.condition === 'perbaikan' ? '#fef3c7' : '#fee2e2',
                          color: item.condition === 'baik' ? '#15803d' : item.condition === 'perbaikan' ? '#b45309' : '#dc2626',
                        }}>
                          {item.condition}
                        </span>
                      </td>

                      {/* Pinjam */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        {canBorrow
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700 }}><Check size={10} />Ya</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700 }}><X size={10} />Tidak</span>
                        }
                      </td>

                      {/* Lokasi */}
                      <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.76rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.location || <span style={{ color: '#cbd5e1' }}>–</span>}
                      </td>

                      {/* Tahun Beli */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        {item.tahun_beli ?? <span style={{ color: '#cbd5e1' }}>–</span>}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                          background: item.available > 0 ? '#dbeafe' : '#f1f5f9',
                          color: item.available > 0 ? '#1d4ed8' : '#64748b',
                        }}>
                          {item.available > 0 ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          <button onClick={() => openEdit(item)} title="Edit"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} disabled={deleteId === item.id} title="Hapus"
                            style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }}>
                            {deleteId === item.id ? <span className="spinner" style={{ width: 11, height: 11, borderTopColor: '#dc2626' }} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, items.length)} dari <strong>{items.length}</strong> data
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span key={`ellipsis-${p}`} style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 2px' }}>…</span>}
                  <button onClick={() => setPage(p)}
                    style={{ background: p === page ? '#5b4fe8' : 'white', color: p === page ? 'white' : '#475569', border: `1px solid ${p === page ? '#5b4fe8' : '#e2e8f0'}`, borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: '0.85rem' }}>
                    {p}
                  </button>
                </Fragment>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }} style={{ padding: '2rem 0', overflowY: 'auto' }}>
          <div className="modal" style={{ maxWidth: 620, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>{editItem ? 'Edit Data Alat' : 'Tambah Alat Baru'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)} style={{ padding: 6 }}><X size={18} /></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><AlertCircle size={16} /><span>{error}</span></div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Image Upload */}
              <div>
                <label className="label">Foto / Gambar Alat</label>
                <div style={{
                  border: '2px dashed #cbd5e1', borderRadius: 12, padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#f8fafc', cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: 140
                }} onClick={() => fileInputRef.current?.click()}>
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }} />
                    : <><Camera size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} /><div style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Klik untuk unggah foto</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PNG, JPG maks 5MB</div></>
                  }
                </div>
                {imagePreview && (
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setForm(p => ({ ...p, image_url: '' })) }}
                    style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Hapus Gambar
                  </button>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
              </div>

              <div>
                <label className="label">Nama Alat</label>
                <input className="input" type="text" placeholder="Contoh: Kamera Sony A7III" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label">Merk / Brand</label>
                  <input className="input" type="text" placeholder="Contoh: Sony, Canon, dll." value={form.merk} onChange={e => setForm(p => ({ ...p, merk: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Tahun Pembelian</label>
                  <input className="input" type="number" min={2000} max={2099} placeholder="2024" value={form.tahun_beli ?? ''} onChange={e => setForm(p => ({ ...p, tahun_beli: parseInt(e.target.value) || null }))} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label">Kategori</label>
                  <select className="select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ textTransform: 'capitalize' }}>
                    {CATEGORIES.filter(c => c !== 'semua').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Kondisi</label>
                  <select className="select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                    {FORM_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label">Total Stok</label>
                  <input className="input" type="number" min={0} required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="label">Stok Tersedia</label>
                  <input className="input" type="number" min={0} required value={form.available} onChange={e => setForm(p => ({ ...p, available: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              <div>
                <label className="label">Lokasi / Ruang Penyimpanan</label>
                <input className="input" type="text" placeholder="Contoh: Lemari A - Lab Dasar" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>

              <div>
                <label className="label">Keterangan (Opsional)</label>
                <textarea className="textarea" placeholder="Detail spesifikasi, kelengkapan, dll..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 72 }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploadingImage}>
                  {saving || uploadingImage ? <><span className="spinner" /> {uploadingImage ? 'Mengunggah...' : 'Menyimpan...'}</> : <><Check size={16} /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
