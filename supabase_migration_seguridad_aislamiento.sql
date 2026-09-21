-- Endurecimiento de aislamiento para las tablas principales.
-- Ejecutar después de las migraciones de esquema existentes.

revoke all on public.proyectos, public.clientes, public.perfil_estudio, public.citas_genericas
  from anon;

revoke execute on function public.touch_demo_invitation() from public, anon, authenticated;
revoke execute on function public.validar_pago_deuda() from public, anon, authenticated;

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