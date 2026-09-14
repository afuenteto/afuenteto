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

-- 2) Crear el bucket privado si todavía no existe.
-- No modificar la visibilidad de instalaciones existentes ni reinstalar
-- permisos amplios al volver a ejecutar esta migración histórica.
insert into storage.buckets (id, name, public)
values ('presupuestos', 'presupuestos', false)
on conflict (id) do nothing;

-- 3) Los permisos por propietario están centralizados en
-- supabase_migration_storage_privado.sql. Aplicar esa migración después
-- de preparar las rutas por usuario; no habilitar lectura pública.
