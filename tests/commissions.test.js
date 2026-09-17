import test from 'node:test'
import assert from 'node:assert/strict'
import { changeCommissionNumber, prepareCommission, commissionAmount, collaboratorOptions, saveCommission } from '../src/commissions.js'
import { incomeEntries } from '../src/incomeModel.js'

test('porcentaje e importe se recalculan en ambas direcciones sin perder céntimos', () => {
  let draft = { id: 'new', colaborador: 'Carpintero', presupuesto: '300', porcentaje: '', calculo: 'porcentaje' }
  draft = changeCommissionNumber(draft, 'porcentaje', '10,5')
  assert.equal(draft.importe, '31.50')
  draft = changeCommissionNumber(draft, 'importe', '10,01')
  assert.equal(draft.porcentaje, '3.33666667')
  const saved = prepareCommission(draft)
  assert.equal(commissionAmount(saved), 10.01)
  assert.equal(incomeEntries([{ comisiones: [{ ...saved, estado: 'cobrada', fechaCobro: '2026-09-17' }] }])[0].cents, 1001)
  draft = changeCommissionNumber(draft, 'presupuesto', '600')
  assert.equal(draft.importe, '10,01')
  assert.equal(draft.porcentaje, '1.66833333')
  assert.throws(() => prepareCommission({ ...draft, presupuesto: '' }))
})

test('recupera especialidad y contacto de colaboradores anteriores y proveedores', () => {
  const options = collaboratorOptions([{ comisiones: [{ colaborador: 'Juan', concepto: 'Carpintería' }] }], [{ nombre: 'Juan', telefono: '123', contacto: 'Juan Pérez' }])
  assert.equal(options.length, 1)
  assert.equal(options[0].concepto, 'Carpintería')
  assert.equal(options[0].telefono, '123')
})

test('guarda directamente la comisión nueva, conserva otras y limita escritura a la cuenta', async () => {
  const original = [{ id: 'old', presupuesto: 100, porcentaje: 10, presupuestoPdfPath: 'user/old.pdf' }]
  let update, calls = [], conditions = []
  const client = { from(table) {
    assert.equal(table, 'proyectos')
    let writing = false
    const chain = { select() { return chain }, is(key, value) { conditions.push([key, value]); return chain }, eq(key, value) { conditions.push([key, value]); return chain }, update(value) { writing = true; update = value; return chain }, async single() {
      calls.push(writing ? 'write' : 'read')
      return { data: writing ? { id: 'project', comisiones: update.comisiones } : { comisiones: original, snapshot_0: JSON.stringify(original[0]) } }
    } }
    return chain
  } }
  const result = await saveCommission('user', 'project', { id: 'new', colaborador: 'Juan', presupuesto: '1000', porcentaje: '10', calculo: 'porcentaje' }, client)
  assert.deepEqual(calls, ['read', 'read', 'write'])
  assert.deepEqual(result.comisiones[0], original[0])
  assert.equal(result.comisiones[1].importe, 100)
  assert.deepEqual(Object.keys(update), ['comisiones'])
  assert.equal(conditions.filter(([key, value]) => key === 'user_id' && value === 'user').length, 3)
  assert.ok(conditions.some(([key, value]) => key === 'comisiones->>0' && value === JSON.stringify(original[0])))
  assert.ok(conditions.some(([key, value]) => key === 'comisiones->1' && value === null))
})
