-- Invitaciones individuales, perfil demo y analitica basica.
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.invitaciones_demo (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null default '',
  token_hash text not null unique,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activa', 'revocada')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists invitaciones_demo_user_idx on public.invitaciones_demo(user_id);
alter table public.invitaciones_demo enable row level security;
revoke all on public.invitaciones_demo from anon, authenticated;
grant select on public.invitaciones_demo to authenticated;
drop policy if exists invitaciones_demo_owner on public.invitaciones_demo;
create policy invitaciones_demo_owner on public.invitaciones_demo
  for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.demo_access_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null check (event in ('login', 'logout', 'install', 'session_start')),
  route text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists demo_access_events_user_created_idx
  on public.demo_access_events(user_id, created_at desc);
alter table public.demo_access_events enable row level security;
revoke all on public.demo_access_events from anon, authenticated;
grant insert on public.demo_access_events to authenticated;
drop policy if exists demo_access_events_insert_self on public.demo_access_events;
create policy demo_access_events_insert_self on public.demo_access_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.invitaciones_demo invitation
      where invitation.user_id = (select auth.uid())
        and invitation.estado = 'activa'
    )
  );

create table if not exists public.demo_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  module text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists demo_usage_events_user_created_idx
  on public.demo_usage_events(user_id, created_at desc);
alter table public.demo_usage_events enable row level security;
revoke all on public.demo_usage_events from anon, authenticated;
grant insert on public.demo_usage_events to authenticated;
drop policy if exists demo_usage_events_insert_self on public.demo_usage_events;
create policy demo_usage_events_insert_self on public.demo_usage_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.invitaciones_demo invitation
      where invitation.user_id = (select auth.uid())
        and invitation.estado = 'activa'
    )
  );

create or replace function public.touch_demo_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invitaciones_demo
  set estado = 'activa', accepted_at = coalesce(accepted_at, now())
  where user_id = new.id and estado = 'pendiente';
  return new;
end;
$$;

drop trigger if exists touch_demo_invitation_on_profile on auth.users;
create trigger touch_demo_invitation_on_profile
after insert on auth.users
for each row execute function public.touch_demo_invitation();
