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
  } finally { await server.close() }
})
