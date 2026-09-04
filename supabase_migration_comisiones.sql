-- ============================================================
-- AFUENTETO · COMISIONES DE COLABORADORES
-- Ejecutar UNA sola vez en Supabase > SQL Editor.
-- Es idempotente: puede volver a ejecutarse sin duplicar datos.
-- ============================================================

-- 1) Campo de comisiones dentro de cada proyecto
alter table public.proyectos
  add column if not exists comisiones jsonb not null default '[]'::jsonb;

update public.proyectos
set comisiones = '[]'::jsonb
where comisiones is null;

-- Validación: comisiones debe ser siempre un array JSON
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'proyectos_comisiones_array_check'
      AND conrelid = 'public.proyectos'::regclass
  ) THEN
    ALTER TABLE public.proyectos
      ADD CONSTRAINT proyectos_comisiones_array_check
      CHECK (jsonb_typeof(comisiones) = 'array');
  END IF;
END $$;

-- 2) Bucket para los PDF de presupuestos de colaboradores.
-- La app ya utiliza el bucket "presupuestos".
insert into storage.buckets (id, name, public)
values ('presupuestos', 'presupuestos', true)
on conflict (id) do update
set public = true;

-- 3) Permisos del bucket para usuarios autenticados
-- Lectura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'presupuestos_select_authenticated'
  ) THEN
    CREATE POLICY presupuestos_select_authenticated
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'presupuestos');
  END IF;
END $$;

-- Subida
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'presupuestos_insert_authenticated'
  ) THEN
    CREATE POLICY presupuestos_insert_authenticated
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'presupuestos');
  END IF;
END $$;

-- Sustitución/actualización
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'presupuestos_update_authenticated'
  ) THEN
    CREATE POLICY presupuestos_update_authenticated
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'presupuestos')
      WITH CHECK (bucket_id = 'presupuestos');
  END IF;
END $$;

-- Borrado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'presupuestos_delete_authenticated'
  ) THEN
    CREATE POLICY presupuestos_delete_authenticated
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'presupuestos');
  END IF;
END $$;
