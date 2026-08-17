import { useState, useRef } from 'react'
import { FASES, uid } from '../storage.js'
import { supabase } from '../supabase.js'

export default function ProjectModal({ proyecto, onSave, onDelete, onClose }) {
 const contactoInputRef = useRef(null)
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
    console.error(error)
    alert('No se pudo subir el PDF')
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
  const [datos, setDatos] = useState(proyecto)
  const [nuevaTarea, setNuevaTarea] = useState('')
  const [nuevoProveedor, setNuevoProveedor] = useState('')

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

  function agregarProveedor() {
    const nombre = nuevoProveedor.trim()
    if (!nombre) return
    set('proveedores', [...datos.proveedores, { id: uid(), nombre, contacto: '' }])
    setNuevoProveedor('')
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
  ESTOY EN ESTE ARCHIVO
</p>
          <h2 className="serif">PRUEBA{esNuevo ? 'Nuevo proyecto PRUEBA' : datos.nombre || 'Editar proyecto'}</h2>
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
            <input
           id="cliente" type="text" value={datos.cliente} onChange={(e) => set('cliente', e.target.value)} />
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
            <label htmlFor="fechaEntrega">Fecha de entrega estimada</label>
            <input id="fechaEntrega" type="date" value={datos.fechaEntrega} onChange={(e) => set('fechaEntrega', e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="fase">Fase actual</label>
            <select id="fase" value={datos.fase} onChange={(e) => set('fase', e.target.value)}>
              {FASES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div />
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
<label style={{color:'red', fontSize:'20px'}}>
  PRUEBA PDF
</label>
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
        <div className="section-label">Tareas</div>
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

        <div className="section-label">Notas</div>
        <div className="field">
          <textarea value={datos.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones, medidas, referencias…" />
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
