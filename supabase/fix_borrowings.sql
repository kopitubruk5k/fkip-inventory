-- Cek data yang ada
SELECT COUNT(*) as total FROM public.tool_borrowings;

-- Lihat semua data tanpa filter
SELECT tb.id, tb.status, tb.user_id, tb.inventory_id, tb.quantity, tb.created_at
FROM public.tool_borrowings tb
ORDER BY tb.created_at DESC
LIMIT 10;

-- Buat inventory_id nullable (untuk peminjaman tanpa alat)
ALTER TABLE public.tool_borrowings
  ALTER COLUMN inventory_id DROP NOT NULL;

-- Tambah kolom email ke profiles jika belum ada
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Sinkronisasi email dari auth.users ke profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Pastikan auto-sync email saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, nim, department, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'nim',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
