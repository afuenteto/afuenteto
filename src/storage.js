import { getLocale } from './i18n.js'
import { supabase } from './supabase.js'

import { FASES, proyectoDesdeBD, proyectoParaBD } from './projectModel.js'
export { FASES } from './projectModel.js'

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export async function cargarProyectos() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return []

  const { data, error } = await supabase
    .from('proyectos')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw error

  return (data || []).map(proyectoDesdeBD)
}

export async function guardarProyecto(proyecto) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('No hay un usuario autenticado.')

  const fila = proyectoParaBD(proyecto, user.id)

  const { data, error } = await supabase
    .from('proyectos')
    .upsert(fila, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error

  return proyectoDesdeBD(data)
}

export async function eliminarProyecto(id) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('No hay un usuario autenticado.')
  const { error } = await supabase
    .from('proyectos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
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
  if (!fechaISO) return null

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const objetivo = new Date(fechaISO + 'T00:00:00')
  if (Number.isNaN(objetivo.getTime())) return null

  return Math.round((objetivo - hoy) / 86400000)
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'

  const d = new Date(fechaISO + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleDateString(getLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
