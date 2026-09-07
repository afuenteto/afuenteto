import { t as translateUI, getLocale } from '../i18n.js'
import { useEffect, useState, useRef } from 'react'
import { fechaLocal } from '../projectUtils.js'
import { FASES, uid, formatearFecha } from '../storage.js'
import { supabase } from '../supabase.js'
import { urlFirmada } from '../storageFiles.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'
import ProjectHistory from './ProjectHistory.jsx'
import ProjectImageCropper from './ProjectImageCropper.jsx'

export default function ProjectModal({
  proyecto,
  clientes = [],
  usuario,
  setClientes,
  onOpenClient,
  onSave,
  guardando = false,
  onDelete,
  onFinalize,
  onReopen,
  onClose,
  seccionInicial = null,
  modulos = MODULOS_PREDETERMINADOS
}) {
 const modulosActivos = { ...MODULOS_PREDETERMINADOS, ...modulos }
 const [datos, setDatos] = useState({
  ...proyecto,
  fechaInicio: proyecto.fechaInicio || '',
  fechaEntrega: proyecto.fechaEntrega || '',
  cobros: proyecto.cobros || [],
  comisiones: proyecto.comisiones || [],
  imagenProyecto: proyecto.imagenProyecto || ''
})
useEffect(() => {

  setDatos({
  ...proyecto,
  fechaInicio: proyecto.fechaInicio || '',
  fechaEntrega: proyecto.fechaEntrega || '',
  cobros: proyecto.cobros || [],
  comisiones: proyecto.comisiones || [],
  imagenProyecto: proyecto.imagenProyecto || ''
})

}, [proyecto])
const [nuevaTarea, setNuevaTarea] = useState('')
const [nuevoProveedor, setNuevoProveedor] = useState('')
const [busquedaCliente, setBusquedaCliente] = useState('')
const [mostrarClientes, setMostrarClientes] = useState(false)
const clientesRef = useRef(null)
const [nuevoCobro, setNuevoCobro] = useState({
  fecha: '',
  concepto: '',
  importe: '',
  estado: 'cobrado'
})
const [nuevaComision, setNuevaComision] = useState({
  fecha: '',
  colaborador: '',
  concepto: '',
  presupuesto: '',
  porcentaje: '',
  estado: 'pendiente'
})
const [subiendoPdf, setSubiendoPdf] = useState(false)
const [subiendoComisionId, setSubiendoComisionId] = useState(null)
const imagenInputRef = useRef(null)
const [editorImagenSrc, setEditorImagenSrc] = useState('')
const [imagenPendiente, setImagenPendiente] = useState(null)
const [imagenPendientePreview, setImagenPendientePreview] = useState('')
const [subiendoImagen, setSubiendoImagen] = useState(false)

useEffect(() => () => {
  if (editorImagenSrc?.startsWith('blob:')) URL.revokeObjectURL(editorImagenSrc)
}, [editorImagenSrc])
useEffect(() => () => {
  if (imagenPendientePreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPendientePreview)
}, [imagenPendientePreview])

const totalProyecto =
  Number(datos.honorariosDiseno || 0) +
  Number(datos.honorariosGestion || 0) +
  Number(datos.otrosImportes || 0)

const totalCobrado =
  (datos.cobros || [])
    .filter((cobro) => cobro.estado !== 'previsto')
    .reduce(
      (total, cobro) =>
        total + Number(cobro.importe || 0),
      0
    )

const totalPrevisto =
  (datos.cobros || [])
    .filter((cobro) => cobro.estado === 'previsto')
    .reduce(
      (total, cobro) =>
        total + Number(cobro.importe || 0),
      0
    )

const pendienteCobro = totalProyecto - totalCobrado

const comisiones = Array.isArray(datos.comisiones) ? datos.comisiones : []

const calcularImporteComision = (comision) =>
  Number(comision.presupuesto || 0) * Number(comision.porcentaje || 0) / 100

const totalPresupuestosColaboradores = comisiones.reduce(
  (total, comision) => total + Number(comision.presupuesto || 0),
  0
)

const totalComisiones = comisiones.reduce(
  (total, comision) => total + calcularImporteComision(comision),
  0
)

const totalComisionesCobradas = comisiones
  .filter((comision) => comision.estado === 'cobrada')
  .reduce((total, comision) => total + calcularImporteComision(comision), 0)

const totalComisionesPendientes = totalComisiones - totalComisionesCobradas

 const contactoInputRef = useRef(null)
 const tareasRef = useRef(null)
 const economiaRef = useRef(null)

useEffect(() => {

  if (!seccionInicial) return


  const timer = setTimeout(() => {

    if (seccionInicial === 'tareas') {

      tareasRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

    }


    if (seccionInicial === 'economia') {

      economiaRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

    }


  }, 120)


  return () => clearTimeout(timer)

}, [seccionInicial])  
 useEffect(() => {

  function cerrarClientes(e) {

    if (
      clientesRef.current &&
      !clientesRef.current.contains(e.target)
    ) {
      setMostrarClientes(false)
    }

  }


  document.addEventListener(
    'mousedown',
    cerrarClientes
  )


  return () => {
    document.removeEventListener(
      'mousedown',
      cerrarClientes
    )
  }

}, [])
 function importarContacto(e) {
    if (!modulosActivos.clientes) return
    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      const texto = reader.result

      const nombre =
        texto.match(/FN:(.*)/)?.[1] || ''

      const telefono =
        texto.match(/TEL[^:]*:(.*)/)?.[1] || ''

      const email =
        texto.match(/EMAIL[^:]*:(.*)/)?.[1] || ''

      const direccion =
        texto.match(/ADR[^:]*:(.*)/)?.[1]
          ?.replace(/;/g, ' ')
          || ''

      setDatos((d) => ({
        ...d,
        cliente: nombre,
        telefono,
        email,
        direccion,
      }))
    }

    reader.readAsText(file)

    e.target.value = ''
  }

 function abrirMaps() {

  if (!datos.direccion) return

  const direccion = encodeURIComponent(datos.direccion)

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${direccion}`,
    '_blank'
  )
}
 function seleccionarImagenProyecto(e) {
  if (!modulosActivos.documentos) return
  const file = e.target.files?.[0]
  e.target.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert(translateUI("Selecciona un archivo de imagen."))
    return
  }

  if (file.size > 25 * 1024 * 1024) {
    alert(translateUI("La imagen original es demasiado grande. Elige una de menos de 25 MB."))
    return
  }

  const src = URL.createObjectURL(file)
  setEditorImagenSrc(src)
}

 function confirmarImagenRecortada(blob) {
  const preview = URL.createObjectURL(blob)
  setImagenPendiente(blob)
  setImagenPendientePreview(preview)
  setEditorImagenSrc('')
}

 function quitarImagenProyecto() {
  setImagenPendiente(null)
  setImagenPendientePreview('')
  setDatos((actual) => ({
    ...actual,
    imagenProyecto: ''
  }))
}

 async function subirImagenProyecto(blob) {
  if (!blob) return datos.imagenProyecto || ''

  const nombreArchivo = `${usuario.id}/${datos.id}/${Date.now()}.webp`

  const { error } = await supabase.storage
    .from('imagenes-proyectos')
    .upload(nombreArchivo, blob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false
    })

  if (error) throw error

  return {
    path: nombreArchivo,
    url: await urlFirmada('imagenes-proyectos', nombreArchivo)
  }
}

 async function subirPresupuesto(e) {
  if (!modulosActivos.documentos) return
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file || subiendoPdf) return
  if (file.type !== 'application/pdf') { alert(translateUI("Selecciona un archivo PDF")); return }
  setSubiendoPdf(true)
  try {
    const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const nombreArchivo = `${usuario.id}/${datos.id}/${Date.now()}-${nombreSeguro}`
    const { error } = await supabase.storage
      .from('presupuestos')
      .upload(nombreArchivo, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    if (error) throw error
    const url = await urlFirmada('presupuestos', nombreArchivo)
    setDatos(d => ({ ...d, presupuestoPdf: url, presupuestoPdfPath: nombreArchivo }))
  } catch (error) {
    console.error('ERROR SUPABASE PDF PROYECTO:', error)
    alert(translateUI("No se pudo subir el PDF.\n\n{0}", { 0: error.message || error }))
  }
  finally { setSubiendoPdf(false) }
}

  function set(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }))
  }

  function agregarTarea() {
    const texto = nuevaTarea.trim()
    if (!texto) return
    set('tareas', [...datos.tareas, { id: uid(), texto, hecha: false }])
    setNuevaTarea('')
  }

  function alternarTarea(id) {
    set(
      'tareas',
      datos.tareas.map((t) => (t.id === id ? { ...t, hecha: !t.hecha, fechaCompletada: !t.hecha ? fechaLocal() : '' } : t))
    )
  }

  function borrarTarea(id) {
    set('tareas', datos.tareas.filter((t) => t.id !== id))
  }
function borrarHistorial(id) {

  setDatos({
    ...datos,
    historial: (datos.historial || []).filter(
      (evento) => evento.id !== id
    )
  })

}
  function agregarProveedor() {
    const nombre = nuevoProveedor.trim()
    if (!nombre) return
    set('proveedores', [...datos.proveedores, { id: uid(), nombre, contacto: '' }])
    setNuevoProveedor('')
  }
 function marcarCobrado(id) {

  const cobro = datos.cobros.find(
    (c) => c.id === id
  )

  if (!cobro) return


  setDatos({
    ...datos,

    cobros: datos.cobros.map((c) =>
      c.id === id
        ? {
            ...c,
            estado: 'cobrado'
          }
        : c
    ),

    historial: [
      ...(datos.historial || []),
      {
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        texto: `Cobro recibido: ${cobro.concepto} (${cobro.importe} €)`,
        icono: '💰'
      }
    ]

  })

}
function agregarCobro() {
  if (!nuevoCobro.fecha || !nuevoCobro.importe) return

  const cobro = {
    id: uid(),
    fecha: nuevoCobro.fecha,
    concepto: nuevoCobro.concepto || 'Cobro',
    importe: Number(nuevoCobro.importe),
    estado: nuevoCobro.estado || 'cobrado'
  }

 setDatos({
  ...datos,
  cobros: [
    ...(datos.cobros || []),
    cobro
  ],
  historial: [
    ...(datos.historial || []),
    {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      texto: `Cobro añadido: ${cobro.concepto} (${cobro.importe} €)`,
      icono: '💰'
    }
  ]
})

  setNuevoCobro({
    fecha: '',
    concepto: '',
    importe: '',
    estado: 'cobrado'
  })
}

function agregarComision() {
  const colaborador = nuevaComision.colaborador.trim()
  const presupuesto = Number(nuevaComision.presupuesto || 0)
  const porcentaje = Number(nuevaComision.porcentaje || 0)

  if (!colaborador || presupuesto <= 0 || porcentaje <= 0) {
    alert(translateUI("Indica colaborador, presupuesto aceptado y porcentaje de comisión."))
    return
  }

  const comision = {
    id: uid(),
    fecha: nuevaComision.fecha || '',
    colaborador,
    concepto: nuevaComision.concepto.trim() || 'Comisión',
    presupuesto,
    porcentaje,
    estado: nuevaComision.estado || 'pendiente',
    fechaCobro:
      nuevaComision.estado === 'cobrada'
        ? new Date().toISOString().slice(0, 10)
        : '',
    presupuestoPdf: '',
    presupuestoPdfNombre: ''
  }

  const importe = calcularImporteComision(comision)

  setDatos({
    ...datos,
    comisiones: [...comisiones, comision],
    historial: [
      ...(datos.historial || []),
      {
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        texto: `Comisión añadida: ${colaborador} · ${porcentaje}% (${importe.toLocaleString(getLocale())} €)`,
        icono: '🤝'
      }
    ]
  })

  setNuevaComision({
    fecha: '',
    colaborador: '',
    concepto: '',
    presupuesto: '',
    porcentaje: '',
    estado: 'pendiente'
  })
}

function actualizarComision(id, campo, valor) {
  setDatos((actual) => ({
    ...actual,
    comisiones: (actual.comisiones || []).map((comision) =>
      comision.id === id
        ? { ...comision, [campo]: valor }
        : comision
    )
  }))
}

function marcarComisionCobrada(id) {
  const comision = comisiones.find((item) => item.id === id)
  if (!comision) return

  const importe = calcularImporteComision(comision)

  setDatos((actual) => ({
    ...actual,
    comisiones: (actual.comisiones || []).map((item) =>
      item.id === id
        ? {
            ...item,
            estado: 'cobrada',
            fechaCobro: new Date().toISOString().slice(0, 10)
          }
        : item
    ),
    historial: [
      ...(actual.historial || []),
      {
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        texto: `Comisión cobrada: ${comision.colaborador} (${importe.toLocaleString(getLocale())} €)`,
        icono: '✅'
      }
    ]
  }))
}

function marcarComisionPendiente(id) {
  setDatos((actual) => ({
    ...actual,
    comisiones: (actual.comisiones || []).map((item) =>
      item.id === id
        ? { ...item, estado: 'pendiente', fechaCobro: '' }
        : item
    )
  }))
}

function borrarComision(id) {
  setDatos((actual) => ({
    ...actual,
    comisiones: (actual.comisiones || []).filter((item) => item.id !== id)
  }))
}

async function subirPresupuestoComision(id, file) {
  if (!modulosActivos.economia || !modulosActivos.documentos || !file) return

  if (file.type !== 'application/pdf') {
    alert(translateUI("Selecciona un archivo PDF"))
    return
  }

  setSubiendoComisionId(id)

  try {
    const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const nombreArchivo = `${usuario.id}/${datos.id}/comision-${id}-${Date.now()}-${nombreSeguro}`

    const { error } = await supabase.storage
      .from('presupuestos')
      .upload(nombreArchivo, file)

    if (error) throw error

    const url = await urlFirmada('presupuestos', nombreArchivo)

    setDatos((actual) => ({
      ...actual,
      comisiones: (actual.comisiones || []).map((item) =>
        item.id === id
          ? {
              ...item,
              presupuestoPdf: url,
              presupuestoPdfPath: nombreArchivo,
              presupuestoPdfNombre: file.name
            }
          : item
      ),
      historial: [
        ...(actual.historial || []),
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          texto: `Presupuesto de colaborador adjuntado: ${file.name}`,
          icono: '📎'
        }
      ]
    }))
  } catch (error) {
    console.error('ERROR SUPABASE PDF COMISIÓN:', error)
    alert(translateUI("No se pudo subir el PDF.\n\n{0}", { 0: error.message || error }))
  } finally {
    setSubiendoComisionId(null)
  }
}

  function actualizarProveedorContacto(id, contacto) {
    set(
      'proveedores',
      datos.proveedores.map((p) => (p.id === id ? { ...p, contacto } : p))
    )
  }

  function borrarProveedor(id) {
    set('proveedores', datos.proveedores.filter((p) => p.id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!datos.nombre.trim() || subiendoImagen || guardando || subiendoComisionId || subiendoPdf) return

    setSubiendoImagen(true)

    try {
      let datosAGuardar = { ...datos }

      if (modulosActivos.documentos && imagenPendiente) {
        const imagenSubida = await subirImagenProyecto(imagenPendiente)

        datosAGuardar = {
          ...datosAGuardar,
          imagenProyecto: imagenSubida.url,
          imagenProyectoPath: imagenSubida.path,
          historial: [
            ...(datosAGuardar.historial || []),
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString(),
              texto: 'Imagen de proyecto actualizada',
              icono: '🖼️'
            }
          ]
        }
      }

      await onSave(datosAGuardar)
    } catch (error) {
      console.error('ERROR SUPABASE IMAGEN PROYECTO:', error)
      alert(translateUI("No se pudo guardar la imagen del proyecto.\n\n{0}", { 0: error.message || error }))
    } finally {
      setSubiendoImagen(false)
    }
  }

  const esNuevo = !proyecto.nombre && proyecto.tareas.length === 0 && proyecto.proveedores.length === 0
const existeCliente = clientes.some(
  (c) =>
    c.nombre.toLowerCase().trim() ===
    busquedaCliente.toLowerCase().trim()
)
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !guardando && !subiendoImagen && !subiendoComisionId && !subiendoPdf && onClose()}>
      <form
        className={"modal" + (datos.estado === 'finalizado' ? " project-finalized-modal" : "")}
        onSubmit={handleSubmit}
      >
        <fieldset className="modal-fields" disabled={guardando || subiendoImagen || Boolean(subiendoComisionId) || subiendoPdf}>
        {datos.estado === 'finalizado' && (
          <div className="finalized-watermark finalized-watermark-modal">{translateUI("FINALIZADO")}</div>
        )}
        <div className="modal-head">
         <p style={{color:"red", fontSize:"20px"}}>
  </p>
        <h2 className="serif">
  {esNuevo ? translateUI("Nuevo proyecto") : datos.nombre || translateUI("Editar proyecto")}
</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={translateUI("Cerrar")}>
            ✕
          </button>
        </div>

        <div className="field">
          <label htmlFor="nombre">{translateUI("Nombre del proyecto")}</label>
          <input
            id="nombre"
            type="text"
            value={datos.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder={translateUI("p. ej. Reforma ático Sardinero")}
            autoFocus
            required
          />
        </div>

        {modulosActivos.documentos && (
        <div className="project-image-field">
          <div className="project-image-field-head">
            <div>
              <strong>{translateUI("Imagen de la ficha")}</strong>
              <span>{translateUI("Una imagen por proyecto · se optimiza automáticamente")}</span>
            </div>

            <div className="project-image-buttons">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => imagenInputRef.current?.click()}
              >
                {imagenPendientePreview || datos.imagenProyecto ? translateUI("Cambiar imagen") : translateUI("Subir imagen")}
              </button>

              {(imagenPendientePreview || datos.imagenProyecto) && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={quitarImagenProyecto}
                >{translateUI("Quitar")}</button>
              )}
            </div>
          </div>

          {(imagenPendientePreview || datos.imagenProyecto) ? (
            <div className="project-image-modal-preview">
              <img
                src={imagenPendientePreview || datos.imagenProyecto}
                alt={translateUI("Imagen de cabecera del proyecto")}
              />
            </div>
          ) : (
            <button
              type="button"
              className="project-image-empty"
              onClick={() => imagenInputRef.current?.click()}
            >{translateUI("+ Añadir imagen de cabecera")}</button>
          )}

          <input
            ref={imagenInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={seleccionarImagenProyecto}
          />
        </div>
        )}

        {modulosActivos.clientes && (
        <div className="field-row">
          <div className="field">
         <label htmlFor="cliente">{translateUI("Cliente / contacto")}</label>

<div ref={clientesRef}>

  <input
    type="text"
    placeholder={translateUI("🔍 Buscar cliente...")}
    value={busquedaCliente}
    onFocus={() => {
      setBusquedaCliente('')
      setMostrarClientes(true)
    }}
    onChange={(e)=>{
      setBusquedaCliente(e.target.value)
      setMostrarClientes(true)
    }}
  />


  {mostrarClientes && (

    <div className="client-results">

      {clientes
        .filter((cliente) =>
          cliente.nombre
            .toLowerCase()
            .includes(
              busquedaCliente.toLowerCase()
            )
        )
        .map((cliente) => (

          <button
            type="button"
            key={cliente.id}
            className="client-result-item"
            onClick={() => {

              setDatos({
                ...datos,
                cliente: cliente.nombre,
                telefono: cliente.telefono || '',
                email: cliente.email || '',
                direccion: cliente.direccion || ''
              })

              setBusquedaCliente('')
              setMostrarClientes(false)

            }}
          >
            {cliente.nombre}
          </button>

        ))}


      {busquedaCliente &&
       !clientes.some(
        c =>
          c.nombre.toLowerCase().trim() ===
          busquedaCliente.toLowerCase().trim()
       ) && (

        <button
          type="button"
          className="client-result-item"
          onClick={async () => {
if (!modulosActivos.clientes) return
const nombreLimpio = busquedaCliente
  .trim()
  .replace(/\s+/g, ' ')


if (!nombreLimpio) return

const clienteExiste = clientes.find(
  (c) =>
    c.nombre.toLowerCase().trim() ===
    nombreLimpio.toLowerCase()
)


if (clienteExiste) {

  setDatos({
    ...datos,
    cliente: clienteExiste.nombre,
    telefono: clienteExiste.telefono || '',
    email: clienteExiste.email || '',
    direccion: clienteExiste.direccion || ''
  })

  setBusquedaCliente('')
  setMostrarClientes(false)

  return
}


  const { data, error } =
    await supabase
      .from('clientes')
      .insert({
        user_id: usuario.id,
        nombre: nombreLimpio,
        telefono: datos.telefono || '',
        email: datos.email || '',
        direccion: datos.direccion || ''
      })
      .select()
      .single()

  if (error) {
    console.error(error)
    alert(error.message)
    return
  }

  setClientes((prev) => [
    ...prev,
    data
  ])

  setDatos({
    ...datos,
    cliente: data.nombre,
    telefono: data.telefono || '',
    email: data.email || '',
    direccion: data.direccion || ''
  })

  setBusquedaCliente('')
  setMostrarClientes(false)

          }}
        >{translateUI("➕ Crear cliente \"")}{busquedaCliente}"
        </button>

      )}


    </div>

  )}

</div>
 
<input
 id="cliente"
 type="text"
 value={datos.cliente}
 onChange={(e) =>
   set('cliente', e.target.value)
 }
/>
            {datos.cliente && onOpenClient && (

  <button
    type="button"
    className="btn"
   onClick={() => {

  const cliente =
    clientes.find(
      (c) =>
        c.nombre.trim().toLowerCase() ===
        datos.cliente.trim().toLowerCase()
    )

  if (cliente) {
    onOpenClient(cliente)
  } else {
    alert(translateUI("No se encontró el cliente"))
  }

}}
  >{translateUI("👤 Ver ficha cliente")}</button>

)}
             <button
  type="button"
  className="btn"
  onClick={() => contactoInputRef.current?.click()}
>{translateUI("👤 Importar contacto")}</button>
          </div>
          <div className="field">
            <label htmlFor="telefono">{translateUI("Teléfono")}</label>
            <input id="telefono" type="text" value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </div>
        </div>
        )}

        <div className="field-row">
          {modulosActivos.clientes && (
          <div className="field">
            <label htmlFor="email">{translateUI("Email")}</label>
            <input id="email" type="email" value={datos.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          )}
          <div className="field">
            <label htmlFor="direccion">{translateUI("Dirección / ubicación")}</label>
            <input id="direccion" type="text" value={datos.direccion} onChange={(e) => set('direccion', e.target.value)} />
           <button
  type="button"
  className="btn"
  onClick={abrirMaps}
  disabled={!datos.direccion}
>{translateUI("📍 Abrir en Maps")}</button>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="fechaInicio">{translateUI("Fecha de inicio")}</label>
            <input
  id="fechaInicio"
  type="date"
  value={datos.fechaInicio || ''}
  onChange={(e) => set('fechaInicio', e.target.value)}
/>
          </div>
          {modulosActivos.entregas && (
          <div className="field">
  <label htmlFor="fechaEntrega">{translateUI("Fecha de entrega estimada")}</label>

  <input
    id="fechaEntrega"
    type="date"
    value={datos.fechaEntrega || ''}
    onChange={(e) => {

      const nuevaFecha = e.target.value

      if (
        nuevaFecha !== datos.fechaEntrega
      ) {

        setDatos({
          ...datos,
          fechaEntrega: nuevaFecha,
          historial: [
            ...(datos.historial || []),
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString(),
              texto: `Fecha de entrega cambiada a: ${nuevaFecha}`,
              icono: '📅'
            }
          ]
        })

      }

    }}
  />

</div>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="fase">{translateUI("Fase actual")}</label>
          <select
  id="fase"
  value={datos.fase}
  onChange={(e) => {

    const nuevaFase = e.target.value

    if (nuevaFase !== datos.fase) {

      setDatos({
        ...datos,
        fase: nuevaFase,
        historial: [
          ...(datos.historial || []),
          {
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            texto: `Fase cambiada: ${datos.fase} → ${nuevaFase}`,
            icono: '🔄'
          }
        ]
      })

    }

  }}
>
  {FASES.map((f) => (
    <option key={f} value={f}>
      {translateUI(f)}
    </option>
  ))}
</select>
          </div>
          <div />
        </div>
<div className="field">
  <label>{translateUI("Prioridad")}</label>

  <select
    value={datos.prioridad || 'en_curso'}
    onChange={(e) =>
      setDatos({
        ...datos,
        prioridad: e.target.value,
      })
    }
  >
    <option value="urgente">{translateUI("🔴 Urgente")}</option>
    <option value="en_curso">{translateUI("🟡 En curso")}</option>
    <option value="estable">{translateUI("🟢 Estable")}</option>
    <option value="bloqueado">{translateUI("🔵 Bloqueado")}</option>
  </select>
</div>
<div className="field">
  <label htmlFor="importancia">{translateUI("Importancia (1-10)")}</label>
  <input
    id="importancia"
    type="number"
    min="1"
    max="10"
    step="1"
    value={datos.importancia ?? 5}
    onChange={(e) => set('importancia', e.target.value)}
  />
</div>
<div className="field-row">
  <div className="field">
    <label>{translateUI("Tipo de proyecto")}</label>
    <select
      value={datos.tipoProyecto}
      onChange={(e) => set('tipoProyecto', e.target.value)}
    >
      <optgroup label={translateUI("🏠 Residencial")}>
        <option value="Vivienda unifamiliar">{translateUI("Vivienda unifamiliar")}</option>
        <option value="Piso / apartamento">{translateUI("Piso / apartamento")}</option>
        <option value="Reforma parcial">{translateUI("Reforma parcial")}</option>
        <option value="Reforma integral">{translateUI("Reforma integral")}</option>
        <option value="Cocina / baño">{translateUI("Cocina / baño")}</option>
        <option value="Segunda residencia">{translateUI("Segunda residencia")}</option>
      </optgroup>

      <optgroup label={translateUI("🏢 Contract / Hospitality")}>
        <option value="Oficina">{translateUI("Oficina")}</option>
        <option value="Hotel">{translateUI("Hotel")}</option>
        <option value="Restaurante">{translateUI("Restaurante")}</option>
        <option value="Cafetería / bar">{translateUI("Cafetería / bar")}</option>
        <option value="Comercio / retail">{translateUI("Comercio / retail")}</option>
        <option value="Clínica / centro profesional">{translateUI("Clínica / centro profesional")}</option>
        <option value="Local comercial">{translateUI("Local comercial")}</option>
      </optgroup>

      <optgroup label={translateUI("🪑 Diseño y producto")}>
        <option value="Diseño de mobiliario">{translateUI("Diseño de mobiliario")}</option>
        <option value="Diseño de piezas a medida">{translateUI("Diseño de piezas a medida")}</option>
        <option value="Ebanistería">{translateUI("Ebanistería")}</option>
        <option value="Diseño de iluminación">{translateUI("Diseño de iluminación")}</option>
        <option value="Diseño de elementos especiales">{translateUI("Diseño de elementos especiales")}</option>
      </optgroup>

      <optgroup label={translateUI("🏗️ Arquitectura e intervención")}>
        <option value="Obra nueva">{translateUI("Obra nueva")}</option>
        <option value="Rehabilitación">{translateUI("Rehabilitación")}</option>
        <option value="Exterior / terrazas / jardines">{translateUI("Exterior / terrazas / jardines")}</option>
        <option value="Fachada">{translateUI("Fachada")}</option>
      </optgroup>

      <optgroup label={translateUI("🎨 Identidad y marca")}>
        <option value="Branding">{translateUI("Branding")}</option>
        <option value="Diseño gráfico">{translateUI("Diseño gráfico")}</option>
        <option value="Imagen corporativa">{translateUI("Imagen corporativa")}</option>
        <option value="Señalética">{translateUI("Señalética")}</option>
      </optgroup>

      <optgroup label={translateUI("Opciones anteriores")}>
        <option value="Vivienda">{translateUI("Vivienda")}</option>
        <option value="Comercio">{translateUI("Comercio")}</option>
        <option value="Mobiliario">{translateUI("Mobiliario")}</option>
        <option value="Otro">{translateUI("Otro")}</option>
      </optgroup>
    </select>
  </div>
</div>

{modulosActivos.economia && (
<>
<div ref={economiaRef} className="section-label">{translateUI("Economía del proyecto")}</div>
<div className="field-row">
  <div className="field">
    <label htmlFor="presupuestoTotal">{translateUI("Presupuesto total (€)")}</label>
    <input
      id="presupuestoTotal"
      type="number"
      min="0"
      step="0.01"
      value={datos.presupuestoTotal}
      onChange={(e) => set('presupuestoTotal', e.target.value)}
    />
  </div>
  <div className="field">
    <label htmlFor="presupuestoGastado">{translateUI("Gastado hasta ahora (€)")}</label>
    <input
      id="presupuestoGastado"
      type="number"
      min="0"
      step="0.01"
      value={datos.presupuestoGastado}
      onChange={(e) => set('presupuestoGastado', e.target.value)}
    />
  </div>
</div>

<div className="field-row">
  <div className="field">
    <label>{translateUI("Honorarios diseño (€)")}</label>
    <input
      type="number"
      value={datos.honorariosDiseno}
      onChange={(e) => set('honorariosDiseno', e.target.value)}
    />
  </div>

  <div className="field">
    <label>{translateUI("Gestión / seguimiento (€)")}</label>
    <input
      type="number"
      value={datos.honorariosGestion}
      onChange={(e) => set('honorariosGestion', e.target.value)}
    />
  </div>
</div>

<div className="field-row">
  <div className="field">
    <label>{translateUI("Otros servicios (€)")}</label>
    <input
      type="number"
      value={datos.otrosImportes}
      onChange={(e) => set('otrosImportes', e.target.value)}
    />
  </div>

  <div className="field">
    <label>{translateUI("Horas estimadas")}</label>
    <input
      type="number"
      value={datos.horasEstimadas}
      onChange={(e) => set('horasEstimadas', e.target.value)}
    />
  </div>
</div>






         
         
</>
)}
{modulosActivos.documentos && (
<div className="field">
  <label>{translateUI("Presupuesto")}</label>
  <button
    type="button"
    className="btn"
    onClick={() =>
      document.getElementById('pdfPresupuesto').click()
    }
  >
    {subiendoPdf ? translateUI("Subiendo PDF…") : translateUI("📎 Subir presupuesto PDF")}
  </button>

  {subiendoPdf && (
    <small className="mono" style={{ marginTop: '8px' }}>{translateUI("Guardando archivo en el almacenamiento seguro…")}</small>
  )}

  {datos.presupuestoPdf && (
    <a
      href={datos.presupuestoPdf}
      target="_blank"
      rel="noreferrer"
      className="btn"
      style={{ marginTop: '8px' }}
    >{translateUI("📄 Ver presupuesto")}</a>
  )}
</div>
)}
{modulosActivos.economia && (
<>
<div className="section-label">{translateUI("Resumen económico")}</div>

<div className="field-row">

  <div className="field">
    <label>{translateUI("Valor del proyecto")}</label>
    <input
      type="text"
      value={`${totalProyecto.toLocaleString(getLocale())} €`}
      readOnly
    />
  </div>

  <div className="field">
    <label>{translateUI("Total cobrado")}</label>
    <input
      type="text"
      value={`${totalCobrado.toLocaleString(getLocale())} €`}
      readOnly
    />
  </div>

</div>

<div className="field">
  <label>{translateUI("Pendiente de cobro")}</label>
  <input
    type="text"
    value={`${pendienteCobro.toLocaleString(getLocale())} €`}
    readOnly
  />
</div>
{totalPrevisto > 0 && (
  <div className="field">
    <label>{translateUI("Cobros previstos")}</label>
    <input
      type="text"
      value={`${totalPrevisto.toLocaleString(getLocale())} €`}
      readOnly
    />
  </div>
)}

<div className="section-label">{translateUI("Cobros")}</div>
{(datos.cobros || []).map((c) => (
  <div className="list-row" key={c.id}>
    <span>{formatearFecha(c.fecha)}</span>
    <span>{c.concepto}</span>
<strong>
  {Number(c.importe).toLocaleString(getLocale())} €
  {c.estado === 'previsto' ? translateUI(" ⏳ Previsto") : translateUI(" ✓ Cobrado")}
</strong>
   
   {c.estado === 'previsto' && (
  <button
    type="button"
    className="btn btn-sm"
    onClick={() => marcarCobrado(c.id)}
  >{translateUI("✓ Cobrar")}</button>
)}

    <button
      type="button"
      className="icon-btn"
      onClick={() =>
        set(
          'cobros',
          datos.cobros.filter((x) => x.id !== c.id)
        )
      }
      aria-label={translateUI("Eliminar cobro")}
    >
      ✕
    </button>
  </div>
))}

<div className="cobro-form">

<input
  type="date"
  value={nuevoCobro.fecha}
  onChange={(e) =>
    setNuevoCobro({
      ...nuevoCobro,
      fecha: e.target.value
    })
  }
/>

<input
  type="text"
  placeholder={translateUI("Concepto")}
  value={nuevoCobro.concepto}
  onChange={(e) =>
    setNuevoCobro({
      ...nuevoCobro,
      concepto: e.target.value
    })
  }
/>

<input
  type="number"
  placeholder={translateUI("Importe")}
  value={nuevoCobro.importe}
  onChange={(e) =>
    setNuevoCobro({
      ...nuevoCobro,
      importe: e.target.value
    })
  }
/>
<select
  value={nuevoCobro.estado || 'cobrado'}
  onChange={(e) =>
    setNuevoCobro({
      ...nuevoCobro,
      estado: e.target.value
    })
  }
>
  <option value="cobrado">{translateUI("Cobrado")}</option>

  <option value="previsto">{translateUI("Previsto")}</option>
</select>
<button
 type="button"
 className="btn btn-sm"
 onClick={agregarCobro}
>{translateUI("Añadir")}</button>

</div>
        <div className="section-label dashboard-section-heading">{translateUI("Comisiones de colaboradores")}</div>

<div className="commission-summary">
  <div className="field-row">
    <div className="field">
      <label>{translateUI("Presupuestos aceptados")}</label>
      <input
        type="text"
        value={`${totalPresupuestosColaboradores.toLocaleString(getLocale())} €`}
        readOnly
      />
    </div>
    <div className="field">
      <label>{translateUI("Comisiones generadas")}</label>
      <input
        type="text"
        value={`${totalComisiones.toLocaleString(getLocale())} €`}
        readOnly
      />
    </div>
  </div>

  <div className="field-row">
    <div className="field">
      <label>{translateUI("Comisiones cobradas")}</label>
      <input
        type="text"
        value={`${totalComisionesCobradas.toLocaleString(getLocale())} €`}
        readOnly
      />
    </div>
    <div className="field">
      <label>{translateUI("Pendiente de cobrar")}</label>
      <input
        type="text"
        value={`${totalComisionesPendientes.toLocaleString(getLocale())} €`}
        readOnly
      />
    </div>
  </div>
</div>

<div className="commission-new">
  <div className="commission-new-title">{translateUI("+ Añadir nueva comisión")}</div>
  <div className="commission-grid">
    <div className="field">
      <label>{translateUI("Colaborador")}</label>
      <input
        type="text"
        placeholder={translateUI("Nombre del colaborador")}
        value={nuevaComision.colaborador}
        onChange={(e) => setNuevaComision({ ...nuevaComision, colaborador: e.target.value })}
      />
    </div>

    <div className="field">
      <label>{translateUI("Concepto")}</label>
      <input
        type="text"
        placeholder={translateUI("Carpintería, iluminación…")}
        value={nuevaComision.concepto}
        onChange={(e) => setNuevaComision({ ...nuevaComision, concepto: e.target.value })}
      />
    </div>

    <div className="field">
      <label>{translateUI("Presupuesto aceptado (€)")}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="0,00"
        value={nuevaComision.presupuesto}
        onChange={(e) => setNuevaComision({ ...nuevaComision, presupuesto: e.target.value })}
      />
    </div>

    <div className="field">
      <label>{translateUI("Comisión acordada (%)")}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="10"
        value={nuevaComision.porcentaje}
        onChange={(e) => setNuevaComision({ ...nuevaComision, porcentaje: e.target.value })}
      />
    </div>

    <div className="field">
      <label>{translateUI("Fecha presupuesto")}</label>
      <input
        type="date"
        value={nuevaComision.fecha}
        onChange={(e) => setNuevaComision({ ...nuevaComision, fecha: e.target.value })}
      />
    </div>

    <div className="field">
      <label>{translateUI("Estado inicial")}</label>
      <select
        value={nuevaComision.estado}
        onChange={(e) => setNuevaComision({ ...nuevaComision, estado: e.target.value })}
      >
        <option value="pendiente">{translateUI("Pendiente")}</option>
        <option value="cobrada">{translateUI("Cobrada")}</option>
      </select>
    </div>
  </div>

  <button
    type="button"
    className="btn btn-sm"
    onClick={agregarComision}
  >{translateUI("+ Añadir comisión")}</button>
</div>


{comisiones.map((comision) => {
  const importeComision = calcularImporteComision(comision)

  return (
    <div className="commission-card" key={comision.id}>
      <div className="commission-card-head">
        <strong>{comision.colaborador || translateUI("Colaborador")}</strong>
        <span
          className={
            'commission-status ' +
            (comision.estado === 'cobrada' ? 'is-paid' : 'is-pending')
          }
        >
          {comision.estado === 'cobrada' ? translateUI("✓ Cobrada") : translateUI("⏳ Pendiente")}
        </span>
      </div>

      <div className="commission-grid">
        <div className="field">
          <label>{translateUI("Colaborador")}</label>
          <input
            type="text"
            value={comision.colaborador || ''}
            onChange={(e) => actualizarComision(comision.id, 'colaborador', e.target.value)}
          />
        </div>

        <div className="field">
          <label>{translateUI("Concepto")}</label>
          <input
            type="text"
            value={comision.concepto || ''}
            onChange={(e) => actualizarComision(comision.id, 'concepto', e.target.value)}
          />
        </div>

        <div className="field">
          <label>{translateUI("Presupuesto aceptado (€)")}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={comision.presupuesto ?? ''}
            onChange={(e) => actualizarComision(comision.id, 'presupuesto', e.target.value)}
          />
        </div>

        <div className="field">
          <label>{translateUI("Comisión acordada (%)")}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={comision.porcentaje ?? ''}
            onChange={(e) => actualizarComision(comision.id, 'porcentaje', e.target.value)}
          />
        </div>

        <div className="field">
          <label>{translateUI("Comisión (€)")}</label>
          <input
            type="text"
            value={`${importeComision.toLocaleString(getLocale())} €`}
            readOnly
          />
        </div>

        <div className="field">
          <label>{translateUI("Fecha presupuesto")}</label>
          <input
            type="date"
            value={comision.fecha || ''}
            onChange={(e) => actualizarComision(comision.id, 'fecha', e.target.value)}
          />
        </div>
      </div>

      {comision.estado === 'cobrada' && comision.fechaCobro && (
        <div className="commission-paid-date">{translateUI("Cobrado el ")}{formatearFecha(comision.fechaCobro)}
        </div>
      )}

      <div className="commission-card-actions">
        {comision.estado === 'cobrada' ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => marcarComisionPendiente(comision.id)}
          >{translateUI("↩ Marcar pendiente")}</button>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => marcarComisionCobrada(comision.id)}
          >{translateUI("✓ Marcar cobrada")}</button>
        )}

        {modulosActivos.documentos && (
        <label className="btn btn-sm commission-upload-btn">
          {subiendoComisionId === comision.id
            ? translateUI("Subiendo…")
            : comision.presupuestoPdf
              ? translateUI("📎 Cambiar PDF")
              : translateUI("📎 Subir presupuesto PDF")}
          <input
            type="file"
            accept="application/pdf"
            disabled={subiendoComisionId === comision.id}
            onChange={(e) => {
              subirPresupuestoComision(comision.id, e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        )}

        {modulosActivos.documentos && comision.presupuestoPdf && (
          <a
            href={comision.presupuestoPdf}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm"
          >{translateUI("📄 Ver presupuesto")}</a>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={() => borrarComision(comision.id)}
          aria-label={translateUI("Eliminar comisión")}
          title={translateUI("Eliminar comisión")}
        >
          ✕
        </button>
      </div>
    </div>
  )
})}
</>
)}


{modulosActivos.tareas && (
<>
<div ref={tareasRef} className="section-label">{translateUI("Tareas")}</div>
        {datos.tareas.map((t) => (
          <div className="list-row" key={t.id}>
            <input type="checkbox" checked={t.hecha} onChange={() => alternarTarea(t.id)} />
            <input
              type="text"
              value={t.texto}
              onChange={(e) =>
                set(
                  'tareas',
                  datos.tareas.map((x) => (x.id === t.id ? { ...x, texto: e.target.value } : x))
                )
              }
              style={{ textDecoration: t.hecha ? 'line-through' : 'none', color: t.hecha ? 'var(--ink-faint)' : 'inherit' }}
            />
            <button type="button" className="icon-btn" onClick={() => borrarTarea(t.id)} aria-label={translateUI("Eliminar tarea")}>
              ✕
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            type="text"
            placeholder={translateUI("Añadir tarea y pulsar Enter")}
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarTarea()
              }
            }}
          />
          <button type="button" className="btn btn-sm" onClick={agregarTarea}>{translateUI("Añadir")}</button>
        </div>
</>
)}

{modulosActivos.proveedores && (
<>
        <div className="section-label">{translateUI("Proveedores")}</div>
        {datos.proveedores.map((p) => (
          <div className="list-row" key={p.id}>
            <input
              type="text"
              value={p.nombre}
              onChange={(e) =>
                set(
                  'proveedores',
                  datos.proveedores.map((x) => (x.id === p.id ? { ...x, nombre: e.target.value } : x))
                )
              }
              style={{ maxWidth: '45%' }}
            />
            <input
              type="text"
              placeholder={translateUI("contacto / teléfono")}
              value={p.contacto}
              onChange={(e) => actualizarProveedorContacto(p.id, e.target.value)}
            />
            <button type="button" className="icon-btn" onClick={() => borrarProveedor(p.id)} aria-label={translateUI("Eliminar proveedor")}>
              ✕
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            type="text"
            placeholder={translateUI("Añadir proveedor y pulsar Enter")}
            value={nuevoProveedor}
            onChange={(e) => setNuevoProveedor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarProveedor()
              }
            }}
          />
          <button type="button" className="btn btn-sm" onClick={agregarProveedor}>{translateUI("Añadir")}</button>
      </div>
</>
)}

    <ProjectHistory
  proyecto={datos}
  onDeleteHistory={borrarHistorial}
/>
      <div className="section-label">{translateUI("Notas")}</div>

      <div className="field">
        <textarea
          value={datos.notas}
          onChange={(e) => set('notas', e.target.value)}
          placeholder={translateUI("Observaciones, medidas, referencias…")}
        />
      </div>

        <div className="modal-actions">
          <div>
            {!esNuevo && (
              <>
                {datos.estado === 'finalizado' ? (
                  <button type="button" className="btn btn-ghost" disabled={guardando || subiendoImagen} onClick={onReopen}>{translateUI("↩ Reabrir proyecto")}</button>
                ) : (
                  <button type="button" className="btn btn-ghost" disabled={guardando || subiendoImagen} onClick={onFinalize}>{translateUI("✓ Finalizar proyecto")}</button>
                )}
                <button type="button" className="btn btn-ghost btn-danger" disabled={guardando || subiendoImagen} onClick={() => onDelete(datos.id)}>{translateUI("Eliminar proyecto")}</button>
              </>
            )}
          </div>
          <div className="right">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{translateUI("Cancelar")}</button>
          {modulosActivos.clientes && (
          <input
  ref={contactoInputRef}
  type="file"
  accept=".vcf"
  style={{ display: 'none' }}
  onChange={importarContacto}
/>
          )}
          {modulosActivos.documentos && (
  <input
  type="file"
  accept="application/pdf"
  id="pdfPresupuesto"
  style={{ display: 'none' }}
  onChange={subirPresupuesto}
/>
          )}
           <button type="submit" className="btn btn-primary" disabled={guardando || subiendoImagen || Boolean(subiendoComisionId) || subiendoPdf}>
              {guardando || subiendoImagen ? translateUI("Guardando…") : translateUI("Guardar")}
            </button>
          </div>
        </div>

        {modulosActivos.documentos && editorImagenSrc && (
          <ProjectImageCropper
            src={editorImagenSrc}
            onCancel={() => setEditorImagenSrc('')}
            onConfirm={confirmarImagenRecortada}
          />
        )}
     
        </fieldset>
      </form>
    </div>
  )
}
