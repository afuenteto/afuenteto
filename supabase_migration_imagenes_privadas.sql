-- Ejecutar después de convertir las URLs antiguas de imagen a rutas.
-- Todas las imágenes observadas ya empiezan por el user_id.

update public.proyectos
set imagen_proyecto = regexp_replace(
  imagen_proyecto,
  '^.*/storage/v1/object/public/imagenes-proyectos/',
  ''
)
where imagen_proyecto like '%/storage/v1/object/public/imagenes-proyectos/%';

update storage.buckets
set public = false
where id = 'imagenes-proyectos';

drop policy if exists imagenes_proyectos_select_authenticated on storage.objects;
drop policy if exists imagenes_proyectos_insert_authenticated on storage.objects;
drop policy if exists imagenes_proyectos_update_authenticated on storage.objects;
drop policy if exists imagenes_proyectos_delete_authenticated on storage.objects;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'imagenes_proyectos_select_owner') then
    create policy imagenes_proyectos_select_owner on storage.objects for select to authenticated
      using (bucket_id = 'imagenes-proyectos' and (storage.foldername(name))[1] = (select auth.uid()::text));
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
end $$;
