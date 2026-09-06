import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { proyectoDesdeBD } from '../src/projectModel.js'

test('renderiza los componentes con proyectos nuevos y con datos', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const cliente = { id: 'c1', nombre: 'Ana' }
    const ejemplos = [proyectoDesdeBD({ id: 'nuevo' }), proyectoDesdeBD({
      id: 'p1', nombre: 'Reforma', cliente: 'Ana', estado: 'finalizado',
      tareas: [{ id: 't1', texto: 'Medir', hecha: false }, { id: 't2', texto: 'Plano', hecha: true }],
      cobros: [{ id: 'c1', concepto: 'Anticipo', estado: 'previsto', importe: 100 }],
      comisiones: [{ id: 'co1', presupuesto: 100, porcentaje: 10 }],
      historial: [{ id: 'h1', fecha: '2026-09-05', texto: 'Creado' }],
    })]
    const nombres = ['ProjectCard', 'ProjectModal', 'TasksModal', 'TasksPanel', 'ClientsPanel',
      'ClientModal', 'StudioDashboard', 'StudioToday', 'StudioProfile', 'EconomicChart',
      'DeliveriesPanel', 'PaymentsPanel', 'BlockedPanel', 'ProjectHistory', 'PhaseRail']
    for (const nombre of nombres) {
      const { default: Componente } = await server.ssrLoadModule('/src/components/' + nombre + '.jsx')
      for (const proyecto of ejemplos) {
        const html = renderToString(React.createElement(Componente, {
          proyecto, proyectos: [proyecto], clientes: [cliente], cliente,
          usuario: { id: 'u1' }, fase: proyecto.fase,
        }))
        assert.ok(html.length > 0, nombre)
        assert.ok(!html.includes('NaN'), nombre + ' no debe mostrar cantidades inválidas')
      }
    }
    const { setLanguage, languages, t } = await server.ssrLoadModule('/src/i18n.js')
    const { default: ProjectModal } = await server.ssrLoadModule('/src/components/ProjectModal.jsx')
    const { default: LanguageSelector } = await server.ssrLoadModule('/src/components/LanguageSelector.jsx')
    const proyecto = { ...ejemplos[1], nombre: 'Guardar', cliente: 'Entrega', tipoProyecto: 'Vivienda unifamiliar' }
    try {
      for (const { code } of languages) {
        setLanguage(code, false)
        const html = renderToString(React.createElement(ProjectModal, { proyecto, clientes: [], usuario: { id: 'u1' } }))
        // Labels change; editable data and persisted select values must not.
        assert.ok(html.includes('value="Guardar"'), code + ': nombre intacto')
        assert.ok(html.includes('value="Vivienda unifamiliar" selected=""'), code + ': tipo estable')
        assert.ok(html.includes('value="Diseño"'), code + ': fase estable')
        assert.ok(html.includes(t('Nombre del proyecto')), code + ': formulario traducido')
        const selector = renderToString(React.createElement(LanguageSelector))
        assert.equal((selector.match(/<option /g) || []).length, languages.length)
      }
    } finally { setLanguage('es', false) }
  } finally { await server.close() }
})
