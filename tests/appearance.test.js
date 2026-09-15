import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAppearance, resolvePalette, APPEARANCE_KEY, squareCrop } from '../src/appearance.js'
import { guardarMetadatosDeUsuario } from '../src/modules/preferences/repository.js'

test('la apariencia conserva valores válidos y recupera los predeterminados', () => {
  assert.deepEqual(normalizeAppearance(null), { palette: 'yellow', font: 'default', logoPath: '', headerLabel: '', headerTitle: '' })
  assert.equal(normalizeAppearance({ palette: '__proto__', font: 'otro' }).palette, 'yellow')
  assert.deepEqual(normalizeAppearance({ palette: 'blue', font: 'serif', logoPath: 'u/perfil/logo.png' }),
    { palette: 'blue', font: 'serif', logoPath: 'u/perfil/logo.png', headerLabel: '', headerTitle: '' })
})
test('el recorte cuadrado respeta encuadre y límites con imágenes horizontales, verticales y zoom', () => {
  assert.deepEqual(squareCrop(1200, 800), { size: 800, sx: 200, sy: 0 })
  assert.deepEqual(squareCrop(800, 1200, 1, 50, 100), { size: 800, sx: 0, sy: 400 })
  assert.deepEqual(squareCrop(1200, 800, 2, 100, 0), { size: 400, sx: 800, sy: 0 })
  for (const [w, h] of [[300, 900], [900, 300], [512, 512]]) {
    const crop = squareCrop(w, h, 4, -20, 150)
    assert.ok(crop.sx >= 0 && crop.sy >= 0 && crop.sx + crop.size <= w && crop.sy + crop.size <= h)
  }
})
test('la cabecera personalizada se conserva y los campos vacíos recuperan las traducciones predeterminadas', () => {
  const settings = normalizeAppearance({ headerLabel: '  Mi estudio  ', headerTitle: 'Obras' })
  assert.equal(settings.headerLabel, 'Mi estudio')
  assert.equal(settings.headerTitle, 'Obras')
  assert.equal(normalizeAppearance({ headerTitle: ' '.repeat(20) }).headerTitle, '')
  assert.equal(normalizeAppearance({ headerTitle: 'a'.repeat(150) }).headerTitle.length, 100)
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
