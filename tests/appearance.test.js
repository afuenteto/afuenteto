import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAppearance, resolvePalette, APPEARANCE_KEY } from '../src/appearance.js'
import { guardarMetadatosDeUsuario } from '../src/modules/preferences/repository.js'

test('la apariencia conserva valores válidos y recupera los predeterminados', () => {
  assert.deepEqual(normalizeAppearance(null), { palette: 'yellow', font: 'default', logoPath: '' })
  assert.equal(normalizeAppearance({ palette: '__proto__', font: 'otro' }).palette, 'yellow')
  assert.deepEqual(normalizeAppearance({ palette: 'blue', font: 'serif', logoPath: 'u/perfil/logo.png' }),
    { palette: 'blue', font: 'serif', logoPath: 'u/perfil/logo.png' })
})
test('las estaciones cambian en marzo, junio, septiembre y diciembre', () => {
  const expected = ['blue', 'blue', 'green', 'green', 'green', 'yellow', 'yellow', 'yellow', 'red', 'red', 'red', 'blue']
  expected.forEach((color, month) => assert.equal(resolvePalette('seasonal', new Date(2026, month, 1)), color))
  assert.equal(resolvePalette('green', new Date(2026, 11, 1)), 'green')
})
test('el guardado de apariencia actualiza solo su clave de metadatos y verifica la cuenta', async () => {
  const user = { id: 'u1' }
  const cliente = { auth: {
    getSession: async () => ({ data: { session: { user, access_token: 'token' } } }),
    getUser: async () => ({ data: { user } }),
  } }
  let calls = 0
  const settings = normalizeAppearance({ palette: 'seasonal', font: 'serif' })
  const solicitar = async (url, options) => {
    calls++
    assert.deepEqual(JSON.parse(options.body), { data: { [APPEARANCE_KEY]: settings } })
    return { ok: true, json: async () => user }
  }
  await guardarMetadatosDeUsuario('u1', { [APPEARANCE_KEY]: settings }, { cliente, solicitar })
  await assert.rejects(guardarMetadatosDeUsuario('u2', { [APPEARANCE_KEY]: settings }, { cliente, solicitar }))
  assert.equal(calls, 1)
})
