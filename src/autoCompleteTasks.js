import { fechaLocal, diasEntreFechas } from './projectUtils.js'

export function completarTareasVencidas(tareas, hoy = fechaLocal()) {
  if (!Array.isArray(tareas)) return tareas
  let changed = false
  const next = tareas.map(tarea => {
    const dias = diasEntreFechas(tarea.fecha, hoy)
    if (tarea.hecha || dias === null || dias >= 0) return tarea
    changed = true
    return { ...tarea, hecha: true, fechaCompletada: hoy }
  })
  return changed ? next : tareas
}

export async function guardarTareasVencidas(cliente, usuarioId, filas, hoy = fechaLocal()) {
  const result = []
  for (const fila of filas) {
    const tareas = completarTareasVencidas(fila.tareas, hoy)
    if (tareas === fila.tareas) { result.push(fila); continue }
    try {
      // JSON no admite igualdad directa. Leer cada elemento como texto permite
      // comparar su representación exacta sin depender del formato de espacios.
      const columns = fila.tareas.map((_, index) => `snapshot_${index}:tareas->>${index}`)
      const { data: rows, error: readError } = await cliente.from('proyectos')
        .select(['*', ...columns].join(',')).eq('user_id', usuarioId).eq('id', fila.id)
      if (readError) throw readError
      const current = rows?.[0]
      if (!current || current.tareas?.length !== fila.tareas.length) { result.push(fila); continue }
      const next = completarTareasVencidas(current.tareas, hoy)
      if (next === current.tareas) { result.push(current); continue }
      let query = cliente.from('proyectos').update({ tareas: next })
        .eq('user_id', usuarioId).eq('id', fila.id)
      for (let index = 0; index < current.tareas.length; index++) {
        query = current[`snapshot_${index}`] === null
          ? query.is(`tareas->>${index}`, null)
          : query.eq(`tareas->>${index}`, current[`snapshot_${index}`])
      }
      // Si se añadió una tarea, tampoco sobrescribir el array.
      const { data, error } = await query.is(`tareas->${current.tareas.length}`, null).select('*')
      if (error) throw error
      result.push(data?.[0] || current)
    } catch (error) {
      // El mantenimiento automático no debe impedir consultar los proyectos.
      console.error('No se pudieron terminar automáticamente las tareas:', error)
      result.push(fila)
    }
  }
  return result
}
