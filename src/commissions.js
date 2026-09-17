import { commissionNumber } from './commissionNumbers.js'
import { supabase } from './supabase.js'

export function commissionAmount(item) {
  return item.calculo === 'importe' && Number.isFinite(Number(item.importe))
    ? Number(item.importe) : Number(item.presupuesto || 0) * Number(item.porcentaje || 0) / 100
}

export function changeCommissionNumber(draft, field, value) {
  const next = { ...draft, [field]: value, calculo: field === 'importe' ? 'importe' : field === 'porcentaje' ? 'porcentaje' : draft.calculo || 'porcentaje' }
  const base = commissionNumber(next.presupuesto)
  if (next.calculo === 'importe') {
    const amount = commissionNumber(next.importe)
    next.porcentaje = base > 0 && Number.isFinite(amount) ? String(Number((amount / base * 100).toFixed(8))) : ''
  } else {
    const rate = Number(String(next.porcentaje).replace(',', '.'))
    next.importe = base > 0 && Number.isFinite(rate) ? (base * rate / 100).toFixed(2) : ''
  }
  return next
}

export function prepareCommission(draft) {
  const presupuesto = commissionNumber(draft.presupuesto)
  const porcentaje = Number(String(draft.porcentaje).replace(',', '.'))
  const importe = draft.calculo === 'importe' ? commissionNumber(draft.importe) : Math.round(presupuesto * porcentaje) / 100
  if (!draft.colaborador?.trim()) throw new Error('Indica el colaborador.')
  if (!(presupuesto > 0) || !Number.isFinite(presupuesto) || !(porcentaje > 0) || !Number.isFinite(porcentaje) || !(importe > 0) || !Number.isFinite(importe)) throw new Error('Introduce un presupuesto y una comisión mayores que cero.')
  return { ...draft, colaborador: draft.colaborador.trim(), presupuesto, porcentaje, importe, concepto: draft.concepto?.trim() || 'Comisión' }
}

export function collaboratorOptions(projects, suppliers) {
  const byName = new Map()
  for (const project of projects) for (const item of project.comisiones || []) {
    if (item.colaborador?.trim()) byName.set(item.colaborador.trim().toLocaleLowerCase(), {
      nombre: item.colaborador.trim(), concepto: item.concepto || '', contacto: item.contacto || '', telefono: item.telefono || '', email: item.email || '', direccion: item.direccion || '',
    })
  }
  for (const supplier of suppliers) {
    const key = supplier.nombre.trim().toLocaleLowerCase()
    const previous = byName.get(key)
    byName.set(key, { ...previous, ...supplier, concepto: supplier.especialidad || previous?.concepto || '' })
  }
  return [...byName.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function saveCommission(userId, projectId, draft, client = supabase, remove = false) {
  if (!userId || !projectId) throw new Error('Selecciona un proyecto.')
  const item = remove ? draft : prepareCommission(draft)
  const { data: project, error: readError } = await client.from('proyectos').select('comisiones').eq('id', projectId).eq('user_id', userId).single()
  if (readError) throw readError
  const columns = (project.comisiones || []).map((_, index) => `snapshot_${index}:comisiones->>${index}`)
  const { data: current, error: snapshotError } = await client.from('proyectos').select(['comisiones', ...columns].join(',')).eq('id', projectId).eq('user_id', userId).single()
  if (snapshotError) throw snapshotError
  if ((current.comisiones || []).length !== (project.comisiones || []).length) throw new Error('Las comisiones han cambiado. Vuelve a guardar.')
  const original = current.comisiones || []
  const stored = { ...item, presupuestoPdf: item.presupuestoPdfPath ? '' : item.presupuestoPdf || '' }
  const items = remove ? original.filter(c => c.id !== item.id) : original.some(c => c.id === item.id) ? original.map(c => c.id === item.id ? stored : c) : [...original, stored]
  let request = client.from('proyectos').update({ comisiones: items }).eq('id', projectId).eq('user_id', userId)
  // Las columnas JSON no admiten igualdad directa; comparar cada elemento como texto.
  for (let index = 0; index < original.length; index++) {
    request = current[`snapshot_${index}`] === null ? request.is(`comisiones->>${index}`, null) : request.eq(`comisiones->>${index}`, current[`snapshot_${index}`])
  }
  request = request.is(`comisiones->${original.length}`, null)
  const { data, error } = await request.select('id,comisiones').single()
  if (error) throw new Error('No se pudo guardar. Comprueba la conexión y vuelve a intentarlo; puede haber cambios desde otro dispositivo.')
  return { ...data, comisiones: data.comisiones.map(c => c.id === item.id ? item : c) }
}
