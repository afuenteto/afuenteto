import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { createServer as createHttpServer } from 'node:http'
import { buildAgenda, filterAgenda, daysFrom, remainingTime } from '../src/todayModel.js'
import { proyectoDesdeBD, proyectoParaBD } from '../src/projectModel.js'

const modules = { tareas: true, entregas: true, economia: true }
const projects = [{ id: 'p1', nombre: 'Casa', fechaEntrega: '2026-09-17', tareas: [
  { id: '1', texto: 'Visita', fecha: '2026-09-14', hora: '10:30', tipo: 'cita' },
  { id: '2', texto: 'Plano pendiente', fecha: '2026-09-12' },
  { id: '3', texto: 'Sin programar' },
  { id: '4', texto: 'Terminada', fecha: '2026-09-14', hecha: true },
  { id: '5', texto: 'Más adelante', fecha: '2026-10-01' },
] }, { id: 'p2', nombre: 'Finalizado', estado: 'finalizado', fechaEntrega: '2026-09-10',
  tareas: [{ id: '6', texto: 'Antigua' }] }]

test('ordena la agenda y distingue fechas reales, tareas terminadas y proyectos finalizados', () => {
  const agenda = buildAgenda(projects, modules, '2026-09-14', new Date('2026-09-14T09:00:00'))
  assert.deepEqual(agenda.map(i => i.title), ['Visita', 'Casa', 'Más adelante', 'Plano pendiente', 'Sin programar'])
  assert.deepEqual(filterAgenda(agenda, 'today').map(i => i.days), [0, -2])
  assert.deepEqual(filterAgenda(agenda, 'week').map(i => i.days), [0, 3, -2])
  assert.equal(filterAgenda(agenda, 'undated')[0].date, '')
  assert.deepEqual(filterAgenda(agenda, 'immediate').map(i => i.days), [0])
  assert.deepEqual(filterAgenda(agenda, 'overdue').map(i => i.days), [-2])
  assert.equal(filterAgenda(agenda, 'all').length, 5)
  assert.deepEqual(buildAgenda(projects, {}, '2026-09-14'), [])
  assert.equal(buildAgenda(projects, { entregas: true }, '2026-09-14').length, 1)
})

test('compara días naturales en los cambios de horario y rechaza fechas inválidas', () => {
  assert.equal(daysFrom('2026-03-30', '2026-03-28'), 2)
  assert.equal(daysFrom('2026-10-26', '2026-10-24'), 2)
  assert.equal(daysFrom('2026-02-30', '2026-02-28'), null)
  assert.equal(daysFrom('', '2026-09-14'), null)
})

test('conserva la fecha, hora y tipo de cita al guardar y leer de la base de datos', () => {
  const row = proyectoParaBD(projects[0], 'user')
  assert.deepEqual(proyectoDesdeBD(row).tareas, projects[0].tareas)
})

test('muestra agenda y acciones sin abrir la ficha, respeta módulos y estados vacíos', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: { server: createHttpServer() } }, appType: 'custom' })
  try {
    const { default: StudioToday } = await server.ssrLoadModule('/src/components/StudioToday.jsx')
    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const props = { proyectos: [{ id: 'p1', nombre: 'Casa', tareas: [{ id: '1', texto: 'Visita de obra', fecha: date, hora: '09:00' }] }],
      onCompleteTask() {}, onSchedule() {} }
    const html = renderToString(React.createElement(StudioToday, props))
    assert.ok(html.includes('Visita de obra'))
    assert.ok(html.includes('09:00'))
    assert.ok(html.includes('Añadir al calendario'))
    assert.ok(html.includes('Completar tarea: Visita de obra'))
    assert.ok(html.includes('Programar tarea o cita'))
    assert.ok(html.includes('Ampliar · todos los pendientes'))
    assert.ok(!html.includes('Tu agenda, de un vistazo.'))
    assert.match(html, /\d{2} : \d{2} : \d{2}/)
    const { default: ModulePreview } = await server.ssrLoadModule('/src/components/ModulePreview.jsx')
    const preview = renderToString(React.createElement(ModulePreview, { proyectos: [], modulos: modules }))
    assert.ok(preview.includes('aria-label="Citas: 0"'))
    assert.ok(preview.includes('aria-label="Tareas: 0"'))
    const disabled = renderToString(React.createElement(StudioToday, { ...props, modulos: {} }))
    assert.ok(!disabled.includes('Visita de obra'))
    assert.ok(!disabled.includes('Cobros previstos'))
    const empty = renderToString(React.createElement(StudioToday, { proyectos: [] }))
    assert.ok(empty.includes('No hay pendientes en esta vista.'))
  } finally { await server.close() }
})

test('lo próximo va primero por hora, después lo vencido y al final lo que no tiene fecha',()=>{
 const tareas=[{texto:'Sin hora',fecha:'2026-09-16'},{texto:'Tarde',fecha:'2026-09-16',hora:'16:00'},{texto:'Próxima',fecha:'2026-09-16',hora:'11:00',tipo:'cita'},{texto:'Pasada',fecha:'2026-09-16',hora:'08:00'},{texto:'Sin fecha'}]
 assert.deepEqual(buildAgenda([{id:'p',tareas}],{tareas:true},'2026-09-16',new Date('2026-09-16T10:00:00')).map(i=>i.title),['Próxima','Tarde','Sin hora','Pasada','Sin fecha'])
})


test('el tiempo restante cruza medianoche y omite citas pasadas o sin hora', () => {
  const now = new Date('2026-09-16T23:30:00');
  assert.deepEqual(remainingTime({ date: '2026-09-17', time: '01:00' }, now), { days: 0, hours: 1, minutes: 30 });
  assert.deepEqual(remainingTime({ date: '2026-09-18', time: '01:00' }, now), { days: 1, hours: 1, minutes: 30 });
  assert.equal(remainingTime({ date: '2026-09-16', time: '20:00' }, now), null);
  assert.equal(remainingTime({ date: '2026-09-17', time: '' }, now), null);
});
