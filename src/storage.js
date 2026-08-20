import { supabase } from './supabase.js'

export const FASES = ['Diseño', 'Presupuesto', 'Ejecución', 'Entrega']

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function proyectoDesdeBD(row) {
  return {
    id: row.id,
    nombre: row.nombre || '',
    cliente: row.cliente || '',
    telefono: row.telefono || '',
    email: row.email || '',
    direccion: row.direccion || '',
    fechaInicio: row.fecha_inicio || '',
    fechaEntrega: row.fecha_entrega || '',
    fase: row.fase || FASES[0],
    presupuestoTotal: row.presupuesto_total ?? '',
    presupuestoGastado: row.presupuesto_gastado ?? '',
    notas: row.notas || '',
    tareas: Array.isArray(row.tareas) ? row.tareas : [],
    proveedores: Array.isArray(row.proveedores) ? row.proveedores : [],
  }
}

function proyectoParaBD(proyecto, userId) {
  return {
    id: proyecto.id,
    user_id: userId,
    nombre: proyecto.nombre || '',
    cliente: proyecto.cliente || '',
    telefono: proyecto.telefono || '',
    email: proyecto.email || '',
    direccion: proyecto.direccion || '',
    fecha_inicio: proyecto.fechaInicio || null,
    fecha_entrega: proyecto.fechaEntrega || null,
    fase: proyecto.fase || FASES[0],
    presupuesto_total:
      proyecto.presupuestoTotal === '' ? null : Number(proyecto.presupuestoTotal),
    presupuesto_gastado:
      proyecto.presupuestoGastado === '' ? null : Number(proyecto.presupuestoGastado),
    notas: proyecto.notas || '',
    tareas: proyecto.tareas || [],
    proveedores: proyecto.proveedores || [],
  }
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
  const { error } = await supabase
    .from('proyectos')
    .delete()
    .eq('id', id)

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
    presupuestoTotal: '',
    presupuestoGastado: '',
    notas: '',
    tareas: [],
    proveedores: [],
    tipoProyecto: 'Vivienda',
    honorariosDiseno: '',
    honorariosGestion: '',
    otrosImportes: '',
    cobros: [],
    horasEstimadas: '',
    horasReales: '',
  }
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

  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
