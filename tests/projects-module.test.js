import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarProyectosDeUsuario } from '../src/modules/projects/index.js'

function clienteSimulado(resultado, consultas = []) {
  return {
    from(tabla) {
      consultas.push(['from', tabla])
      return {
        select(columnas) {
          consultas.push(['select', columnas])
          return {
            async eq(campo, valor) {
              consultas.push(['eq', campo, valor])
              return resultado
            },
          }
        },
      }
    },
  }
}

test('el módulo carga solo los proyectos del usuario y resuelve sus archivos privados', async () => {
  const fila = {
    id: 'p1', nombre: 'Reforma', fase: 'Ejecución', estado: 'finalizado',
    imagen_proyecto: 'u1/p1/cabecera.webp', presupuesto_pdf: 'u1/p1/presupuesto.pdf',
    tareas: [{ id: 't1', texto: 'Revisar', hecha: true }],
    cobros: [{ id: 'c1', importe: 100, estado: 'cobrado' }],
    historial: [{ id: 'h1', texto: 'Creado' }],
    comisiones: [
      { id: 'co1', presupuesto: 50, porcentaje: 10, presupuestoPdfPath: 'u1/p1/colaborador.pdf' },
      { id: 'co2', presupuestoPdf: 'https://ejemplo.test/presupuesto-publico.pdf' },
    ],
  }
  const original = structuredClone(fila)
  const consultas = []
  const firmas = []
  const [proyecto] = await cargarProyectosDeUsuario('u1', {
    cliente: clienteSimulado({ data: [fila], error: null }, consultas),
    firmarUrl: async (bucket, ruta) => {
      firmas.push([bucket, ruta])
      return `https://archivos.test/${bucket}/${ruta}`
    },
  })

  assert.deepEqual(consultas, [['from', 'proyectos'], ['select', '*'], ['eq', 'user_id', 'u1']])
  assert.deepEqual(firmas, [
    ['presupuestos', 'u1/p1/colaborador.pdf'],
    ['imagenes-proyectos', 'u1/p1/cabecera.webp'],
    ['presupuestos', 'u1/p1/presupuesto.pdf'],
  ])
  assert.equal(proyecto.imagenProyecto, 'https://archivos.test/imagenes-proyectos/u1/p1/cabecera.webp')
  assert.equal(proyecto.presupuestoPdf, 'https://archivos.test/presupuestos/u1/p1/presupuesto.pdf')
  assert.equal(proyecto.comisiones[0].presupuestoPdf, 'https://archivos.test/presupuestos/u1/p1/colaborador.pdf')
  assert.equal(proyecto.comisiones[1].presupuestoPdf, fila.comisiones[1].presupuestoPdf)
  assert.equal(proyecto.imagenProyectoPath, fila.imagen_proyecto)
  assert.equal(proyecto.estado, 'finalizado')
  assert.equal(proyecto.fase, 'Ejecución')
  assert.deepEqual(proyecto.tareas, fila.tareas)
  assert.deepEqual(proyecto.cobros, fila.cobros)
  assert.deepEqual(proyecto.historial, fila.historial)
  assert.deepEqual(fila, original, 'no altera los datos recibidos')
})

test('conserva las URL antiguas y admite proyectos sin archivos', async () => {
  const proyectos = await cargarProyectosDeUsuario('u1', {
    cliente: clienteSimulado({ data: [
      { id: 'p1', imagen_proyecto: 'https://ejemplo.test/imagen.webp', presupuesto_pdf: 'https://ejemplo.test/presupuesto.pdf' },
      { id: 'p2' },
    ] }),
    firmarUrl: async () => assert.fail('no debe firmar rutas públicas ni vacías'),
  })
  assert.equal(proyectos[0].imagenProyecto, 'https://ejemplo.test/imagen.webp')
  assert.equal(proyectos[0].presupuestoPdf, 'https://ejemplo.test/presupuesto.pdf')
  assert.equal(proyectos[1].imagenProyecto, '')
  assert.deepEqual(proyectos[1].comisiones, [])
})

test('devuelve una lista vacía cuando no hay proyectos', async () => {
  for (const data of [null, []]) {
    assert.deepEqual(await cargarProyectosDeUsuario('u1', {
      cliente: clienteSimulado({ data }),
      firmarUrl: async () => assert.fail('no debe solicitar archivos'),
    }), [])
  }
})

test('propaga los errores de carga y de acceso a archivos', async () => {
  const errorConsulta = new Error('Error de consulta')
  await assert.rejects(cargarProyectosDeUsuario('u1', {
    cliente: clienteSimulado({ error: errorConsulta }),
    firmarUrl: async () => assert.fail('no debe solicitar archivos tras un error'),
  }), error => error === errorConsulta)

  const errorArchivo = new Error('Archivo no disponible')
  await assert.rejects(cargarProyectosDeUsuario('u1', {
    cliente: clienteSimulado({ data: [{ id: 'p1', imagen_proyecto: 'u1/p1/imagen.webp' }] }),
    firmarUrl: async () => { throw errorArchivo },
  }), error => error === errorArchivo)
})

test('rechaza la carga sin usuario antes de consultar la base de datos', async () => {
  const consultas = []
  await assert.rejects(cargarProyectosDeUsuario('', {
    cliente: clienteSimulado({ data: [] }, consultas),
  }), /usuario/)
  assert.deepEqual(consultas, [])
})
