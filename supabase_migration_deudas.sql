-- Ejecutar en el SQL Editor de Supabase para habilitar Deudas.
create table if not exists public.deudas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concepto text not null check (length(trim(concepto)) between 1 and 200),
  acreedor text not null default '',
  importe numeric(14,2) not null check (importe > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.pagos_deuda (
  id uuid primary key default gen_random_uuid(),
  deuda_id uuid not null references public.deudas(id) on delete cascade,
  importe numeric(14,2) not null check (importe > 0),
  fecha date not null,
  created_at timestamptz not null default now()
);
create index if not exists deudas_user_id_idx on public.deudas(user_id);
create index if not exists pagos_deuda_deuda_id_idx on public.pagos_deuda(deuda_id);
alter table public.deudas enable row level security;
alter table public.pagos_deuda enable row level security;
revoke all on public.deudas, public.pagos_deuda from anon, authenticated;
grant select, insert, delete on public.deudas, public.pagos_deuda to authenticated;
drop policy if exists deudas_owner on public.deudas;
create policy deudas_owner on public.deudas to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists pagos_deuda_owner on public.pagos_deuda;
create policy pagos_deuda_owner on public.pagos_deuda to authenticated
  using (exists (select 1 from public.deudas d where d.id = deuda_id and d.user_id = (select auth.uid())))
  with check (exists (select 1 from public.deudas d where d.id = deuda_id and d.user_id = (select auth.uid())));

-- Serializa pagos simultáneos sobre una deuda para no superar su importe.
create or replace function public.validar_pago_deuda() returns trigger
language plpgsql security definer set search_path = '' as $$
declare limite numeric; pagado numeric;
begin
  select importe into limite from public.deudas where id = new.deuda_id and user_id = (select auth.uid()) for update;
  if limite is null then raise exception 'Deuda no disponible'; end if;
  select coalesce(sum(importe), 0) into pagado from public.pagos_deuda where deuda_id = new.deuda_id;
  if pagado + new.importe > limite then raise exception 'El pago supera el saldo pendiente'; end if;
  return new;
end;
$$;
drop trigger if exists validar_pago_deuda on public.pagos_deuda;
create trigger validar_pago_deuda before insert on public.pagos_deuda
  for each row execute function public.validar_pago_deuda();
