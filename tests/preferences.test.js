import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CLAVE_MODULOS, MODULOS_PREDETERMINADOS, normalizarModulos,
  modulosDeUsuario, conservarDatosDesactivados,
} from '../src/modules/preferences/model.js'
import { guardarModulosDeUsuario } from '../src/modules/preferences/repository.js'
import { proyectoDesdeBD, proyectoParaBD } from '../src/projectModel.js'

test('las cuentas sin preferencias conservan todos los módulos; solo se aceptan booleanos conocidos', () => {
  for (const valor of [undefined, null, [], 'ninguno', 0]) {
    assert.deepEqual(normalizarModulos(valor), MODULOS_PREDETERMINADOS)
  }
  const configuracion = { tareas: false, economia: 'false', entregas: null, proyectos: false }
  assert.deepEqual(normalizarModulos(configuracion), { ...MODULOS_PREDETERMINADOS, tareas: false })
  assert.deepEqual(normalizarModulos(Object.create({ tareas: false })), MODULOS_PREDETERMINADOS)
  assert.deepEqual(configuracion, { tareas: false, economia: 'false', entregas: null, proyectos: false })
})

test('las preferencias de una cuenta no se comparten con otra', () => {
  const ana = { id: 'ana', user_metadata: { [CLAVE_MODULOS]: { tareas: false } } }
  const luis = { id: 'luis', user_metadata: { [CLAVE_MODULOS]: { economia: false } } }
  assert.deepEqual(modulosDeUsuario(ana), { ...MODULOS_PREDETERMINADOS, tareas: false })
  assert.deepEqual(modulosDeUsuario(luis), { ...MODULOS_PREDETERMINADOS, economia: false })
  assert.deepEqual(modulosDeUsuario(null), MODULOS_PREDETERMINADOS)
  const borrador = modulosDeUsuario(ana)
  borrador.documentos = false
  assert.equal(modulosDeUsuario(ana).documentos, true, 'editar un borrador no cambia lo guardado')
})

const original = proyectoDesdeBD({
  id: 'p1', nombre: 'Reforma', direccion: 'Calle Uno', cliente: 'Ana', telefono: '123', email: 'a@example.test',
  fecha_entrega: '2026-12-20', presupuesto_total: 1000, presupuesto_gastado: 100,
  honorarios_diseno: 500, honorarios_gestion: 200, otros_importes: 300,
  horas_estimadas: 40, horas_reales: 15,
  imagen_proyecto: 'ana/p1/imagen.webp', presupuesto_pdf: 'ana/p1/general.pdf',
  tareas: [{ id: 't1', texto: 'Medir', hecha: true }],
  proveedores: [{ id: 'pr1', nombre: 'Proveedor' }],
  cobros: [{ id: 'co1', importe: 100, estado: 'cobrado' }],
  comisiones: [{ id: 'c1', presupuesto: 100, porcentaje: 10,
    presupuestoPdf: 'https://files.example.test/comision.pdf', presupuestoPdfPath: 'ana/p1/comision.pdf' }],
})

test('editar la ficha con todos los módulos apagados conserva sus datos al guardarla en la BD', () => {
  const apagados = Object.fromEntries(Object.keys(MODULOS_PREDETERMINADOS).map(id => [id, false]))
  const antes = structuredClone(original)
  const parcial = { id: original.id, nombre: 'Reforma actualizada', direccion: 'Calle Dos',
    tareas: [], cobros: [], comisiones: [], fechaEntrega: '', presupuestoTotal: '' }
  const protegido = conservarDatosDesactivados(parcial, original, apagados)
  const fila = proyectoParaBD(protegido, 'ana')
  const anterior = proyectoParaBD(original, 'ana')
  for (const campo of ['cliente', 'telefono', 'email', 'fecha_entrega', 'presupuesto_total',
    'presupuesto_gastado', 'honorarios_diseno', 'honorarios_gestion', 'otros_importes',
    'horas_estimadas', 'horas_reales', 'imagen_proyecto', 'presupuesto_pdf',
    'tareas', 'proveedores', 'cobros', 'comisiones']) {
    assert.deepEqual(fila[campo], anterior[campo], `Debe conservar ${campo}`)
  }
  assert.equal(fila.nombre, 'Reforma actualizada')
  assert.equal(fila.direccion, 'Calle Dos')
  assert.equal(fila.user_id, 'ana')
  assert.deepEqual(original, antes)
  assert.deepEqual(parcial.tareas, [])
})

test('los módulos activos pueden editarse y reactivarse conservando los datos anteriores', () => {
  const nuevos = { ...original, tareas: [], presupuestoTotal: 2500 }
  const guardados = conservarDatosDesactivados(nuevos, original, { tareas: false })
  assert.deepEqual(guardados.tareas, original.tareas)
  assert.equal(guardados.presupuestoTotal, 2500)
  const reactivados = conservarDatosDesactivados({ ...guardados, tareas: [] }, guardados, { tareas: true })
  assert.deepEqual(reactivados.tareas, [])
  assert.deepEqual(conservarDatosDesactivados(nuevos, null, { tareas: false }), nuevos)
})

test('editar comisiones con documentos apagado conserva sus PDF por identificador', () => {
  const editado = { ...original, comisiones: [
    { id: 'nueva', presupuesto: 500, porcentaje: 20 },
    { id: 'c1', presupuesto: 300, porcentaje: 15, presupuestoPdf: '', presupuestoPdfPath: '' },
  ] }
  const resultado = conservarDatosDesactivados(editado, original, { documentos: false })
  assert.deepEqual(resultado.comisiones, [
    { id: 'nueva', presupuesto: 500, porcentaje: 20, presupuestoPdf: '', presupuestoPdfPath: '' },
    { ...original.comisiones[0], presupuesto: 300, porcentaje: 15 },
  ])
  assert.equal(editado.comisiones[1].presupuestoPdfPath, '')
})

function sesionSimulada(id = 'ana') {
  return { auth: {
    getSession: async () => ({ data: { session: { user: { id }, access_token: `token-${id}` } } }),
    getUser: async token => ({ data: { user: { id: token.replace('token-', '') } } }),
  } }
}

test('guarda la configuración normalizada en la cuenta y devuelve el perfil actualizado', async () => {
  const peticiones = []
  const usuario = { id: 'ana', user_metadata: { nombre: 'Ana', [CLAVE_MODULOS]: normalizarModulos({ economia: false }) } }
  const resultado = await guardarModulosDeUsuario('ana', { economia: false, desconocido: true }, {
    cliente: sesionSimulada(),
    solicitar: async (url, opciones) => {
      peticiones.push({ url, opciones })
      return { ok: true, json: async () => usuario }
    },
  })
  assert.equal(resultado, usuario)
  assert.equal(peticiones.length, 1)
  const { url, opciones } = peticiones[0]
  assert.ok(url.endsWith('/auth/v1/user'))
  assert.equal(opciones.method, 'PUT')
  assert.equal(opciones.headers.Authorization, 'Bearer token-ana')
  assert.deepEqual(JSON.parse(opciones.body), { data: { [CLAVE_MODULOS]: normalizarModulos({ economia: false }) } })
  assert.ok(opciones.signal instanceof AbortSignal)
})

test('una sesión ausente o de otra cuenta no puede guardar las preferencias solicitadas', async () => {
  const solicitar = async () => assert.fail('No debe escribir con una sesión distinta')
  for (const [usuarioId, cliente] of [
    ['', sesionSimulada()], ['ana', sesionSimulada('luis')],
    ['ana', { auth: { getSession: async () => ({ data: { session: null } }) } }],
    ['ana', { auth: { ...sesionSimulada().auth, getUser: async () => ({ data: { user: { id: 'luis' } } }) } }],
  ]) {
    await assert.rejects(guardarModulosDeUsuario(usuarioId, {}, { cliente, solicitar }), /sesión/)
  }
})

test('cambiar de cuenta durante la petición mantiene la escritura vinculada al usuario original', async () => {
  let cuentaActual = 'ana'
  let consultasSesion = 0
  const cliente = { auth: {
    getSession: async () => {
      consultasSesion++
      return { data: { session: { user: { id: cuentaActual }, access_token: `token-${cuentaActual}` } } }
    },
    getUser: async token => {
      cuentaActual = 'luis'
      return { data: { user: { id: token.replace('token-', '') } } }
    },
  } }
  const resultado = await guardarModulosDeUsuario('ana', { tareas: false }, {
    cliente,
    solicitar: async (_url, opciones) => {
      assert.equal(cuentaActual, 'luis')
      assert.equal(opciones.headers.Authorization, 'Bearer token-ana')
      return { ok: true, json: async () => ({ id: 'ana' }) }
    },
  })
  assert.equal(resultado.id, 'ana')
  assert.equal(consultasSesion, 1)
})

test('propaga los errores de sesión, red y guardado para permitir reintentar', async () => {
  const error = new Error('Sin conexión')
  for (const metodo of ['getSession', 'getUser']) {
    const cliente = sesionSimulada()
    cliente.auth[metodo] = async () => ({ error })
    await assert.rejects(guardarModulosDeUsuario('ana', {}, {
      cliente, solicitar: async () => assert.fail('No debe continuar tras un error de sesión'),
    }), recibido => recibido === error)
  }
  await assert.rejects(guardarModulosDeUsuario('ana', {}, {
    cliente: sesionSimulada(), solicitar: async () => { throw error },
  }), recibido => recibido === error)
  await assert.rejects(guardarModulosDeUsuario('ana', {}, {
    cliente: sesionSimulada(), solicitar: async () => ({ ok: false }),
  }), /guardar/)
  await assert.rejects(guardarModulosDeUsuario('ana', {}, {
    cliente: sesionSimulada(), solicitar: async () => ({ ok: true, json: async () => ({ id: 'luis' }) }),
  }), /confirmar/)
})
