-- Ejecutar una vez en SQL Editor para activar los avisos entre dispositivos.
-- No modifica datos ni las políticas de acceso existentes.
do $$
declare tabla text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach tabla in array array['proyectos', 'clientes', 'deudas', 'pagos_deuda', 'proveedores', 'citas_genericas'] loop
    if to_regclass(format('public.%I', tabla)) is not null
      and not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tabla) then
      execute format('alter publication supabase_realtime add table public.%I', tabla);
    end if;
  end loop;
end;
$$;
