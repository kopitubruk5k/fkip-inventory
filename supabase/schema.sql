-- ==========================================================
-- FKIP UMS - Inventaris & Peminjaman Alat/Ruangan
-- Jalankan di Supabase SQL Editor
-- AMAN dijalankan berulang kali (idempotent)
-- ==========================================================

-- EXTENSION (untuk conflict booking)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ==========================================================
-- TABEL PROFIL PENGGUNA
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  nim         TEXT,
  department  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-buat profil saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, nim, department, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'nim',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- TABEL INVENTARIS (ALAT)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  merk        TEXT,
  category    TEXT NOT NULL DEFAULT 'other'
              CHECK (category IN ('elektronik','furnitur','lab','olahraga','media','lainnya')),
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  available   INTEGER NOT NULL DEFAULT 0 CHECK (available >= 0),
  condition   TEXT NOT NULL DEFAULT 'baik'
              CHECK (condition IN ('baik','rusak','perbaikan')),
  location    TEXT,
  tahun_beli  INTEGER,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom baru jika belum ada (aman untuk tabel lama)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='image_url') THEN
    ALTER TABLE public.inventory ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='merk') THEN
    ALTER TABLE public.inventory ADD COLUMN merk TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='tahun_beli') THEN
    ALTER TABLE public.inventory ADD COLUMN tahun_beli INTEGER;
  END IF;
END $$;

-- ==========================================================
-- TABEL PEMINJAMAN ALAT
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.tool_borrowings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL CHECK (end_date >= start_date),
  purpose      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected','returned')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Update stok saat status berubah
CREATE OR REPLACE FUNCTION public.update_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.inventory SET available = available - NEW.quantity, updated_at = NOW()
    WHERE id = NEW.inventory_id;
  END IF;
  IF NEW.status IN ('returned','rejected') AND OLD.status = 'approved' THEN
    UPDATE public.inventory SET available = available + NEW.quantity, updated_at = NOW()
    WHERE id = NEW.inventory_id;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_borrowing_change ON public.tool_borrowings;
CREATE TRIGGER on_borrowing_change
  BEFORE UPDATE ON public.tool_borrowings
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_stock();

-- ==========================================================
-- TABEL RUANGAN
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 0,
  facilities    TEXT[] DEFAULT '{}',
  location      TEXT,
  status        TEXT NOT NULL DEFAULT 'tersedia'
                CHECK (status IN ('tersedia','dipinjam','perbaikan')),
  is_borrowable BOOLEAN DEFAULT true,
  description   TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom image_url jika belum ada (aman untuk tabel lama)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='image_url') THEN
    ALTER TABLE public.rooms ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Tambahkan kolom is_borrowable jika belum ada (aman untuk tabel lama)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='is_borrowable') THEN
    ALTER TABLE public.rooms ADD COLUMN is_borrowable BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ==========================================================
-- TABEL PEMINJAMAN RUANGAN
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  purpose    TEXT,
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cegah booking ruangan yang bentrok (hanya pending & approved)
-- Hapus constraint lama dulu agar aman saat dijalankan ulang
ALTER TABLE public.room_bookings DROP CONSTRAINT IF EXISTS no_room_overlap;
ALTER TABLE public.room_bookings
  ADD CONSTRAINT no_room_overlap
  EXCLUDE USING GIST (
    room_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status IN ('pending','approved'));

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings  ENABLE ROW LEVEL SECURITY;

-- Cek apakah user adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END; $$;

-- profiles
DROP POLICY IF EXISTS "Lihat profil sendiri / admin lihat semua" ON public.profiles;
CREATE POLICY "Lihat profil sendiri / admin lihat semua" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Update profil sendiri" ON public.profiles;
CREATE POLICY "Update profil sendiri" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Insert profil sendiri" ON public.profiles;
CREATE POLICY "Insert profil sendiri" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- inventory
DROP POLICY IF EXISTS "Semua bisa lihat inventaris" ON public.inventory;
CREATE POLICY "Semua bisa lihat inventaris" ON public.inventory
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Hanya admin CRUD inventaris" ON public.inventory;
CREATE POLICY "Hanya admin CRUD inventaris" ON public.inventory
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- tool_borrowings
DROP POLICY IF EXISTS "Lihat peminjaman sendiri / admin lihat semua" ON public.tool_borrowings;
CREATE POLICY "Lihat peminjaman sendiri / admin lihat semua" ON public.tool_borrowings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "User bisa buat peminjaman" ON public.tool_borrowings;
CREATE POLICY "User bisa buat peminjaman" ON public.tool_borrowings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin update peminjaman" ON public.tool_borrowings;
CREATE POLICY "Admin update peminjaman" ON public.tool_borrowings
  FOR UPDATE USING (public.is_admin());

-- rooms
DROP POLICY IF EXISTS "Semua bisa lihat ruangan" ON public.rooms;
CREATE POLICY "Semua bisa lihat ruangan" ON public.rooms
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Hanya admin CRUD ruangan" ON public.rooms;
CREATE POLICY "Hanya admin CRUD ruangan" ON public.rooms
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- room_bookings
DROP POLICY IF EXISTS "Lihat booking sendiri / admin lihat semua" ON public.room_bookings;
CREATE POLICY "Lihat booking sendiri / admin lihat semua" ON public.room_bookings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "User bisa buat booking" ON public.room_bookings;
CREATE POLICY "User bisa buat booking" ON public.room_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin update booking" ON public.room_bookings;
CREATE POLICY "Admin update booking" ON public.room_bookings
  FOR UPDATE USING (public.is_admin());

-- ==========================================================
-- STORAGE SETTINGS (Media Alat & Ruangan)
-- ==========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('fkip_media', 'fkip_media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
CREATE POLICY "Public Read Media" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'fkip_media');

DROP POLICY IF EXISTS "Admin All Media" ON storage.objects;
CREATE POLICY "Admin All Media" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'fkip_media');


-- ==========================================================
-- DATA SAMPLE
-- ==========================================================
INSERT INTO public.inventory (name, category, quantity, available, condition, location, description) VALUES
  ('Proyektor Epson EB-X51', 'elektronik', 5, 5, 'baik', 'Gedung A Lt.2', 'Proyektor untuk presentasi kelas'),
  ('Laptop ASUS VivoBook', 'elektronik', 10, 10, 'baik', 'Lab Komputer Lt.1', 'Laptop untuk keperluan presentasi'),
  ('Microphone Wireless', 'elektronik', 8, 8, 'baik', 'Aula Utama', 'Mic nirkabel untuk seminar'),
  ('Tripod Kamera', 'media', 4, 4, 'baik', 'Ruang Media Lt.2', 'Tripod profesional'),
  ('Meja Lipat', 'furnitur', 20, 20, 'baik', 'Gudang Lt.1', 'Meja lipat portable'),
  ('Kursi Lipat', 'furnitur', 50, 50, 'baik', 'Gudang Lt.1', 'Kursi lipat untuk acara'),
  ('Mikroskop Olympus', 'lab', 10, 10, 'baik', 'Lab Biologi', 'Mikroskop binokuler')
ON CONFLICT DO NOTHING;

INSERT INTO public.rooms (name, capacity, facilities, location, status, description) VALUES
  ('Ruang Kelas A101', 40, ARRAY['Proyektor','AC','Whiteboard','WiFi'], 'Gedung A Lt.1', 'tersedia', 'Ruang kelas standar'),
  ('Ruang Kelas A201', 40, ARRAY['Proyektor','AC','Whiteboard','WiFi'], 'Gedung A Lt.2', 'tersedia', 'Ruang kelas standar'),
  ('Aula Utama FKIP', 200, ARRAY['Proyektor','AC','Sound System','Podium'], 'Gedung Utama', 'tersedia', 'Aula besar untuk seminar'),
  ('Ruang Seminar B301', 60, ARRAY['Proyektor','AC','Mic','WiFi'], 'Gedung B Lt.3', 'tersedia', 'Ruang seminar kapasitas 60'),
  ('Lab Komputer', 35, ARRAY['Komputer','AC','Proyektor','WiFi'], 'Gedung C Lt.1', 'tersedia', 'Lab dengan 35 unit PC'),
  ('Ruang Multimedia', 25, ARRAY['Proyektor','AC','Kamera','Green Screen'], 'Gedung B Lt.1', 'tersedia', 'Studio multimedia')
ON CONFLICT DO NOTHING;
