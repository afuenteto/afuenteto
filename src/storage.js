import { getLocale } from './i18n.js'
import { fechaLocal, diasEntreFechas } from './projectUtils.js'

import { FASES } from './projectModel.js'
export { FASES } from './projectModel.js'

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
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
    importancia: 5,
    estado: 'activo',
    presupuestoTotal: '',
    presupuestoGastado: '',
    notas: '',
    tareas: [],
    proveedores: [],
    tipoProyecto: 'Vivienda unifamiliar',
    honorariosDiseno: '',
    honorariosGestion: '',
    otrosImportes: '',
    cobros: [],
    comisiones: [],
    imagenProyecto: '',
    imagenProyectoPath: '',
    horasEstimadas: '',
    horasReales: '',
  }
}

export function diasHasta(fechaISO) {
  return diasEntreFechas(fechaISO, fechaLocal())
}

const formatosFecha = new Map()
export function formatearFecha(fechaISO) {
  if (diasEntreFechas(fechaISO, fechaISO) !== 0) return '—'
  const locale = getLocale()
  if (!formatosFecha.has(locale)) formatosFecha.set(locale, new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }))
  return formatosFecha.get(locale).format(new Date(fechaISO + 'T00:00:00Z'))
}
