import test from 'node:test'
import assert from 'node:assert/strict'
import { cents, debtBalance, loadDebts, createDebt, addDebtPayment, deleteDebtPayment } from '../src/debts.js'
import { normalizeHomeOrder, moveHomeModule } from '../src/homeModulesModel.js'

test('los pagos se restan con precisión de céntimos y eliminarlos restaura el saldo', () => {
  const debt = { importe: '100.30', pagos_deuda: [{ importe: '0.10' }, { importe: '0.20' }] }
  assert.deepEqual(debtBalance(debt), { total: 10030, paid: 30, remaining: 10000 })
  assert.equal(debtBalance({ ...debt, pagos_deuda: [{ importe: '100.30' }] }).remaining, 0)
  assert.equal(debtBalance({ ...debt, pagos_deuda: [] }).remaining, 10030)
  assert.equal(cents('20,50'), 2050)
  for (const value of ['0', '-1', '1.001', 'abc', Infinity, '1e3']) assert.throws(() => cents(value))
})

function clientMock(result) {
  const calls = []
  const query = { then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) }
  for (const method of ['from', 'select', 'eq', 'order', 'insert', 'delete', 'single']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query }
  }
  return { client: query, calls }
}

test('las deudas se cargan y crean vinculadas al usuario autenticado', async () => {
  const { client, calls } = clientMock({ data: [] })
  await loadDebts('u1', client)
  assert.ok(calls.some(c => c[0] === 'eq' && c[1] === 'user_id' && c[2] === 'u1'))
  await assert.rejects(loadDebts('', client))
  const save = clientMock({ data: { id: 'd1' } })
  await createDebt('u1', { concepto: ' Préstamo ', acreedor: 'Banco', importe: '100.30' }, save.client)
  assert.deepEqual(save.calls.find(c => c[0] === 'insert')[1], { user_id: 'u1', concepto: 'Préstamo', acreedor: 'Banco', importe: 100.3 })
})

test('no permite pagar más del saldo ni fechas inválidas; propaga errores de persistencia', async () => {
  const debt = { id: 'd1', importe: '100', pagos_deuda: [{ importe: '80' }] }
  const { client, calls } = clientMock({ data: { id: 'p1' } })
  await assert.rejects(addDebtPayment(debt, { importe: '20.01', fecha: '2026-09-14' }, client), /saldo/)
  await assert.rejects(addDebtPayment(debt, { importe: '20', fecha: '2026-02-30' }, client))
  assert.equal(calls.length, 0)
  await addDebtPayment(debt, { importe: '20', fecha: '2026-09-14' }, client)
  assert.deepEqual(calls.find(c => c[0] === 'insert')[1], { deuda_id: 'd1', importe: 20, fecha: '2026-09-14' })
  const failure = new Error('Sin permisos')
  await assert.rejects(deleteDebtPayment('p1', 'd1', clientMock({ error: failure }).client), error => error === failure)
})

test('el orden de los módulos tolera preferencias antiguas y mantiene módulos ocultos', () => {
  assert.deepEqual(normalizeHomeOrder(['debts', 'debts', 'desconocido']), ['debts', 'today', 'appointments', 'projects', 'economy', 'summary'])
  const order = ['today', 'economy', 'projects', 'debts', 'summary']
  const next = moveHomeModule(order, ['today', 'projects', 'debts', 'summary'], 'debts', 'today')
  assert.deepEqual(next, ['debts', 'economy', 'today', 'projects', 'summary', 'appointments'])
  assert.deepEqual(moveHomeModule(order, order, 'no-existe', 'today'), [...order, 'appointments'])
})
