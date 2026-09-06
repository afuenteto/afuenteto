-- Añade la importancia numérica para ordenar los proyectos
alter table public.proyectos
add column if not exists importancia integer not null default 5;

alter table public.proyectos
add constraint proyectos_importancia_check
check (importancia between 1 and 10);