import test from 'node:test'
import assert from 'node:assert/strict'
import { proyectoDesdeBD, proyectoParaBD } from '../src/projectModel.js'
import { fechaLocal, reordenarProyectos } from '../src/projectUtils.js'

test('conserva todos los campos al leer y guardar un proyecto', () => {
  const fila = {
    id: 'p1', user_id: 'u1', prioridad: 'bloqueado', estado: 'finalizado', orden: 7,
    nombre: 'Reforma', cliente: 'Ana', telefono: '123', email: 'ana@example.com',
    direccion: 'Calle 1', fecha_inicio: '2026-01-01', fecha_entrega: '2026-10-01',
    fase: 'Ejecución', importancia: 8, presupuesto_total: 2000, presupuesto_gastado: 500,
    presupuesto_pdf: 'presupuesto.pdf', imagen_proyecto: 'imagen.webp', notas: 'Notas',
    tareas: [{ id: 't1', hecha: true, texto: 'Medir', fechaCompletada: '2026-09-05' }],
    proveedores: [{ id: 'pr1', nombre: 'Proveedor' }], tipo_proyecto: 'Local',
    honorarios_diseno: 1000, honorarios_gestion: 300, otros_importes: 0,
    cobros: [{ id: 'c1', importe: 400 }], comisiones: [{ id: 'co1', porcentaje: 5 }],
    historial: [{ id: 'h1', texto: 'Creado' }], horas_estimadas: 20, horas_reales: 12,
  }
  assert.deepEqual(proyectoParaBD(proyectoDesdeBD(fila), 'u1'), fila)
})
test('admite campos ausentes y mantiene los ceros', () => {
  const proyecto = proyectoDesdeBD({ id: 'p1', tareas: null, cobros: {} })
  assert.deepEqual(proyecto.tareas, [])
  assert.deepEqual(proyecto.cobros, [])
  const fila = proyectoParaBD({ id: 'p1', presupuestoTotal: 0 }, 'u1')
  assert.equal(fila.presupuesto_total, 0)
  assert.equal(fila.honorarios_diseno, null)
  assert.equal(fila.horas_reales, null)
  assert.equal(fila.estado, 'activo')
})
test('rechaza números inválidos antes de enviarlos a la base de datos', () => {
  for (const importe of ['abc', Infinity, NaN]) {
    assert.throws(() => proyectoParaBD({ presupuestoTotal: importe }, 'u1'), /inválido/)
  }
})
test('reordena según el orden visible, independientemente de la respuesta de la base de datos', () => {
  const proyectos = [{ id: 'c', orden: 2 }, { id: 'a', orden: 0 }, { id: 'b', orden: 1 }]
  const resultado = reordenarProyectos(proyectos, ['a', 'b', 'c'], 'c', 'a')
  assert.deepEqual(resultado.map(p => p.id), ['c', 'a', 'b'])
  assert.deepEqual(resultado.map(p => p.orden), [0, 1, 2])
  assert.equal(proyectos[0].orden, 2)
})
test('el arrastre filtrado conserva las posiciones de proyectos ocultos', () => {
  const proyectos = ['a', 'oculto', 'b', 'finalizado'].map((id, orden) => ({ id, orden }))
  const resultado = reordenarProyectos(proyectos, ['a', 'b'], 'b', 'a')
  assert.deepEqual(resultado.map(p => p.id), ['b', 'oculto', 'a', 'finalizado'])
  assert.equal(reordenarProyectos(proyectos, ['a', 'b'], 'desconocido', 'a'), proyectos)
})
test('las fechas de tareas usan el día local cerca de medianoche', () => {
  assert.equal(fechaLocal(new Date(2026, 8, 5, 0, 15)), '2026-09-05')
  assert.equal(fechaLocal(new Date(2026, 0, 1, 23, 59)), '2026-01-01')
})
