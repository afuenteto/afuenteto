import test from 'node:test'
import assert from 'node:assert/strict'
import { ordenarProyectos, reordenarProyectos } from '../src/projectUtils.js'

const projects = [
  { id: 'a', orden: 0, fechaEntrega: '2026-12-01', importancia: 2 },
  { id: 'b', orden: 1, fechaEntrega: '2026-10-01', importancia: 9 },
  { id: 'c', orden: 2, fechaEntrega: '', importancia: 5 },
]
const ids = list => list.map(p => p.id)

test('personalizado respeta las posiciones guardadas, independientemente de fechas e importancia', () => {
  assert.deepEqual(ids(ordenarProyectos([...projects].reverse())), ['a', 'b', 'c'])
  assert.deepEqual(ids(ordenarProyectos(projects, 'fecha')), ['b', 'a', 'c'])
  assert.deepEqual(ids(ordenarProyectos(projects, 'importancia')), ['b', 'c', 'a'])
  assert.deepEqual(ids(projects), ['a', 'b', 'c'])
})

test('arrastrar desde una vista automática conserva el resultado al volver al orden personalizado', () => {
  const visible = ids(ordenarProyectos(projects, 'fecha'))
  const saved = reordenarProyectos(projects, visible, 'c', 'b')
  assert.deepEqual(ids(ordenarProyectos(saved)), ['c', 'b', 'a'])
  ordenarProyectos(saved, 'fecha')
  ordenarProyectos(saved, 'importancia')
  assert.deepEqual(ids(ordenarProyectos([...saved].reverse())), ['c', 'b', 'a'])
})

test('el arrastre en una fase no desplaza las posiciones de proyectos ocultos o finalizados', () => {
  const list = ['a', 'oculto', 'b', 'finalizado'].map((id, orden) => ({ id, orden }))
  const saved = reordenarProyectos(list, ['a', 'b'], 'b', 'a')
  assert.deepEqual(ids(ordenarProyectos(saved)), ['b', 'oculto', 'a', 'finalizado'])
  assert.equal(saved.find(p => p.id === 'oculto').orden, 1)
  assert.equal(saved.find(p => p.id === 'finalizado').orden, 3)
})
