-- Añade la importancia numérica para ordenar los proyectos
alter table public.proyectos
add column if not exists importancia integer not null default 5;

do $$
begin
  if not exists (select 1 from pg_constraint
    where conname = 'proyectos_importancia_check' and conrelid = 'public.proyectos'::regclass) then
    alter table public.proyectos add constraint proyectos_importancia_check
      check (importancia between 1 and 10);
  end if;
end $$;
