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
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

alter table public.invitaciones_demo add column if not exists expires_at timestamptz;
update public.invitaciones_demo
set expires_at = coalesce(accepted_at, created_at, now()) + interval '30 days'
where expires_at is null;
alter table public.invitaciones_demo alter column expires_at set default (now() + interval '30 days');
alter table public.invitaciones_demo alter column expires_at set not null;

create index if not exists invitaciones_demo_user_idx on public.invitaciones_demo(user_id);
update public.invitaciones_demo
set estado = 'activa', accepted_at = coalesce(accepted_at, now())
where user_id is not null and estado = 'pendiente';
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
        and invitation.expires_at > now()
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

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0)
);
alter table public.demo_sessions add column if not exists last_seen_at timestamptz not null default now();

create index if not exists demo_sessions_user_started_idx
  on public.demo_sessions(user_id, started_at desc);
alter table public.demo_sessions enable row level security;
revoke all on public.demo_sessions from anon, authenticated;
grant select, insert, update on public.demo_sessions to authenticated;
drop policy if exists demo_sessions_owner on public.demo_sessions;
create policy demo_sessions_owner on public.demo_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.demo_usage_events add column if not exists session_id uuid references public.demo_sessions(id) on delete set null;
create index if not exists demo_usage_events_session_idx on public.demo_usage_events(session_id);

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

-- Si la invitación quedó pendiente pero ya tiene usuario vinculado, permite registrar actividad.
drop policy if exists demo_access_events_insert_self on public.demo_access_events;
create policy demo_access_events_insert_self on public.demo_access_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.invitaciones_demo invitation where invitation.user_id = (select auth.uid()) and invitation.estado = 'activa' and invitation.expires_at > now())
  );

drop policy if exists demo_usage_events_insert_self on public.demo_usage_events;
create policy demo_usage_events_insert_self on public.demo_usage_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.invitaciones_demo invitation where invitation.user_id = (select auth.uid()) and invitation.estado = 'activa' and invitation.expires_at > now())
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
  where estado = 'pendiente'
    and (user_id = new.id or lower(email) = lower(coalesce(new.email, '')));
  return new;
end;
$$;

drop trigger if exists touch_demo_invitation_on_profile on auth.users;
create trigger touch_demo_invitation_on_profile
after insert on auth.users
for each row execute function public.touch_demo_invitation();
