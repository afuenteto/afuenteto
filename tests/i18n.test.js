import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogues, languages, resolveLanguage, translate, setLanguage, getLanguage, getLocale,
  subscribeLanguage, LANGUAGE_KEY, formatRelativeDays } from '../src/i18n.js'

test('los 20 idiomas incluyen todos los textos y conservan los parámetros', () => {
  const keys = Object.keys(catalogues.es).sort()
  const params = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort()
  assert.equal(languages.length, 20)
  for (const { code } of languages) {
    assert.deepEqual(Object.keys(catalogues[code]).sort(), keys, code)
    for (const key of keys) {
      assert.ok(catalogues[code][key].trim(), `${code}: ${key}`)
      assert.deepEqual(params(catalogues[code][key]), params(key), `${code}: ${key}`)
    }
  }
})

test('resuelve variantes regionales y recupera español para idiomas desconocidos', () => {
  for (const [input, expected] of [['en-US', 'en'], ['pt-BR', 'pt'], ['zh-Hant-HK', 'zh-TW'],
    ['zh-Hans', 'zh-CN'], ['es_MX', 'es'], ['xx', 'es'], [null, 'es'], ['__proto__', 'es']]) {
    assert.equal(resolveLanguage(input), expected)
  }
})

test('interpola datos literalmente y mantiene mensajes desconocidos', () => {
  assert.equal(translate('en', 'Guardar'), 'Save')
  assert.equal(translate('en', ' · Tareas pendientes: {0}', { 0: 2 }), ' · Pending tasks: 2')
  const value = '<script>{1}</script>'
  assert.equal(translate('en', 'No se pudo guardar el perfil.\n\n{0}', { 0: value }), `The profile could not be saved.\n\n${value}`)
  assert.equal(translate('en', 'Texto de usuario sin traducir'), 'Texto de usuario sin traducir')
})

test('guarda la preferencia, notifica cambios y adapta dirección, fechas y números', () => {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const saved = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: (k, v) => saved.set(k, v) } })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: {} } })
  let changes = 0
  const unsubscribe = subscribeLanguage(() => changes++)
  try {
    setLanguage('ar')
    assert.equal(saved.get(LANGUAGE_KEY), 'ar')
    assert.equal(document.documentElement.lang, 'ar')
    assert.equal(document.documentElement.dir, 'rtl')
    setLanguage('en')
    assert.equal(document.documentElement.dir, 'ltr')
    assert.equal(getLocale(), 'en-GB')
    assert.equal(formatRelativeDays(1), 'tomorrow')
    assert.equal(formatRelativeDays(2), 'in 2 days')
    assert.equal(formatRelativeDays(null), '—')
    assert.equal((1234.5).toLocaleString(getLocale()), '1,234.5')
    assert.equal(changes, 2)
    setLanguage('en')
    assert.equal(changes, 2)
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked') } })
    assert.doesNotThrow(() => setLanguage('fr'))
    assert.equal(getLanguage(), 'fr')
  } finally {
    unsubscribe()
    setLanguage('es', false)
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage)
    else delete globalThis.localStorage
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument)
    else delete globalThis.document
  }
})
