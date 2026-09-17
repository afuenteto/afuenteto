import test from 'node:test'
import assert from 'node:assert/strict'
import { saveGenericAppointment } from '../src/genericAppointments.js'
import { buildAgenda } from '../src/todayModel.js'

test('guarda la cita genérica ligada al usuario sin un proyecto y conserva su estado', async () => {
  let row
  const client = { from(table) {
    assert.equal(table, 'citas_genericas')
    return { upsert(value) { row = value; return { select() { return { single: async () => ({ data: row }) } } } } }
  } }
  const task = await saveGenericAppointment('user', { id: 'appointment', texto: ' Dentista ', fecha: '2026-09-17', hora: '12:00', hecha: true, fechaCompletada: '2026-09-17', project: 'generic' }, client)
  assert.equal(row.user_id, 'user')
  assert.equal(row.texto, 'Dentista')
  assert.equal(row.project, undefined)
  assert.equal(task.tipo, 'cita')
  assert.equal(task.hecha, true)
  const project = { id: 'generic', nombre: 'Genérico', tareas: [task] }
  assert.equal(buildAgenda([project], { tareas: true }, '2026-09-17').length, 0)
  assert.equal(buildAgenda([{ ...project, tareas: [{ ...task, hecha: false }] }], { tareas: true }, '2026-09-17')[0].title, 'Dentista')
})

test('rechaza citas sin sesión, fechas imposibles y horas inválidas antes de guardar', async () => {
  const valid = { id: 'a', texto: 'Cita', fecha: '2026-09-17', hora: '12:00' }
  await assert.rejects(saveGenericAppointment('', valid, {}))
  for (const changes of [{ texto: ' ' }, { fecha: '2026-02-30' }, { hora: '25:00' }]) {
    await assert.rejects(saveGenericAppointment('user', { ...valid, ...changes }, {}))
  }
})
