-- Ejecutar una vez en SQL Editor para habilitar la agenda de proveedores.
create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 300),
  contacto text not null default '',
  telefono text not null default '',
  email text not null default '',
  direccion text not null default '',
  notas text not null default '',
  logo text not null default '' check (length(logo) <= 700000),
  created_at timestamptz not null default now()
);
create index if not exists proveedores_user_id_idx on public.proveedores(user_id);
alter table public.proveedores enable row level security;
revoke all on public.proveedores from anon, authenticated;
grant select, insert, update, delete on public.proveedores to authenticated;
drop policy if exists proveedores_owner on public.proveedores;
create policy proveedores_owner on public.proveedores to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
