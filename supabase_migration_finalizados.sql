-- Añade el estado de archivado/reapertura de los proyectos
alter table public.proyectos
add column if not exists estado text not null default 'activo';

-- Valores previstos: activo | finalizado
do $$
begin
  if not exists (select 1 from pg_constraint
    where conname = 'proyectos_estado_check' and conrelid = 'public.proyectos'::regclass) then
    alter table public.proyectos add constraint proyectos_estado_check
      check (estado in ('activo', 'finalizado'));
  end if;
end $$;
