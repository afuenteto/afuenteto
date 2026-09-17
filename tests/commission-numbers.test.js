import test from 'node:test'
import assert from 'node:assert/strict'
import { commissionNumber, normalizeCommissions } from '../src/commissionNumbers.js'

test('acepta coma y punto decimal y guarda números para los balances', () => {
  assert.equal(commissionNumber('1234,56'), 1234.56)
  assert.equal(commissionNumber('1234.56'), 1234.56)
  assert.equal(commissionNumber(''), 0)
  const [item] = normalizeCommissions([{ presupuesto: '1200,50', porcentaje: '10,25', presupuestoPdfPath: 'user/document.pdf' }])
  assert.equal(item.presupuesto, 1200.5)
  assert.equal(item.porcentaje, 10.25)
  assert.equal(item.presupuestoPdfPath, 'user/document.pdf')
})

test('impide guardar importes ambiguos o inválidos', () => {
  for (const value of ['1.234,56', 'abc', '-10', '0', '10,123', '']) {
    assert.throws(() => normalizeCommissions([{ presupuesto: value, porcentaje: '10' }]))
    assert.throws(() => normalizeCommissions([{ presupuesto: '100', porcentaje: value }]))
  }
})
