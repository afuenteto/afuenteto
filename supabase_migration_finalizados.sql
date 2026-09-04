-- Añade el estado de archivado/reapertura de los proyectos
alter table public.proyectos
add column if not exists estado text not null default 'activo';

-- Valores previstos: activo | finalizado
alter table public.proyectos
add constraint proyectos_estado_check
check (estado in ('activo', 'finalizado'));
