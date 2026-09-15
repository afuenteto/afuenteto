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
    // Comparar el valor leído impide sobrescribir cambios de otro dispositivo.
    const { data, error } = await cliente.from('proyectos').update({ tareas })
      .eq('user_id', usuarioId).eq('id', fila.id)
      .eq('tareas', JSON.stringify(fila.tareas)).select('*')
    if (error) throw error
    result.push(data?.[0] || fila)
  }
  return result
}
