import { useEffect, useState, useRef } from 'react'
import { FASES, uid } from '../storage.js'
import { supabase } from '../supabase.js'
import ProjectHistory from './ProjectHistory.jsx'
import ProjectImageCropper from './ProjectImageCropper.jsx'

export default function ProjectModal({
  proyecto,
  clientes = [],
  usuario,
  setClientes,
  onOpenClient,
  onSave,
  onDelete,
  onFinalize,
  onReopen,
  onClose,
  seccionInicial = null
}) {
    console.log('CLIENTES:', clientes)
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
const [subiendoComisionId, setSubiendoComisionId] = useState(null)
const imagenInputRef = useRef(null)
const [editorImagenSrc, setEditorImagenSrc] = useState('')
const [imagenPendiente, setImagenPendiente] = useState(null)
const [imagenPendientePreview, setImagenPendientePreview] = useState('')
const [subiendoImagen, setSubiendoImagen] = useState(false)

useEffect(() => {
  return () => {
    if (editorImagenSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(editorImagenSrc)
    }
    if (imagenPendientePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagenPendientePreview)
    }
  }
}, [editorImagenSrc, imagenPendientePreview])

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
  const file = e.target.files?.[0]
  e.target.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen.')
    return
  }

  if (file.size > 25 * 1024 * 1024) {
    alert('La imagen original es demasiado grande. Elige una de menos de 25 MB.')
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

  const nombreArchivo = `${usuario.id}/${datos.id}-${Date.now()}.webp`

  const { error } = await supabase.storage
    .from('imagenes-proyectos')
    .upload(nombreArchivo, blob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('imagenes-proyectos')
    .getPublicUrl(nombreArchivo)

  return data.publicUrl
}

 async function subirPresupuesto(e) {
  const file = e.target.files?.[0]

  if (!file) return
  if (file.type !== 'application/pdf') {
    alert('Selecciona un archivo PDF')
    return
  }

  const nombreArchivo = `${datos.id}-${Date.now()}-${file.name}`

  const { error } = await supabase.storage
    .from('presupuestos')
    .upload(nombreArchivo, file)

if (error) {
  console.log('ERROR SUPABASE PDF:', error)
  alert(JSON.stringify(error))
  return
}

  const { data } = supabase.storage
    .from('presupuestos')
    .getPublicUrl(nombreArchivo)

  setDatos((d) => ({
    ...d,
    presupuestoPdf: data.publicUrl,
  }))
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
      datos.tareas.map((t) => (t.id === id ? { ...t, hecha: !t.hecha } : t))
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
    alert('Indica colaborador, presupuesto aceptado y porcentaje de comisión.')
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
        texto: `Comisión añadida: ${colaborador} · ${porcentaje}% (${importe.toLocaleString('es-ES')} €)`,
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
        texto: `Comisión cobrada: ${comision.colaborador} (${importe.toLocaleString('es-ES')} €)`,
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
  if (!file) return

  if (file.type !== 'application/pdf') {
    alert('Selecciona un archivo PDF')
    return
  }

  setSubiendoComisionId(id)

  try {
    const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const nombreArchivo = `comision-${datos.id}-${id}-${Date.now()}-${nombreSeguro}`

    const { error } = await supabase.storage
      .from('presupuestos')
      .upload(nombreArchivo, file)

    if (error) throw error

    const { data } = supabase.storage
      .from('presupuestos')
      .getPublicUrl(nombreArchivo)

    setDatos((actual) => ({
      ...actual,
      comisiones: (actual.comisiones || []).map((item) =>
        item.id === id
          ? {
              ...item,
              presupuestoPdf: data.publicUrl,
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
    alert(`No se pudo subir el PDF.

${error.message || error}`)
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
    if (!datos.nombre.trim() || subiendoImagen) return

    setSubiendoImagen(true)

    try {
      let datosAGuardar = { ...datos }

      if (imagenPendiente) {
        const imagenProyecto = await subirImagenProyecto(imagenPendiente)

        datosAGuardar = {
          ...datosAGuardar,
          imagenProyecto,
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
      alert(`No se pudo guardar la imagen del proyecto.

${error.message || error}`)
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
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className={"modal" + (datos.estado === 'finalizado' ? " project-finalized-modal" : "")}
        onSubmit={handleSubmit}
      >
        {datos.estado === 'finalizado' && (
          <div className="finalized-watermark finalized-watermark-modal">FINALIZADO</div>
        )}
        <div className="modal-head">
         <p style={{color:"red", fontSize:"20px"}}>
  </p>
        <h2 className="serif">
  {esNuevo ? 'Nuevo proyecto' : datos.nombre || 'Editar proyecto'}
</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="field">
          <label htmlFor="nombre">Nombre del proyecto</label>
          <input
            id="nombre"
            type="text"
            value={datos.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="p. ej. Reforma ático Sardinero"
            autoFocus
            required
          />
        </div>

        <div className="project-image-field">
          <div className="project-image-field-head">
            <div>
              <strong>Imagen de la ficha</strong>
              <span>Una imagen por proyecto · se optimiza automáticamente</span>
            </div>

            <div className="project-image-buttons">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => imagenInputRef.current?.click()}
              >
                {imagenPendientePreview || datos.imagenProyecto ? 'Cambiar imagen' : 'Subir imagen'}
              </button>

              {(imagenPendientePreview || datos.imagenProyecto) && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={quitarImagenProyecto}
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          {(imagenPendientePreview || datos.imagenProyecto) ? (
            <div className="project-image-modal-preview">
              <img
                src={imagenPendientePreview || datos.imagenProyecto}
                alt="Imagen de cabecera del proyecto"
              />
            </div>
          ) : (
            <button
              type="button"
              className="project-image-empty"
              onClick={() => imagenInputRef.current?.click()}
            >
              + Añadir imagen de cabecera
            </button>
          )}

          <input
            ref={imagenInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={seleccionarImagenProyecto}
          />
        </div>

        <div className="field-row">
          <div className="field">
         <label htmlFor="cliente">
  Cliente / contacto
</label>

<div ref={clientesRef}>

  <input
    type="text"
    placeholder="🔍 Buscar cliente..."
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
const nombreLimpio = busquedaCliente
  .trim()
  .replace(/\s+/g, ' ')


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
        nombre: busquedaCliente,
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
        >
          ➕ Crear cliente "{busquedaCliente}"
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
    alert('No se encontró el cliente')
  }

}}
  >
    👤 Ver ficha cliente
  </button>

)}
             <button
  type="button"
  className="btn"
  onClick={() => contactoInputRef.current?.click()}
>
  👤 Importar contacto
</button>
          </div>
          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" type="text" value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={datos.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="direccion">Dirección / ubicación</label>
            <input id="direccion" type="text" value={datos.direccion} onChange={(e) => set('direccion', e.target.value)} />
           <button
  type="button"
  className="btn"
  onClick={abrirMaps}
  disabled={!datos.direccion}
>
  📍 Abrir en Maps
</button>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="fechaInicio">Fecha de inicio</label>
            <input
  id="fechaInicio"
  type="date"
  value={datos.fechaInicio || ''}
  onChange={(e) => set('fechaInicio', e.target.value)}
/>
          </div>
          <div className="field">
  <label htmlFor="fechaEntrega">
    Fecha de entrega estimada
  </label>

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
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="fase">Fase actual</label>
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
      {f}
    </option>
  ))}
</select>
          </div>
          <div />
        </div>
<div className="field">
  <label>Prioridad</label>

  <select
    value={datos.prioridad || 'en_curso'}
    onChange={(e) =>
      setDatos({
        ...datos,
        prioridad: e.target.value,
      })
    }
  >
    <option value="urgente">🔴 Urgente</option>
    <option value="en_curso">🟡 En curso</option>
    <option value="estable">🟢 Estable</option>
    <option value="bloqueado">🔵 Bloqueado</option>
  </select>
</div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="presupuestoTotal">Presupuesto total (€)</label>
            <input
              id="presupuestoTotal"
              type="number"
              min="0"
              step="0.01"
              value={datos.presupuestoTotal}
              onChange={(e) => set('presupuestoTotal', e.target.value)}
            />
          </div>

        <div
  ref={economiaRef}
  className="section-label"
>
  Economía del proyecto
</div>

<div className="field-row">
  <div className="field">
    <label>Tipo de proyecto</label>
    <select
      value={datos.tipoProyecto}
      onChange={(e) => set('tipoProyecto', e.target.value)}
    >
      <option>Vivienda</option>
      <option>Restaurante</option>
      <option>Hotel</option>
      <option>Oficina</option>
      <option>Comercio</option>
      <option>Mobiliario</option>
      <option>Otro</option>
    </select>
  </div>
</div>

<div className="field-row">
  <div className="field">
    <label>Honorarios diseño (€)</label>
    <input
      type="number"
      value={datos.honorariosDiseno}
      onChange={(e) => set('honorariosDiseno', e.target.value)}
    />
  </div>

  <div className="field">
    <label>Gestión / seguimiento (€)</label>
    <input
      type="number"
      value={datos.honorariosGestion}
      onChange={(e) => set('honorariosGestion', e.target.value)}
    />
  </div>
</div>

<div className="field-row">
  <div className="field">
    <label>Otros servicios (€)</label>
    <input
      type="number"
      value={datos.otrosImportes}
      onChange={(e) => set('otrosImportes', e.target.value)}
    />
  </div>

  <div className="field">
    <label>Horas estimadas</label>
    <input
      type="number"
      value={datos.horasEstimadas}
      onChange={(e) => set('horasEstimadas', e.target.value)}
    />
  </div>
</div>






         
         
          <div className="field">
            <label htmlFor="presupuestoGastado">Gastado hasta ahora (€)</label>
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
<div className="field">
  <label>Presupuesto</label>
  <button
    type="button"
    className="btn"
    onClick={() =>
      document.getElementById('pdfPresupuesto').click()
    }
  >
    📎 Subir presupuesto PDF
  </button>

  {datos.presupuestoPdf && (
    <a
      href={datos.presupuestoPdf}
      target="_blank"
      rel="noreferrer"
      className="btn"
      style={{ marginTop: '8px' }}
    >
      📄 Ver presupuesto
    </a>
  )}
</div>
<div className="section-label">Resumen económico</div>

<div className="field-row">

  <div className="field">
    <label>Valor del proyecto</label>
    <input
      type="text"
      value={`${totalProyecto.toLocaleString('es-ES')} €`}
      readOnly
    />
  </div>

  <div className="field">
    <label>Total cobrado</label>
    <input
      type="text"
      value={`${totalCobrado.toLocaleString('es-ES')} €`}
      readOnly
    />
  </div>

</div>

<div className="field">
  <label>Pendiente de cobro</label>
  <input
    type="text"
    value={`${pendienteCobro.toLocaleString('es-ES')} €`}
    readOnly
  />
</div>
{totalPrevisto > 0 && (
  <div className="field">
    <label>Cobros previstos</label>
    <input
      type="text"
      value={`${totalPrevisto.toLocaleString('es-ES')} €`}
      readOnly
    />
  </div>
)}

<div className="section-label">Cobros</div>
{(datos.cobros || []).map((c) => (
  <div className="list-row" key={c.id}>
    <span>{c.fecha}</span>
    <span>{c.concepto}</span>
<strong>
  {Number(c.importe).toLocaleString('es-ES')} € 
  {c.estado === 'previsto' ? ' ⏳ Previsto' : ' ✓ Cobrado'}
</strong>
   
   {c.estado === 'previsto' && (
  <button
    type="button"
    className="btn btn-sm"
    onClick={() => marcarCobrado(c.id)}
  >
    ✓ Cobrar
  </button>
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
      aria-label="Eliminar cobro"
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
  placeholder="Concepto"
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
  placeholder="Importe"
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
  <option value="cobrado">
    Cobrado
  </option>

  <option value="previsto">
    Previsto
  </option>
</select>
<button
 type="button"
 className="btn btn-sm"
 onClick={agregarCobro}
>
 Añadir
</button>

</div>
        <div className="section-label dashboard-section-heading">Comisiones de colaboradores</div>

<div className="commission-summary">
  <div className="field-row">
    <div className="field">
      <label>Presupuestos aceptados</label>
      <input
        type="text"
        value={`${totalPresupuestosColaboradores.toLocaleString('es-ES')} €`}
        readOnly
      />
    </div>
    <div className="field">
      <label>Comisiones generadas</label>
      <input
        type="text"
        value={`${totalComisiones.toLocaleString('es-ES')} €`}
        readOnly
      />
    </div>
  </div>

  <div className="field-row">
    <div className="field">
      <label>Comisiones cobradas</label>
      <input
        type="text"
        value={`${totalComisionesCobradas.toLocaleString('es-ES')} €`}
        readOnly
      />
    </div>
    <div className="field">
      <label>Pendiente de cobrar</label>
      <input
        type="text"
        value={`${totalComisionesPendientes.toLocaleString('es-ES')} €`}
        readOnly
      />
    </div>
  </div>
</div>

<div className="commission-new">
  <div className="commission-new-title">+ Añadir nueva comisión</div>
  <div className="commission-grid">
    <div className="field">
      <label>Colaborador</label>
      <input
        type="text"
        placeholder="Nombre del colaborador"
        value={nuevaComision.colaborador}
        onChange={(e) => setNuevaComision({ ...nuevaComision, colaborador: e.target.value })}
      />
    </div>

    <div className="field">
      <label>Concepto</label>
      <input
        type="text"
        placeholder="Carpintería, iluminación…"
        value={nuevaComision.concepto}
        onChange={(e) => setNuevaComision({ ...nuevaComision, concepto: e.target.value })}
      />
    </div>

    <div className="field">
      <label>Presupuesto aceptado (€)</label>
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
      <label>Comisión acordada (%)</label>
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
      <label>Fecha presupuesto</label>
      <input
        type="date"
        value={nuevaComision.fecha}
        onChange={(e) => setNuevaComision({ ...nuevaComision, fecha: e.target.value })}
      />
    </div>

    <div className="field">
      <label>Estado inicial</label>
      <select
        value={nuevaComision.estado}
        onChange={(e) => setNuevaComision({ ...nuevaComision, estado: e.target.value })}
      >
        <option value="pendiente">Pendiente</option>
        <option value="cobrada">Cobrada</option>
      </select>
    </div>
  </div>

  <button
    type="button"
    className="btn btn-sm"
    onClick={agregarComision}
  >
    + Añadir comisión
  </button>
</div>


{comisiones.map((comision) => {
  const importeComision = calcularImporteComision(comision)

  return (
    <div className="commission-card" key={comision.id}>
      <div className="commission-card-head">
        <strong>{comision.colaborador || 'Colaborador'}</strong>
        <span
          className={
            'commission-status ' +
            (comision.estado === 'cobrada' ? 'is-paid' : 'is-pending')
          }
        >
          {comision.estado === 'cobrada' ? '✓ Cobrada' : '⏳ Pendiente'}
        </span>
      </div>

      <div className="commission-grid">
        <div className="field">
          <label>Colaborador</label>
          <input
            type="text"
            value={comision.colaborador || ''}
            onChange={(e) => actualizarComision(comision.id, 'colaborador', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Concepto</label>
          <input
            type="text"
            value={comision.concepto || ''}
            onChange={(e) => actualizarComision(comision.id, 'concepto', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Presupuesto aceptado (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={comision.presupuesto ?? ''}
            onChange={(e) => actualizarComision(comision.id, 'presupuesto', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Comisión acordada (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={comision.porcentaje ?? ''}
            onChange={(e) => actualizarComision(comision.id, 'porcentaje', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Comisión (€)</label>
          <input
            type="text"
            value={`${importeComision.toLocaleString('es-ES')} €`}
            readOnly
          />
        </div>

        <div className="field">
          <label>Fecha presupuesto</label>
          <input
            type="date"
            value={comision.fecha || ''}
            onChange={(e) => actualizarComision(comision.id, 'fecha', e.target.value)}
          />
        </div>
      </div>

      {comision.estado === 'cobrada' && comision.fechaCobro && (
        <div className="commission-paid-date">
          Cobrado el {comision.fechaCobro}
        </div>
      )}

      <div className="commission-card-actions">
        {comision.estado === 'cobrada' ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => marcarComisionPendiente(comision.id)}
          >
            ↩ Marcar pendiente
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => marcarComisionCobrada(comision.id)}
          >
            ✓ Marcar cobrada
          </button>
        )}

        <label className="btn btn-sm commission-upload-btn">
          {subiendoComisionId === comision.id
            ? 'Subiendo…'
            : comision.presupuestoPdf
              ? '📎 Cambiar PDF'
              : '📎 Subir presupuesto PDF'}
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

        {comision.presupuestoPdf && (
          <a
            href={comision.presupuestoPdf}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm"
          >
            📄 Ver presupuesto
          </a>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={() => borrarComision(comision.id)}
          aria-label="Eliminar comisión"
          title="Eliminar comisión"
        >
          ✕
        </button>
      </div>
    </div>
  )
})}


<div ref={tareasRef} className="section-label">Tareas</div>
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
            <button type="button" className="icon-btn" onClick={() => borrarTarea(t.id)} aria-label="Eliminar tarea">
              ✕
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            type="text"
            placeholder="Añadir tarea y pulsar Enter"
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarTarea()
              }
            }}
          />
          <button type="button" className="btn btn-sm" onClick={agregarTarea}>
            Añadir
          </button>
        </div>

        <div className="section-label">Proveedores</div>
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
              placeholder="contacto / teléfono"
              value={p.contacto}
              onChange={(e) => actualizarProveedorContacto(p.id, e.target.value)}
            />
            <button type="button" className="icon-btn" onClick={() => borrarProveedor(p.id)} aria-label="Eliminar proveedor">
              ✕
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            type="text"
            placeholder="Añadir proveedor y pulsar Enter"
            value={nuevoProveedor}
            onChange={(e) => setNuevoProveedor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarProveedor()
              }
            }}
          />
          <button type="button" className="btn btn-sm" onClick={agregarProveedor}>
          Añadir
        </button>
      </div>

    <ProjectHistory
  proyecto={datos}
  onDeleteHistory={borrarHistorial}
/>
      <div className="section-label">
        Notas
      </div>

      <div className="field">
        <textarea
          value={datos.notas}
          onChange={(e) => set('notas', e.target.value)}
          placeholder="Observaciones, medidas, referencias…"
        />
      </div>

        <div className="modal-actions">
          <div>
            {!esNuevo && (
              <>
                {datos.estado === 'finalizado' ? (
                  <button type="button" className="btn btn-ghost" onClick={onReopen}>
                    ↩ Reabrir proyecto
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={onFinalize}>
                    ✓ Finalizar proyecto
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-danger" onClick={() => onDelete(datos.id)}>
                  Eliminar proyecto
                </button>
              </>
            )}
          </div>
          <div className="right">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          <input
  ref={contactoInputRef}
  type="file"
  accept=".vcf"
  style={{ display: 'none' }}
  onChange={importarContacto}
/>
  <input
  type="file"
  accept="application/pdf"
  id="pdfPresupuesto"
  style={{ display: 'none' }}
  onChange={subirPresupuesto}
/>         
           <button type="submit" className="btn btn-primary" disabled={subiendoImagen}>
              {subiendoImagen ? 'Guardando imagen…' : 'Guardar'}
            </button>
          </div>
        </div>

        {editorImagenSrc && (
          <ProjectImageCropper
            src={editorImagenSrc}
            onCancel={() => setEditorImagenSrc('')}
            onConfirm={confirmarImagenRecortada}
          />
        )}
     
      </form>
    </div>
  )
}
