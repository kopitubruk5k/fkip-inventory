'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Filter, Eye, Plus, Minus, Boxes, Image as ImageIcon,
  Tag, ShoppingCart, Trash2, Send, Check, X, AlertTriangle
} from 'lucide-react'

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
}

interface CartItem { item: InventoryItem; qty: number }

const CATEGORIES = ['semua', 'elektronik', 'furnitur', 'lab', 'olahraga', 'media', 'lainnya']
const CATEGORY_LABELS: Record<string, string> = {
  semua: 'Semua', elektronik: 'Elektronik', furnitur: 'Furnitur',
  lab: 'Lab', olahraga: 'Olahraga', media: 'Streaming', lainnya: 'Lainnya',
}
const CATEGORY_ICONS: Record<string, string> = {
  elektronik: '💻', furnitur: '🪑', lab: '🔬', olahraga: '⚽', media: '📷', lainnya: '📦', semua: '🔎',
}
const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  elektronik: { bg: '#dbeafe', color: '#1d4ed8' }, furnitur: { bg: '#ede9fe', color: '#6d28d9' },
  lab: { bg: '#dcfce7', color: '#15803d' }, olahraga: { bg: '#fef9c3', color: '#854d0e' },
  media: { bg: '#e0f2fe', color: '#0369a1' }, lainnya: { bg: '#f1f5f9', color: '#475569' },
}

export default function InventarisPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('semua')

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]
  })
  const [purpose, setPurpose] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('inventory').select('*').order('name')
    if (category !== 'semua') query = query.eq('category', category)
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query
    setItems(data ?? [])
    setLoading(false)
  }, [search, category])

  useEffect(() => { load() }, [load])

  const maxEnd = new Date(startDate)
  maxEnd.setDate(maxEnd.getDate() + 7)

  function addToCart(item: InventoryItem) {
    setCart(prev => {
      const exists = prev.find(c => c.item.id === item.id)
      if (exists) return prev.map(c => c.item.id === item.id ? { ...c, qty: Math.min(c.qty + 1, item.available) } : c)
      return [...prev, { item, qty: 1 }]
    })
    setCartOpen(true)
  }

  function removeFromCart(id: string) { setCart(p => p.filter(c => c.item.id !== id)) }
  function updateQty(id: string, q: number) {
    setCart(p => p.map(c => c.item.id === id ? { ...c, qty: Math.min(Math.max(1, q), c.item.available) } : c))
  }

  const inCart = (id: string) => cart.some(c => c.item.id === id)
  const cartQty = (id: string) => cart.find(c => c.item.id === id)?.qty ?? 0

  async function handleCheckout() {
    setSubmitError('')
    if (!purpose.trim()) { setSubmitError('Isi keperluan peminjaman.'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Get profile
    const { data: profile } = await supabase.from('profiles').select('full_name, nim').eq('id', user.id).single()

    const rows = cart.map(c => ({
      user_id: user.id, inventory_id: c.item.id, quantity: c.qty,
      start_date: startDate, end_date: endDate, purpose, status: 'pending',
    }))
    const { error } = await supabase.from('tool_borrowings').insert(rows)
    if (error) { setSubmitError(error.message); setSubmitting(false); return }

    // Send email notification (fire and forget)
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: profile?.full_name ?? user.email,
        studentEmail: user.email,
        studentNim: profile?.nim ?? null,
        items: cart.map(c => ({ name: c.item.name, qty: c.qty })),
        startDate, endDate, purpose,
      }),
    }).catch(() => {})

    setSuccess(true)
    setCart([])
    setTimeout(() => { setSuccess(false); setCartOpen(false); setPurpose('') }, 3000)
  }

  return (
    <div className="page-content" style={{ maxWidth: 1400, position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>Katalog Inventaris Alat</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Pilih alat dan ajukan peminjaman sekaligus</p>
        </div>
        {/* Cart toggle button */}
        <button onClick={() => setCartOpen(o => !o)} style={{
          position: 'relative', background: cart.length > 0 ? '#5b4fe8' : 'white',
          border: '1px solid', borderColor: cart.length > 0 ? '#5b4fe8' : '#e2e8f0',
          borderRadius: 12, padding: '0.6rem 1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: cart.length > 0 ? 'white' : '#64748b', fontWeight: 700, fontSize: '0.85rem',
          transition: 'all 0.2s', boxShadow: cart.length > 0 ? '0 4px 12px rgba(91,79,232,0.3)' : 'none'
        }}>
          <ShoppingCart size={18} />
          Keranjang
          {cart.length > 0 && (
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cartOpen ? '1fr 340px' : '1fr', gap: '1.25rem', transition: 'all 0.3s', alignItems: 'start' }}>
        {/* LEFT: Catalog */}
        <div>
          {/* Filter bar */}
          <div style={{ background: 'white', padding: '0.9rem 1.1rem', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input className="input" type="text" placeholder="Cari nama alat..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.3rem', background: '#f8fafc', borderColor: '#e2e8f0', height: '2.4rem', fontSize: '0.88rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={13} color="#94a3b8" />
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '0.28rem 0.8rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${category === cat ? '#5b4fe8' : '#e2e8f0'}`,
                  background: category === cat ? '#5b4fe8' : 'white',
                  color: category === cat ? 'white' : '#64748b', transition: 'all 0.2s'
                }}>
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: '#5b4fe8' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Menyiapkan Katalog...</span>
            </div>
          ) : items.length === 0 ? (
            <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
              <Boxes size={42} color="#d1d5db" />
              <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '0.9rem' }}>Tidak ada alat ditemukan</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: cartOpen ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {items.map(item => {
                const available = item.available ?? 0
                const isAvailable = available > 0 && item.condition === 'baik'
                const catStyle = CAT_COLORS[item.category] ?? CAT_COLORS.lainnya
                const added = inCart(item.id)

                return (
                  <div key={item.id} style={{
                    background: 'white', borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${added ? '#5b4fe8' : '#e2e8f0'}`,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: added ? '0 4px 16px rgba(91,79,232,0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s'
                  }}>
                    {/* Image */}
                    <div style={{
                      height: 140, background: '#f8fafc', position: 'relative',
                      backgroundImage: item.image_url ? `url(${item.image_url})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {!item.image_url && <ImageIcon size={36} color="#d1d5db" />}
                      {/* Status badge */}
                      <div style={{ position: 'absolute', top: 8, left: 8 }}>
                        <span style={{
                          background: !isAvailable ? '#fee2e2' : available <= 3 ? '#fef3c7' : '#dcfce7',
                          color: !isAvailable ? '#dc2626' : available <= 3 ? '#b45309' : '#15803d',
                          fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase'
                        }}>
                          {!isAvailable ? (item.condition !== 'baik' ? 'Perbaikan' : 'Habis') : available <= 3 ? 'Terbatas' : 'Tersedia'}
                        </span>
                      </div>
                      {/* Condition */}
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: item.condition === 'baik' ? '#dcfce7' : item.condition === 'perbaikan' ? '#fef3c7' : '#fee2e2',
                          color: item.condition === 'baik' ? '#15803d' : item.condition === 'perbaikan' ? '#b45309' : '#dc2626',
                        }}>
                          {item.condition === 'baik' ? 'Baik' : item.condition === 'perbaikan' ? 'Perbaikan' : 'Rusak'}
                        </span>
                      </div>
                      {/* In-cart indicator */}
                      {added && (
                        <div style={{ position: 'absolute', bottom: 8, right: 8, background: '#5b4fe8', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={13} color="white" />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: catStyle.bg, color: catStyle.color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>
                        <Tag size={9} /> {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <div>
                        <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.3, marginBottom: '0.1rem' }}>{item.name}</h3>
                        {item.merk && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.merk}</div>}
                      </div>
                      <div style={{ marginTop: 'auto' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isAvailable ? '#16a34a' : '#94a3b8' }}>{available}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}> unit / {item.quantity} total</span>
                      </div>
                      {/* Actions */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', display: 'flex', gap: '0.4rem' }}>
                        <Link href={`/inventaris/detail/${item.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                          <button style={{
                            width: '100%', padding: '0.45rem', borderRadius: 7, fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                            background: 'white', border: '1px solid #e2e8f0', color: '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                          }}>
                            <Eye size={12} /> Detail
                          </button>
                        </Link>

                        {added ? (
                          // If already in cart: show qty control
                          <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '4px', background: '#f0edff', borderRadius: 7, padding: '0 6px', justifyContent: 'space-between' }}>
                            <button type="button" onClick={() => cartQty(item.id) <= 1 ? removeFromCart(item.id) : updateQty(item.id, cartQty(item.id) - 1)}
                              style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                              <Minus size={11} color="#5b4fe8" />
                            </button>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#5b4fe8', minWidth: 16, textAlign: 'center' }}>{cartQty(item.id)}</span>
                            <button type="button" onClick={() => updateQty(item.id, cartQty(item.id) + 1)}
                              style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                              <Plus size={11} color="#5b4fe8" />
                            </button>
                          </div>
                        ) : (
                          <button disabled={!isAvailable} onClick={() => isAvailable && addToCart(item)}
                            style={{
                              flex: 2, padding: '0.45rem', borderRadius: 7, fontSize: '0.74rem', fontWeight: 700, cursor: isAvailable ? 'pointer' : 'not-allowed',
                              background: isAvailable ? '#5b4fe8' : '#f1f5f9', border: 'none',
                              color: isAvailable ? 'white' : '#94a3b8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                            }}>
                            <Plus size={12} /> {isAvailable ? 'Tambah' : 'Tidak Tersedia'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Cart Panel */}
        {cartOpen && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', position: 'sticky', top: 80, overflow: 'hidden' }}>
            {/* Cart header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.1rem', borderBottom: '1px solid #f1f5f9', background: '#5b4fe8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                <ShoppingCart size={16} /> Keranjang ({cart.length})
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="white" />
              </button>
            </div>

            {success ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Check size={28} color="#16a34a" />
                </div>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1rem', marginBottom: '0.35rem' }}>Berhasil Diajukan!</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Peminjaman sedang diproses admin.</div>
              </div>
            ) : cart.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <ShoppingCart size={36} color="#d1d5db" style={{ marginBottom: '0.75rem' }} />
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Keranjang kosong.<br />Pilih alat dari katalog.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Cart items */}
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                  {cart.map(c => (
                    <div key={c.item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f8fafc', borderRadius: 9, padding: '0.6rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.item.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>maks {c.item.available} unit</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => c.qty <= 1 ? removeFromCart(c.item.id) : updateQty(c.item.id, c.qty - 1)}
                          style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={10} />
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', width: 20, textAlign: 'center' }}>{c.qty}</span>
                        <button onClick={() => updateQty(c.item.id, c.qty + 1)}
                          style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={10} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(c.item.id)}
                        style={{ background: '#fee2e2', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={11} color="#dc2626" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Checkout form */}
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {submitError && (
                    <div style={{ background: '#fee2e2', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#dc2626', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <AlertTriangle size={12} /> {submitError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Tgl Pinjam</label>
                      <input className="input" type="date" value={startDate} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setStartDate(e.target.value)} style={{ fontSize: '0.78rem', height: '2.1rem', padding: '0 0.5rem' }} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Tgl Kembali</label>
                      <input className="input" type="date" value={endDate}
                        min={startDate} max={maxEnd.toISOString().split('T')[0]}
                        onChange={e => setEndDate(e.target.value)} style={{ fontSize: '0.78rem', height: '2.1rem', padding: '0 0.5rem' }} />
                    </div>
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: '0.72rem' }}>Keperluan *</label>
                    <textarea className="textarea" placeholder="Tujuan peminjaman alat..." value={purpose}
                      onChange={e => setPurpose(e.target.value)} style={{ minHeight: 68, fontSize: '0.82rem' }} />
                  </div>
                  <button onClick={handleCheckout} disabled={submitting || cart.length === 0}
                    style={{
                      width: '100%', background: '#5b4fe8', color: 'white', border: 'none', borderRadius: 10,
                      padding: '0.7rem', fontWeight: 700, fontSize: '0.85rem',
                      cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}>
                    {submitting
                      ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} /> Memproses...</>
                      : <><Send size={14} /> Ajukan {cart.length} Alat</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
