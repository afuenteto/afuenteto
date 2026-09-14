import test from 'node:test'
import assert from 'node:assert/strict'
import { urlsFirmadas } from '../src/storageFiles.js'

test('deduplica archivos y limita los lotes a cien rutas', async () => {
  const calls = []
  const cliente = { storage: { from(bucket) {
    assert.equal(bucket, 'presupuestos')
    return { async createSignedUrls(paths, duration) {
      calls.push(paths)
      assert.equal(duration, 3600)
      return { data: paths.map(path => ({ path, signedUrl: 'https://test/' + path, error: null })) }
    } }
  } } }
  const paths = Array.from({ length: 205 }, (_, n) => `u1/${n}.pdf`)
  const result = await urlsFirmadas('presupuestos', [...paths, paths[0], '', 'https://test/public.pdf'], 3600, cliente)
  assert.deepEqual(calls.map(batch => batch.length), [100, 100, 5])
  assert.equal(result.size, 205)
  assert.equal(result.get('u1/204.pdf'), 'https://test/u1/204.pdf')
  assert.equal((await urlsFirmadas('presupuestos', [], 3600, cliente)).size, 0)
  assert.equal(calls.length, 3)
})

test('propaga errores globales, de archivo y respuestas incompletas', async () => {
  for (const response of [{ error: new Error('Sin acceso') },
    { data: [{ path: 'u/a.pdf', error: 'Archivo no disponible', signedUrl: null }] }, { data: [] }]) {
    const cliente = { storage: { from: () => ({ createSignedUrls: async () => response }) } }
    await assert.rejects(urlsFirmadas('presupuestos', ['u/a.pdf'], 3600, cliente))
  }
})
