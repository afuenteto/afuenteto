import { supabase } from './supabase.js'
import { diasEntreFechas } from './projectUtils.js'

export async function saveGenericAppointment(userId, task, client = supabase) {
  if (!userId || !task.id || !task.texto?.trim() || task.texto.trim().length > 300 || diasEntreFechas(task.fecha, '2000-01-01') === null || (task.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.hora))) throw new Error('Cita no válida')
  const values = { id: task.id, user_id: userId, texto: task.texto.trim(), fecha: task.fecha,
    hora: task.hora || '', hecha: Boolean(task.hecha), fechaCompletada: task.fechaCompletada || '',
    tipoCita: task.tipoCita === 'personal' ? 'personal' : 'generic' }
  const { data, error } = await client.from('citas_genericas').upsert(values).select().single()
  if (error) throw error
  return { ...data, tipo: 'cita', prioridad: 'normal' }
}
