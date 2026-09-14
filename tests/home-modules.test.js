import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { createServer as createHttpServer } from 'node:http'

test('la entrada muestra los cinco módulos cerrados con asas independientes del título', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: { server: createHttpServer() } }, appType: 'custom' })
  try {
    const { default: HomeModules } = await server.ssrLoadModule('/src/components/HomeModules.jsx')
    const sections = [['today', 'Hoy en el estudio'], ['projects', 'Proyectos'], ['debts', 'Deudas'], ['economy', 'Economía general'], ['summary', 'Resumen del estudio']]
      .map(([id, title]) => ({ id, title, content: React.createElement('p', null, 'CONTENIDO_INTERNO') }))
    const html = renderToString(React.createElement(HomeModules, { usuarioId: 'u1', sections }))
    assert.equal((html.match(/aria-expanded="false"/g) || []).length, 5)
    assert.equal((html.match(/class="home-module-handle"/g) || []).length, 5)
    assert.ok(!html.includes('CONTENIDO_INTERNO'))
    for (const section of sections) assert.ok(html.includes(section.title))
    for (const name of ['StudioDashboard', 'EconomicChart']) {
      const { default: Component } = await server.ssrLoadModule(`/src/components/${name}.jsx`)
      const embedded = renderToString(React.createElement(Component, { embedded: true, proyectos: [] }))
      assert.ok(!embedded.includes('dashboard-toggle'))
    }
  } finally { await server.close() }
})
