alter table public.proyectos enable row level security;

create policy "Usuarios pueden ver sus proyectos"
on public.proyectos
for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus proyectos"
on public.proyectos
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuarios pueden modificar sus proyectos"
on public.proyectos
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus proyectos"
on public.proyectos
for delete
to authenticated
using (auth.uid() = user_id);
