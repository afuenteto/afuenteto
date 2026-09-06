-- Mensajes enviados desde el formulario de contacto de la aplicación.
create table if not exists public.mensajes_contacto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null,
  asunto text not null,
  mensaje text not null,
  created_at timestamptz not null default now()
);

alter table public.mensajes_contacto enable row level security;

grant insert, select on table public.mensajes_contacto to authenticated;

drop policy if exists "Usuarios pueden enviar mensajes de contacto" on public.mensajes_contacto;
create policy "Usuarios pueden enviar mensajes de contacto"
on public.mensajes_contacto
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Usuarios pueden ver sus mensajes de contacto" on public.mensajes_contacto;
create policy "Usuarios pueden ver sus mensajes de contacto"
on public.mensajes_contacto
for select
to authenticated
using (auth.uid() = user_id);