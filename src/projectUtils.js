export function fechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function diasEntreFechas(fecha, hoy) {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null
  const valor = Date.parse(fecha + 'T00:00:00Z')
  if (!Number.isFinite(valor) || new Date(valor).toISOString().slice(0, 10) !== fecha) return null
  return Math.round((valor - Date.parse(hoy + 'T00:00:00Z')) / 86400000)
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

export function ordenarProyectos(proyectos, criterio = 'personalizado') {
  return [...proyectos].sort((a, b) => {
    const ordenManual = (a.orden ?? 0) - (b.orden ?? 0)
    if (criterio === 'importancia') {
      return (Number(b.importancia) || 5) - (Number(a.importancia) || 5) || ordenManual
    }
    if (criterio === 'fecha') {
      return (a.fechaEntrega || '9999-12-31').localeCompare(b.fechaEntrega || '9999-12-31') || ordenManual
    }
    return ordenManual
  })
}
