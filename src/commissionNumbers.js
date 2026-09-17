export function commissionNumber(value) {
  const text = String(value ?? '').trim()
  if (!text) return 0
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return NaN
  return Number(text.replace(',', '.'))
}

export function normalizeCommissions(items) {
  return items.map(item => {
    const presupuesto = commissionNumber(item.presupuesto)
    const porcentaje = commissionNumber(item.porcentaje)
    if (!Number.isFinite(presupuesto) || !Number.isFinite(porcentaje) || presupuesto <= 0 || porcentaje <= 0) {
      throw new Error('Indica un presupuesto y un porcentaje válidos, mayores que cero, con hasta dos decimales.')
    }
    return { ...item, presupuesto, porcentaje }
  })
}
