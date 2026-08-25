import { useEffect, useState, useRef } from 'react'
import { FASES, uid } from '../storage.js'
import { supabase } from '../supabase.js'
import ProjectHistory from './ProjectHistory.jsx'

export default function ProjectModal({
  proyecto,
  clientes = [],
  setClientes,
  onSave,
  onDelete,
  onClose,
  seccionInicial = null
}) {
 const [datos, setDatos] = useState({
  ...proyecto,
  cobros: proyecto.cobros || []
})

const [nuevaTarea, setNuevaTarea] = useState('')
const [nuevoProveedor, setNuevoProveedor] = useState('')

const [nuevoCobro, setNuevoCobro] = useState({
  fecha: '',
  concepto: '',
  importe: '',
  estado: 'cobrado'
})

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
 console.log('CLIENTES EN MODAL:', clientes)
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

  function actualizarProveedorContacto(id, contacto) {
    set(
      'proveedores',
      datos.proveedores.map((p) => (p.id === id ? { ...p, contacto } : p))
    )
  }

  function borrarProveedor(id) {
    set('proveedores', datos.proveedores.filter((p) => p.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!datos.nombre.trim()) return
    onSave(datos)
  }

  const esNuevo = !proyecto.nombre && proyecto.tareas.length === 0 && proyecto.proveedores.length === 0

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
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

        <div className="field-row">
          <div className="field">
            <label htmlFor="cliente">Cliente / contacto</label>
         
  

<select
  value=""
  onChange={(e) => {

    const clienteSeleccionado =
      clientes.find(
        (c) => c.id === e.target.value
      )

    if (!clienteSeleccionado) return

    setDatos((d) => ({
      ...d,
      cliente: clienteSeleccionado.nombre || '',
      telefono: clienteSeleccionado.telefono || '',
      email: clienteSeleccionado.email || '',
      direccion: clienteSeleccionado.direccion || ''
    }))

  }}
>
  <option value="">
    Seleccionar cliente guardado...
  </option>

  {clientes.map((cliente) => (
    <option
      key={cliente.id}
      value={cliente.id}
    >
      {cliente.nombre}
    </option>
  ))}

</select>


<input
 id="cliente"
 type="text"
 value={datos.cliente}
 onChange={(e) =>
   set('cliente', e.target.value)
 }
/>
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
            <input id="fechaInicio" type="date" value={datos.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} />
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
              <button type="button" className="btn btn-ghost btn-danger" onClick={() => onDelete(datos.id)}>
                Eliminar proyecto
              </button>
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
           <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </div>
     
      </form>
    </div>
  )
}
