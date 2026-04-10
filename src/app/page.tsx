import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Package, Building2, ClipboardCheck, ArrowRight, ShieldCheck, Users, Clock, Sparkles, CheckCircle2, LogIn } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if already logged in
  if (user) redirect('/dashboard')

  const features = [
    { icon: Package, title: 'Pinjam Alat Lab', desc: 'Nikmati kemudahan mengakses mikroskop, kamera, dan proyektor kapan saja tanpa rekam jejak kertas.', color: 'var(--accent-secondary)', bg: 'rgba(99,102,241,0.1)' },
    { icon: Building2, title: 'Smart Booking Ruang', desc: 'Sistem antik-bentrok otomatis yang membimbing Anda menemukan slot ruang kosong dengan cepat.', color: 'var(--info)', bg: 'rgba(59,130,246,0.1)' },
    { icon: ClipboardCheck, title: 'Live Tracking', desc: 'Pantau status izin peminjaman secara langsung melalui notifikasi interaktif dalam satu portal genggaman.', color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
    { icon: ShieldCheck, title: 'Kendali Super Admin', desc: 'Manajemen persetujuan 1-klik untuk Staff dan Admin demi efisiensi perputaran inventaris kampus.', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  ]

  const stats = [
    { value: '250+', label: 'Inventaris Siap Pakai' },
    { value: '15+', label: 'Pilihan Ruang Kelas' },
    { value: '24/7', label: 'Layanan Digital' },
    { value: '100%', label: 'Operasi Paperless' },
  ]

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      
      {/* Background Decorators */}
      <div className="blob" style={{ background: 'var(--accent-glow)', top: '-10%', left: '-10%', width: '50vw', height: '50vw' }} />
      <div className="blob" style={{ background: 'rgba(124, 58, 237, 0.15)', top: '40%', right: '-5%', width: '40vw', height: '40vw', animationDelay: '2s' }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '0 2rem', height: 75,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px var(--accent-glow)' }}>
            <Package size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }} className="brand-text">FKIP Inventory</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" className="btn btn-secondary interactive-btn">Log In</Link>
          <Link href="/register" className="btn btn-primary interactive-btn shadow-glow">Daftar</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-container">
        <div className="hero-content animate-fade-up">
          <h1 className="hero-title">
            Manajemen Fasilitas <br />
            <span className="text-gradient">Tanpa Kerumitan</span>
          </h1>

          <p className="hero-subtitle">
            Ciptakan alur kerja produktif dengan meminjam alat lab dan memesan ruang secara sepenuhnya digital. Tinggalkan antrean dan rasakan efisiensi FKIP UMS.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/register" className="interactive-btn shadow-glow" style={{ padding: '1rem 2.5rem', borderRadius: '999px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', fontSize: '1.05rem', textDecoration: 'none' }}>
              Mulai Eksplorasi <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="interactive-btn" style={{ padding: '1rem 2.5rem', borderRadius: '999px', background: 'white', color: '#475569', fontWeight: 600, border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>

        <div className="hero-image-wrapper animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <img 
            src="/hero.png" 
            alt="3D Illustration of Laboratory Equipment" 
            className="hero-image floating-anim"
          />
        </div>
      </header>

      {/* Stats Section */}
      <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="glass-card animate-fade-up interactive-card" style={{ textAlign: 'center', padding: '2rem 1.5rem', animationDelay: `${0.1 * i}s` }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-secondary), #c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Kenapa Menggunakan Kami?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>Seluruh keunggulan manajemen inventaris digital yang memanjakan Anda dalam satu wadah premium.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="glass-card feature-card animate-fade-up" style={{ animationDelay: `${0.2 + (0.1 * i)}s` }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', transition: 'transform 0.3s ease' }} className="icon-wrapper">
                  <Icon size={30} color={f.color} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section - Full Width Gradient */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: 'linear-gradient(90deg, #1d4ed8, #6d28d9, #8b5cf6)', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Siap Meminjam Alat?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', fontSize: '1.05rem', margin: '0 auto 2.5rem' }}>
          Login sekarang untuk mulai mengajukan peminjaman alat laboratorium
        </p>
        <Link href="/login" style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '1rem 3rem', background: 'white', color: '#0f172a',
            fontWeight: 800, borderRadius: '999px', fontSize: '1.05rem',
            textDecoration: 'none', transition: 'transform 0.2s',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          }}
          className="interactive-btn"
        >
          <LogIn size={20} /> Login Sekarang
        </Link>
      </section>

      {/* Footer Berkelas */}
      <footer style={{ background: '#1c1f26', padding: '4rem 2rem 1.5rem', color: '#8b949e', fontSize: '0.9rem', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3rem', marginBottom: '1.5rem' }}>
          
          {/* Column 1: Branding */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={16} color="#1c1f26" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>Inventaris Lab FKIP</span>
            </div>
            <p style={{ lineHeight: 1.7, marginBottom: '1.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>
              Sistem Inventaris dan Peminjaman Alat Laboratorium<br />
              Fakultas Keguruan dan Ilmu Pendidikan<br />
              Universitas Muhammadiyah Surakarta
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['f', 'ig', 'yt', 'web'].map(social => (
                <div key={social} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} className="interactive-btn">
                  <span style={{ fontSize: '0.75rem', color: 'white', textTransform: 'uppercase', fontWeight: 600 }}>{social[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.05rem' }}>Link Cepat</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', borderBottom: '1px solid transparent', width: 'fit-content' }} className="footer-link">Beranda</Link>
              <Link href="/login" style={{ color: '#9ca3af', textDecoration: 'none', borderBottom: '1px solid transparent', width: 'fit-content' }} className="footer-link">Login</Link>
              <Link href="/inventaris" style={{ color: '#9ca3af', textDecoration: 'none', borderBottom: '1px solid transparent', width: 'fit-content' }} className="footer-link">Kategori Alat</Link>
            </div>
          </div>

          {/* Column 3: Hours */}
          <div style={{ flex: '1 1 200px' }}>
            <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.05rem' }}>Jam Operasional</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', lineHeight: 1.6, color: '#9ca3af' }}>
              <li>Senin - Jumat: 08.00 - 16.00 WIB</li>
              <li>Sabtu: 08.00 - 12.00 WIB</li>
              <li>Minggu & Libur: Tutup</li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div style={{ flex: '1 1 250px' }}>
            <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.05rem' }}>Kontak</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', lineHeight: 1.6, color: '#9ca3af' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', marginTop: '-0.1rem' }}>📍</span>
                <span>Gedung FKIP UMS,<br />Jl. A. Yani Pabelan, Surakarta</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>📞</span>
                <span>+62 822-2586-0179</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>✉️</span>
                <span>fkip@ums.ac.id</span>
              </div>
            </div>
          </div>

        </div>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.6, color: '#9ca3af' }}>
          © {new Date().getFullYear()} Sistem Inventaris Lab FKIP - Universitas Muhammadiyah Surakarta
        </div>
      </footer>

      {/* Inline styles for custom landing page animations and utilities */}
      <style>{`
        /* Blob Background */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          z-index: 0;
          animation: floatBlob 10s ease-in-out infinite alternate;
          pointer-events: none;
        }

        /* Glassmorphism */
        .glass-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
          border-radius: 1.5rem;
        }

        .cta-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 5rem 3rem;
          background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(168,85,247,0.05));
        }

        /* Navigation and Buttons */
        .footer-link {
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: var(--accent-secondary) !important;
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, var(--accent-primary), #a855f7);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--text-secondary);
          margin-bottom: 3rem;
          line-height: 1.8;
          max-width: 600px;
        }

        /* Image Display */
        .hero-image {
          width: 100%;
          max-width: 700px;
          filter: drop-shadow(0 30px 40px rgba(99,102,241,0.25));
        }

        /* Layouts */
        .hero-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4rem 2rem 6rem;
          max-width: 1400px;
          margin: 0 auto;
          gap: 4rem;
          min-height: 80vh;
          position: relative;
          z-index: 10;
        }

        .hero-content {
          flex: 1;
          max-width: 650px;
        }

        .hero-image-wrapper {
          flex: 1;
          display: flex;
          justify-content: center;
          position: relative;
        }

        @media (max-width: 1024px) {
          .hero-container {
            flex-direction: column;
            text-align: center;
            padding: 4rem 2rem;
            gap: 2rem;
          }
          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }

        /* Interactions & Animations */
        .interactive-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .interactive-btn:hover {
          transform: translateY(-3px);
        }
        
        .shadow-glow {
          box-shadow: 0 10px 25px -5px var(--accent-glow);
        }
        .shadow-glow:hover {
          box-shadow: 0 20px 35px -10px var(--accent-glow);
        }

        .interactive-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .interactive-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px 0 rgba(31, 38, 135, 0.1);
        }

        .feature-card {
          padding: 2.5rem 2rem;
          transition: all 0.4s ease;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-10px);
          background: rgba(255, 255, 255, 0.8);
        }
        .feature-card:hover .icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        @keyframes floatBlob {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 30px) scale(1.05); }
        }

        .floating-anim {
          animation: floating 6s ease-in-out infinite;
        }

        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .animate-fade-up {
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .brand-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
