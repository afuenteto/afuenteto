import test from 'node:test'
import assert from 'node:assert/strict'
import { retryJwtRead } from '../src/retryJwt.js'

const future = { code: 'PGRST303', message: 'JWT issued at future' }

test('recupera la lectura tras un rechazo temporal del JWT', async () => {
  let calls = 0
  const delays = []
  const result = await retryJwtRead(async () => {
    if (++calls < 3) throw future
    return ['proyectos', 'clientes']
  }, { wait: async ms => delays.push(ms) })
  assert.deepEqual(result, ['proyectos', 'clientes'])
  assert.deepEqual(delays, [1000, 2000])
})

test('limita los reintentos y conserva el error si persiste', async () => {
  let calls = 0
  await assert.rejects(retryJwtRead(async () => {
    calls++
    throw future
  }, { wait: async () => {} }), error => error === future)
  assert.equal(calls, 4)
})

test('no reintenta otros errores de autenticación o permisos', async () => {
  for (const message of ['JWT expired', 'permission denied']) {
    const error = { code: 'PGRST303', message }
    await assert.rejects(retryJwtRead(async () => { throw error }, {
      wait: async () => assert.fail('No debe esperar'),
    }), actual => actual === error)
  }
})

test('deja de consultar cuando se desmonta o cambia la cuenta durante la espera', async () => {
  let active = true
  let calls = 0
  const result = await retryJwtRead(async () => {
    calls++
    throw future
  }, {
    isActive: () => active,
    wait: async () => { active = false },
  })
  assert.equal(calls, 1)
  assert.equal(result, undefined)
})
