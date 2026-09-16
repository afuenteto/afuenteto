import test from 'node:test'
import assert from 'node:assert/strict'
import { incomeEntries, incomePeriods, incomeTotals } from '../src/incomeModel.js'

test('agrupa ingresos reales por fecha de cobro, incluyendo proyectos finalizados', () => {
  const entries = incomeEntries([{ estado: 'finalizado', cobros: [
    { importe: 10.10, fecha: '2025-12-31', estado: 'cobrado' },
    { importe: 20.20, fecha: '2026-01-01', estado: 'cobrado' },
    { importe: 999, fecha: '2026-01-01', estado: 'previsto' },
  ], comisiones: [
    { presupuesto: 100, porcentaje: 10, estado: 'cobrada', fecha: '2025-12-01', fechaCobro: '2026-01-02' },
    { presupuesto: 999, porcentaje: 10, estado: 'pendiente' },
    { presupuesto: 200, porcentaje: 10, estado: 'cobrada', fecha: '2026-01-02' },
  ] }])
  const months = incomePeriods(entries, 'months', '2026')
  assert.equal(months.length, 12)
  assert.deepEqual(months[0], { key: '2026-01', general: 2020, commission: 1000, total: 3020 })
  assert.deepEqual(incomePeriods(entries, 'years'), [
    { key: '2026', general: 2020, commission: 1000, total: 3020 },
    { key: '2025', general: 1010, commission: 0, total: 1010 },
  ])
  assert.equal(incomeTotals(entries.filter(item => !item.date)).commission, 2000)
})

test('mantiene los importes sin fecha válida fuera de los periodos', () => {
  const entries = incomeEntries([{ cobros: [{ importe: 5, fecha: '2026-02-30' }, { importe: 0.10 }, { importe: 0.20 }] }])
  assert.deepEqual(incomePeriods(entries, 'years'), [])
  assert.equal(incomeTotals(entries).total, 530)
})
