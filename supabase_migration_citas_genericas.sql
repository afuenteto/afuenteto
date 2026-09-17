-- Ejecutar en SQL Editor para guardar citas sin proyecto.
create table if not exists public.citas_genericas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null check (length(trim(texto)) between 1 and 300),
  fecha date not null,
  hora text not null default '' check (hora = '' or hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  hecha boolean not null default false,
  "fechaCompletada" text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists citas_genericas_user_idx on public.citas_genericas(user_id);
alter table public.citas_genericas enable row level security;
revoke all on public.citas_genericas from anon, authenticated;
grant select, insert, update, delete on public.citas_genericas to authenticated;
drop policy if exists citas_genericas_owner on public.citas_genericas;
create policy citas_genericas_owner on public.citas_genericas to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
