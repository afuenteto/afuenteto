const KEY = 'interiorismo-tracker:v1'

export const FASES = ['Diseño', 'Presupuesto', 'Ejecución', 'Entrega']

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function cargarProyectos() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    // Si el JSON guardado está corrupto, no reventamos la app: empezamos de cero
    // en memoria, pero no sobrescribimos lo guardado hasta que el usuario actúe.
    console.error('No se pudieron leer los proyectos guardados en este navegador.')
    return []
  }
}

export function guardarProyectos(proyectos) {
  localStorage.setItem(KEY, JSON.stringify(proyectos))
}

export function nuevoProyecto() {
  return {
    id: uid(),
    nombre: '',
    cliente: '',
    telefono: '',
    email: '',
    direccion: '',
    fechaInicio: '',
    fechaEntrega: '',
    fase: FASES[0],
    presupuestoTotal: '',
    presupuestoGastado: '',
    notas: '',
    tareas: [],
    proveedores: [],
  }
}

export function exportarJSON(proyectos) {
  const blob = new Blob([JSON.stringify(proyectos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const fecha = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `proyectos-interiorismo-${fecha}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importarJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data)) throw new Error('formato inválido')
        resolve(data)
      } catch {
        reject(new Error('El archivo no tiene un formato de copia de seguridad válido.'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}

export function diasHasta(fechaISO) {
  if (!fechaISO) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const objetivo = new Date(fechaISO + 'T00:00:00')
  return Math.round((objetivo - hoy) / 86400000)
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  const d = new Date(fechaISO + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
