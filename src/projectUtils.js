export function fechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function reordenarProyectos(proyectos, visibles, activo, destino) {
  const inicio = visibles.indexOf(activo)
  const fin = visibles.indexOf(destino)
  if (inicio < 0 || fin < 0 || inicio === fin) return proyectos
  const ids = [...visibles]
  ids.splice(fin, 0, ids.splice(inicio, 1)[0])
  const porId = new Map(proyectos.map(p => [p.id, p]))
  const seleccion = new Set(visibles)
  let posicion = 0
  return [...proyectos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map(p => seleccion.has(p.id) ? porId.get(ids[posicion++]) : p)
    .map((p, orden) => ({ ...p, orden }))
}
