import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { createServer as createHttpServer } from 'node:http'
import { proyectoDesdeBD } from '../src/projectModel.js'
import { fechaLocal } from '../src/projectUtils.js'
import { MODULOS_CONFIGURABLES, MODULOS_PREDETERMINADOS } from '../src/modules/preferences/model.js'

const desactivados = Object.fromEntries(MODULOS_CONFIGURABLES.map(({ id }) => [id, false]))

test('los módulos controlan los formularios y tarjetas sin quitar el proyecto base', async (context) => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: { server: createHttpServer() } }, appType: 'custom',
  })
  try {
    const { setLanguage } = await server.ssrLoadModule('/src/i18n.js')
    setLanguage('es', false)
    const componentes = {}
    for (const nombre of ['ProjectModal', 'ProjectCard', 'ClientModal']) {
      componentes[nombre] = (await server.ssrLoadModule(`/src/components/${nombre}.jsx`)).default
    }
    componentes.ModulesSettings = (await server.ssrLoadModule('/src/modules/preferences/ModulesSettings.jsx')).default

    const proximaEntrega = new Date()
    proximaEntrega.setDate(proximaEntrega.getDate() + 4)
    const proyecto = proyectoDesdeBD({
      id: 'proyecto-modulos', nombre: 'Reforma modular', cliente: 'Cliente de prueba',
      telefono: '600123456', email: 'cliente@example.test', direccion: 'Calle Proyecto 10',
      fecha_inicio: '2026-01-10', fecha_entrega: fechaLocal(proximaEntrega),
      fase: 'Diseño', tipo_proyecto: 'Vivienda unifamiliar',
      presupuesto_total: 1000, honorarios_diseno: 800, honorarios_gestion: 200,
      imagen_proyecto: 'https://assets.example.test/portada.webp',
      presupuesto_pdf: 'https://assets.example.test/proyecto.pdf',
      tareas: [{ id: 'tarea-1', texto: 'Tarea del módulo', hecha: false }],
      proveedores: [{ id: 'proveedor-1', nombre: 'Proveedor de prueba', contacto: '600987654' }],
      cobros: [{ id: 'cobro-1', concepto: 'Anticipo', importe: 200, estado: 'cobrado' }],
      comisiones: [{
        id: 'comision-1', colaborador: 'Colaborador de prueba', presupuesto: 200, porcentaje: 10,
        estado: 'pendiente', presupuestoPdf: 'https://assets.example.test/comision.pdf',
      }],
    })
    const cliente = { id: 'cliente-1', nombre: proyecto.cliente, telefono: proyecto.telefono, email: proyecto.email }
    const render = (nombre, modulos, extras = {}) => renderToString(React.createElement(componentes[nombre], {
      proyecto, proyectos: [proyecto], cliente, clientes: [cliente], usuario: { id: 'usuario-prueba' },
      modulos, onOpenClient() {}, ...extras,
    }))

    await context.test('ProjectModal conserva campos base y elimina controles de los módulos desactivados', () => {
      const camposModulares = [
        'id="cliente"', 'id="telefono"', 'id="email"', 'id="fechaEntrega"',
        'id="presupuestoTotal"', 'id="presupuestoGastado"', 'Honorarios diseño (€)',
        'Horas estimadas', 'Economía del proyecto', 'Resumen económico',
        'Comisiones de colaboradores', 'Eliminar comisión', 'Eliminar cobro',
        'Añadir tarea y pulsar Enter', 'Eliminar tarea', 'Añadir proveedor y pulsar Enter',
        'Eliminar proveedor', 'Ver ficha cliente', 'Importar contacto',
        'Imagen de la ficha', 'type="file"', proyecto.presupuestoPdf,
      ]
      const apagado = render('ProjectModal', desactivados)
      const activo = render('ProjectModal', MODULOS_PREDETERMINADOS)
      for (const campo of camposModulares) {
        assert.ok(activo.includes(campo), `ProjectModal activo debe incluir ${campo}`)
        assert.ok(!apagado.includes(campo), `ProjectModal desactivado debe omitir ${campo}`)
      }
      for (const campo of [
        'id="nombre"', 'value="Reforma modular"', 'id="direccion"', 'value="Calle Proyecto 10"',
        'id="fechaInicio"', 'Tipo de proyecto', 'value="Vivienda unifamiliar" selected=""',
        'id="fase"', 'value="Diseño" selected=""', 'type="submit"', '>Guardar</button>',
      ]) {
        assert.ok(apagado.includes(campo), `El proyecto base debe conservar ${campo}`)
      }
      assert.ok(!apagado.includes(proyecto.cliente), 'El cliente guardado no debe mostrarse con clientes desactivado')
      assert.ok(!apagado.includes('Tarea del módulo'), 'Las tareas guardadas no deben mostrarse con tareas desactivado')
      assert.ok(!apagado.includes('Proveedor de prueba'), 'Los proveedores guardados no deben mostrarse con proveedores desactivado')
    })

    await context.test('el PDF general necesita documentos y el PDF de comisión necesita documentos y economía', () => {
      for (const economia of [false, true]) {
        for (const documentos of [false, true]) {
          const html = render('ProjectModal', { ...desactivados, economia, documentos })
          const contexto = `economía=${economia}, documentos=${documentos}`
          assert.equal(html.includes(`href="${proyecto.presupuestoPdf}"`), documentos, `PDF general: ${contexto}`)
          assert.equal(html.includes('id="pdfPresupuesto"'), documentos, `Subida PDF general: ${contexto}`)
          assert.equal(html.includes(`href="${proyecto.comisiones[0].presupuestoPdf}"`), economia && documentos, `PDF comisión: ${contexto}`)
          assert.equal(html.includes('Cambiar PDF'), economia && documentos, `Subida PDF comisión: ${contexto}`)
          assert.equal(html.includes('Comisiones de colaboradores'), economia, `Economía independiente del PDF: ${contexto}`)
          assert.equal(html.includes(`src="${proyecto.imagenProyecto}"`), documentos, `Imagen de proyecto: ${contexto}`)
        }
      }
    })

    await context.test('ProjectCard muestra cada módulo de forma independiente y mantiene nombre y fases', () => {
      const indicadores = {
        clientes: [proyecto.cliente, 'card-client'],
        tareas: ['tasks-open-btn', 'Tareas pendientes'],
        entregas: ['tag-urgent', 'aria-label="Entrega:'],
        economia: ['budget-bar', 'Total proyecto:', 'Comisiones'],
        documentos: [`src="${proyecto.imagenProyecto}"`, 'has-project-image'],
      }
      const combinaciones = [desactivados, MODULOS_PREDETERMINADOS,
        ...Object.keys(indicadores).map(id => ({ ...desactivados, [id]: true }))]
      for (const modulos of combinaciones) {
        const html = render('ProjectCard', modulos)
        for (const [id, textos] of Object.entries(indicadores)) {
          for (const texto of textos) {
            assert.equal(html.includes(texto), modulos[id], `ProjectCard: ${id}=${modulos[id]} controla ${texto}`)
          }
        }
        for (const texto of [proyecto.nombre, 'project-open-btn', 'phase-rail', 'Diseño', 'Inicio:']) {
          assert.ok(html.includes(texto), `ProjectCard debe conservar ${texto} con ${JSON.stringify(modulos)}`)
        }
      }
      const vencido = { ...proyecto, fechaEntrega: '2000-01-01' }
      assert.ok(render('ProjectCard', MODULOS_PREDETERMINADOS, { proyecto: vencido }).includes('Entrega vencida'), 'Entrega activa muestra el vencimiento')
      assert.ok(!render('ProjectCard', { ...MODULOS_PREDETERMINADOS, entregas: false }, { proyecto: vencido }).includes('Entrega vencida'), 'Entrega desactivada omite también el vencimiento')
    })

    await context.test('ClientModal permite consultar al cliente y sus proyectos sin mostrar economía', () => {
      const activo = render('ClientModal', MODULOS_PREDETERMINADOS)
      const apagado = render('ClientModal', { ...MODULOS_PREDETERMINADOS, economia: false })
      for (const texto of ['Resumen económico', 'Contratado', 'Cobrado', 'Pendiente', '€']) {
        assert.ok(activo.includes(texto), `ClientModal activo debe incluir ${texto}`)
        assert.ok(!apagado.includes(texto), `ClientModal sin economía debe omitir ${texto}`)
      }
      for (const texto of [cliente.nombre, cliente.telefono, cliente.email, 'Proyectos del cliente', proyecto.nombre]) {
        assert.ok(apagado.includes(texto), `ClientModal debe conservar ${texto}`)
      }
    })

    await context.test('ModulesSettings presenta seis switches y Proyectos siempre activo', () => {
      for (const modulos of [desactivados, MODULOS_PREDETERMINADOS, { ...desactivados, tareas: true }]) {
        const html = render('ModulesSettings', modulos)
        const switches = html.match(/<input\b[^>]*role="switch"[^>]*>/g) || []
        assert.equal(switches.length, 6, 'Deben existir seis módulos configurables')
        for (const { id, nombre } of MODULOS_CONFIGURABLES) {
          const control = switches.find(input => input.includes(`-${id}"`))
          assert.ok(control, `Debe existir el switch de ${id}`)
          assert.equal(control.includes('checked=""'), modulos[id], `El switch de ${id} debe reflejar su preferencia`)
          assert.ok(html.includes(`<strong>${nombre}</strong>`), `El switch de ${id} debe tener nombre visible`)
        }
        assert.ok(html.includes('<span>Proyectos</span><span>Siempre activo</span>'), 'Proyectos debe indicarse como siempre activo')
        assert.ok(!switches.some(input => input.includes('-proyectos"')), 'Proyectos no debe poder desactivarse')
        assert.ok(html.includes('Guardar configuración'), 'Debe existir la acción para guardar los módulos')
      }
    })
  } finally {
    await server.close()
  }
})
