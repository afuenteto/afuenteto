-- No ejecutar hasta desplegar el código que usa rutas por usuario y URLs firmadas.
-- Convierte los buckets de archivos en privados.
update storage.buckets
set public = false
where id in ('presupuestos', 'imagenes-proyectos');

-- Elimina las políticas públicas antiguas de presupuestos.
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

-- Las rutas nuevas deben ser: usuario-id/proyecto-id/archivo
-- Estas políticas solo permiten al usuario operar con su propia carpeta.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'imagenes_proyectos_select_owner'
  ) then
    create policy imagenes_proyectos_select_owner
      on storage.objects for select to authenticated
      using (
        bucket_id = 'imagenes-proyectos'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'imagenes_proyectos_insert_owner') then
    create policy imagenes_proyectos_insert_owner on storage.objects for insert to authenticated
      with check (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'imagenes_proyectos_update_owner') then
    create policy imagenes_proyectos_update_owner on storage.objects for update to authenticated
      using (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text))
      with check (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'imagenes_proyectos_delete_owner') then
    create policy imagenes_proyectos_delete_owner on storage.objects for delete to authenticated
      using (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'presupuestos_select_owner'
  ) then
    create policy presupuestos_select_owner
      on storage.objects for select to authenticated
      using (
        bucket_id = 'presupuestos'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'presupuestos_insert_owner') then
    create policy presupuestos_insert_owner on storage.objects for insert to authenticated
      with check (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'presupuestos_update_owner') then
    create policy presupuestos_update_owner on storage.objects for update to authenticated
      using (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text))
      with check (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'presupuestos_delete_owner') then
    create policy presupuestos_delete_owner on storage.objects for delete to authenticated
      using (bucket_id = 'presupuestos' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;
end $$;
