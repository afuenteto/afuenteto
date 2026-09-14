import { supabase } from './supabase.js'

export function cents(value) {
  const text = String(value).trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Importe inválido')
  const [whole, fraction = ''] = text.split('.')
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 99999999999999) throw new Error('Importe inválido')
  return amount
}
export function debtBalance(debt) {
  const total = cents(debt.importe)
  const paid = (debt.pagos_deuda || []).reduce((sum, p) => sum + cents(p.importe), 0)
  return { total, paid, remaining: total - paid }
}
export async function loadDebts(userId, client = supabase) {
  if (!userId) throw new Error('No hay sesión')
  const { data, error } = await client.from('deudas').select('*, pagos_deuda(*)').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function createDebt(userId, draft, client = supabase) {
  const concepto = draft.concepto.trim()
  if (!userId || !concepto || concepto.length > 200) throw new Error('Datos inválidos')
  const { data, error } = await client.from('deudas').insert({ user_id: userId, concepto, acreedor: draft.acreedor.trim(), importe: cents(draft.importe) / 100 }).select().single()
  if (error) throw error
  return { ...data, pagos_deuda: [] }
}
export async function addDebtPayment(debt, draft, client = supabase) {
  const amount = cents(draft.importe)
  if (amount > debtBalance(debt).remaining) throw new Error('El pago supera el saldo pendiente')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.fecha) || new Date(draft.fecha + 'T12:00:00Z').toISOString().slice(0, 10) !== draft.fecha) throw new Error('Fecha inválida')
  const { data, error } = await client.from('pagos_deuda').insert({ deuda_id: debt.id, importe: amount / 100, fecha: draft.fecha }).select().single()
  if (error) throw error
  return data
}
export async function deleteDebtPayment(id, debtId, client = supabase) {
  const { error } = await client.from('pagos_deuda').delete().eq('id', id).eq('deuda_id', debtId).select('id').single()
  if (error) throw error
}

export async function deleteDebt(id, userId, client = supabase) {
  if (!userId) throw new Error('No hay sesión')
  const { error } = await client.from('deudas').delete().eq('id', id).eq('user_id', userId).select('id').single()
  if (error) throw error
}
