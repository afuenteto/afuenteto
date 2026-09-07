export const MODULOS_CONFIGURABLES = Object.freeze([
  { id: 'clientes', nombre: 'Clientes', descripcion: 'Fichas y contactos de clientes.' },
  { id: 'tareas', nombre: 'Tareas', descripcion: 'Listas de tareas y prioridades.' },
  { id: 'entregas', nombre: 'Entregas', descripcion: 'Fechas y avisos de entrega.' },
  { id: 'economia', nombre: 'Economía', descripcion: 'Presupuestos, cobros y comisiones.' },
  { id: 'documentos', nombre: 'Documentos', descripcion: 'Imágenes y archivos PDF.' },
  { id: 'proveedores', nombre: 'Proveedores', descripcion: 'Contactos de proveedores.' },
])

export const MODULOS_PREDETERMINADOS = Object.freeze(
  Object.fromEntries(MODULOS_CONFIGURABLES.map(modulo => [modulo.id, true])),
)
export const CLAVE_MODULOS = 'fuente_studio_modules'

export function normalizarModulos(configuracion) {
  const datos = configuracion && typeof configuracion === 'object' && !Array.isArray(configuracion)
    ? configuracion : {}
  return Object.fromEntries(MODULOS_CONFIGURABLES.map(({ id }) => [
    id, Object.hasOwn(datos, id) && typeof datos[id] === 'boolean' ? datos[id] : true,
  ]))
}

export function modulosDeUsuario(usuario) {
  return normalizarModulos(usuario?.user_metadata?.[CLAVE_MODULOS])
}

const CAMPOS_POR_MODULO = {
  clientes: ['cliente', 'telefono', 'email'],
  tareas: ['tareas'],
  entregas: ['fechaEntrega'],
  economia: ['presupuestoTotal', 'presupuestoGastado', 'honorariosDiseno', 'honorariosGestion',
    'otrosImportes', 'cobros', 'comisiones', 'horasEstimadas', 'horasReales'],
  documentos: ['imagenProyecto', 'imagenProyectoPath', 'presupuestoPdf', 'presupuestoPdfPath'],
  proveedores: ['proveedores'],
}

// Un formulario con secciones desactivadas conserva los valores originales,
// incluso si una vista parcial omite esos campos al construir su resultado.
export function conservarDatosDesactivados(datos, original, configuracion) {
  const modulos = normalizarModulos(configuracion)
  const resultado = { ...datos }
  if (!original) return resultado
  for (const [modulo, campos] of Object.entries(CAMPOS_POR_MODULO)) {
    if (modulos[modulo]) continue
    for (const campo of campos) resultado[campo] = original[campo]
  }
  if (!modulos.documentos && modulos.economia && Array.isArray(resultado.comisiones)) {
    resultado.comisiones = resultado.comisiones.map(comision => {
      const anterior = original.comisiones?.find(item => item.id === comision.id)
      return {
        ...comision,
        presupuestoPdf: anterior?.presupuestoPdf || '',
        presupuestoPdfPath: anterior?.presupuestoPdfPath || '',
      }
    })
  }
  return resultado
}
