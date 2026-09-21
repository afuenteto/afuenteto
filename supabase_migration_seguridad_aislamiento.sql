-- Endurecimiento de aislamiento para las tablas principales.
-- Ejecutar después de las migraciones de esquema existentes.

revoke all on public.proyectos, public.clientes, public.perfil_estudio, public.citas_genericas
  from anon;

revoke execute on function public.touch_demo_invitation() from public, anon, authenticated;
revoke execute on function public.validar_pago_deuda() from public, anon, authenticated;

update public.invitaciones_demo
set expires_at = coalesce(accepted_at, created_at, now()) + interval '30 days'
where expires_at is null;

-- Las cuentas invitadas conservan acceso solo mientras su invitacion este activa.
-- Las cuentas normales, que no tienen fila en invitaciones_demo, mantienen su acceso.
drop policy if exists "Usuarios pueden ver sus proyectos" on public.proyectos;
drop policy if exists "Usuarios pueden crear sus proyectos" on public.proyectos;
drop policy if exists "Usuarios pueden actualizar proyectos" on public.proyectos;
drop policy if exists "Usuarios pueden modificar sus proyectos" on public.proyectos;
drop policy if exists "Usuarios pueden eliminar sus proyectos" on public.proyectos;
create policy proyectos_owner_select on public.proyectos for select to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);
create policy proyectos_owner_insert on public.proyectos for insert to authenticated with check (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);
create policy proyectos_owner_update on public.proyectos for update to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);
create policy proyectos_owner_delete on public.proyectos for delete to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

drop policy if exists "Usuarios pueden ver clientes" on public.clientes;
drop policy if exists "Usuarios pueden crear clientes" on public.clientes;
drop policy if exists "Usuarios pueden actualizar clientes" on public.clientes;
drop policy if exists "Usuarios pueden eliminar clientes" on public.clientes;
create policy clientes_owner_select on public.clientes for select to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);
create policy clientes_owner_insert on public.clientes for insert to authenticated with check (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);
create policy clientes_owner_update on public.clientes for update to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);
create policy clientes_owner_delete on public.clientes for delete to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

drop policy if exists "Usuarios solo ven su perfil" on public.perfil_estudio;
create policy perfil_estudio_owner on public.perfil_estudio for all to authenticated using (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  auth.uid() = user_id and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

drop policy if exists citas_genericas_owner on public.citas_genericas;
create policy citas_genericas_owner on public.citas_genericas for all to authenticated using (
  user_id = auth.uid() and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  user_id = auth.uid() and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

drop policy if exists proveedores_owner on public.proveedores;
create policy proveedores_owner on public.proveedores for all to authenticated using (
  user_id = auth.uid() and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  user_id = auth.uid() and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

drop policy if exists deudas_owner on public.deudas;
create policy deudas_owner on public.deudas for all to authenticated using (
  user_id = auth.uid() and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  user_id = auth.uid() and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

drop policy if exists pagos_deuda_owner on public.pagos_deuda;
create policy pagos_deuda_owner on public.pagos_deuda for all to authenticated using (
  exists (select 1 from public.deudas d where d.id = deuda_id and d.user_id = auth.uid())
  and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
) with check (
  exists (select 1 from public.deudas d where d.id = deuda_id and d.user_id = auth.uid())
  and (not exists (select 1 from public.invitaciones_demo where user_id = auth.uid()) or exists (select 1 from public.invitaciones_demo where user_id = auth.uid() and estado = 'activa' and expires_at > now()))
);

update storage.buckets
set public = false
where id in ('presupuestos', 'imagenes-proyectos');

drop policy if exists "Permitir lectura presupuestos 5d6qzk_0" on storage.objects;
drop policy if exists "Permitir subida presupuestos 5d6qzk_0" on storage.objects;
drop policy if exists imagenes_proyectos_select_authenticated on storage.objects;
drop policy if exists imagenes_proyectos_insert_authenticated on storage.objects;
drop policy if exists imagenes_proyectos_update_authenticated on storage.objects;
drop policy if exists imagenes_proyectos_delete_authenticated on storage.objects;
drop policy if exists presupuestos_select_authenticated on storage.objects;
drop policy if exists presupuestos_insert_authenticated on storage.objects;
drop policy if exists presupuestos_update_authenticated on storage.objects;
drop policy if exists presupuestos_delete_authenticated on storage.objects;

drop policy if exists imagenes_proyectos_select_owner on storage.objects;
drop policy if exists imagenes_proyectos_insert_owner on storage.objects;
drop policy if exists imagenes_proyectos_update_owner on storage.objects;
drop policy if exists imagenes_proyectos_delete_owner on storage.objects;
drop policy if exists presupuestos_select_owner on storage.objects;
drop policy if exists presupuestos_insert_owner on storage.objects;
drop policy if exists presupuestos_update_owner on storage.objects;
drop policy if exists presupuestos_delete_owner on storage.objects;

create policy imagenes_proyectos_select_owner on storage.objects for select to authenticated
  using (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy imagenes_proyectos_insert_owner on storage.objects for insert to authenticated
  with check (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy imagenes_proyectos_update_owner on storage.objects for update to authenticated
  using (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy imagenes_proyectos_delete_owner on storage.objects for delete to authenticated
  using (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy presupuestos_select_owner on storage.objects for select to authenticated
  using (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy presupuestos_insert_owner on storage.objects for insert to authenticated
  with check (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy presupuestos_update_owner on storage.objects for update to authenticated
  using (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy presupuestos_delete_owner on storage.objects for delete to authenticated
  using (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));