'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, LayoutDashboard, Package, Building2,
  ClipboardList, CalendarCheck, Settings, LogOut,
  ChevronRight, ShieldCheck, Activity, Users
} from 'lucide-react'

interface SidebarProps {
  role: string
  fullName: string
}

const userNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventaris', icon: Package, label: 'Inventaris Alat' },
  { href: '/ruangan', icon: Building2, label: 'Ruangan' },
  { href: '/jadwal-aktif', icon: Activity, label: 'Jadwal Aktif' },
  { href: '/peminjaman-saya', icon: ClipboardList, label: 'Peminjaman Saya' },
  { href: '/booking-saya', icon: CalendarCheck, label: 'Booking Saya' },
]

const adminTopNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventaris', icon: Package, label: 'Inventaris Alat' },
  { href: '/ruangan', icon: Building2, label: 'Ruangan' },
  { href: '/jadwal-aktif', icon: Activity, label: 'Jadwal Aktif' },
]

const adminNav = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard Admin' },
  { href: '/admin/peminjaman-aktif', icon: Activity, label: 'Laporan Aktif' },
  { href: '/admin/pengguna', icon: Users, label: 'Daftar Pengguna' },
  { href: '/admin/peminjaman', icon: ClipboardList, label: 'Kelola Peminjaman' },
  { href: '/admin/booking', icon: CalendarCheck, label: 'Kelola Booking' },
  { href: '/admin/inventaris', icon: Package, label: 'Kelola Inventaris' },
  { href: '/admin/ruangan', icon: Building2, label: 'Kelola Ruangan' },
]

export default function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <>
      <header style={{
      position: 'sticky', top: 0, left: 0, width: '100%',
      backgroundColor: '#5b4fe8',
      zIndex: 50, display: 'flex', alignItems: 'center',
      height: '64px', padding: '0 1.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      overflow: 'hidden'
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderRight: '1px solid rgba(255,255,255,0.25)', paddingRight: '1.5rem', marginRight: '0.5rem', flexShrink: 0
      }}>
         <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
             <Package size={18} color="#5b4fe8" />
         </div>
         <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>FKIP Inventory</div>
      </div>

      {/* Navigation Loop - Scrollable */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flex: 1,
        overflowX: 'auto', scrollbarWidth: 'none',
        padding: '0 1rem'
      }}>
         <style>{`
           nav::-webkit-scrollbar { display: none; }
           .top-item {
             display: inline-flex; align-items: center; gap: 0.5rem;
             padding: 0.5rem 0.875rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
             text-decoration: none; white-space: nowrap; transition: all 0.2s;
           }
           .top-item:hover { background: rgba(255, 255, 255, 0.15); color: white !important; }
           .top-item.active { background: rgba(255, 255, 255, 0.25); color: white !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
         `}</style>

         {(role === 'admin' ? adminTopNav : userNav).map(({ href, icon: Icon, label }) => (
           <Link key={href} href={href} className={`top-item ${isActive(href) ? 'active' : ''}`} style={{ color: isActive(href) ? 'white' : 'rgba(255,255,255,0.8)' }}>
             <Icon size={16} /> <span>{label}</span>
           </Link>
         ))}
      </nav>

      {/* Profile Group */}
      <div style={{
         display: 'flex', alignItems: 'center', flexShrink: 0,
         borderLeft: '1px solid rgba(255,255,255,0.25)', paddingLeft: '1.5rem', marginLeft: '0.5rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '0.75rem' }}>
           <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{fullName || 'Pengguna'}</span>
           <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>{role === 'admin' ? 'Admin Laboratorium' : 'Mahasiswa'}</span>
        </div>
        <div style={{
           width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
           border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center',
           fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0
        }}>{initials}</div>
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '1rem', display: 'flex', alignItems: 'center' }} title="Keluar">
           <LogOut size={18} color="white" style={{ opacity: 0.9 }} />
        </button>
      </div>
    </header>

      {role === 'admin' && (
        <aside style={{
          position: 'fixed', top: '64px', bottom: 0, left: 0, width: '250px',
          backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', zIndex: 40,
          boxShadow: '4px 0 15px rgba(0,0,0,0.02)',
          overflowY: 'auto'
        }}>
          <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
             <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                <ShieldCheck size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} /> Manajemen Admin
             </div>
             <style>{`
               .side-item {
                 display: flex; align-items: center; gap: 0.75rem;
                 padding: 0.7rem 0.85rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
                 color: #475569; text-decoration: none; transition: all 0.2s;
               }
               .side-item:hover { background: #f8fafc; color: #0f172a; }
               .side-item.active { background: rgba(91, 79, 232, 0.08); color: #5b4fe8; font-weight: 600; }
             `}</style>
             {adminNav.map(({ href, icon: Icon, label }) => (
               <Link key={href} href={href} className={`side-item ${isActive(href) ? 'active' : ''}`}>
                 <Icon size={18} /> <span style={{ flex: 1 }}>{label}</span>
               </Link>
             ))}
          </nav>
        </aside>
      )}
    </>
  )
}
