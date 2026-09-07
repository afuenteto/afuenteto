import { t as translateUI, getLocale } from '../i18n.js'
import { useState } from 'react'
import { supabase } from '../supabase.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'


export default function ClientModal({
  cliente,
  usuario,
  clientes = [],
  onClientUpdated,
  proyectos,
  setClientes,
  onDeleteClient,
  onOpenProject,
  onClose,
  modulos = MODULOS_PREDETERMINADOS
}) {


  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)


 const [datosCliente, setDatosCliente] = useState({
  nombre: cliente?.nombre || '',
  telefono: cliente?.telefono || '',
  email: cliente?.email || '',
  direccion: cliente?.direccion || '',
  notas: cliente?.notas || ''
})

  if (!cliente) return null



  const proyectosCliente =
    proyectos.filter(
      (p) =>
        p.cliente === cliente.nombre
    )



  const totalContratado =
    proyectosCliente.reduce(
      (total, p) =>
        total +
        Number(p.honorariosDiseno || 0) +
        Number(p.honorariosGestion || 0) +
        Number(p.otrosImportes || 0),
      0
    )



  const totalCobrado =
    proyectosCliente.reduce(
      (total, p) =>
        total +
        (p.cobros || [])
          .filter(
            c => c.estado !== 'previsto'
          )
          .reduce(
            (suma, c) =>
              suma + Number(c.importe || 0),
            0
          ),
      0
    )


  const pendiente =
    totalContratado - totalCobrado



  async function guardarCliente() {
    if (!usuario || guardando) return
    const nombre = datosCliente.nombre.trim().replace(/\s+/g, ' ')
    if (!nombre) { alert(translateUI("El nombre del cliente es obligatorio.")); return }
    if (clientes.some(c => c.id !== cliente.id && c.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      alert(translateUI("Ya existe un cliente con ese nombre.")); return
    }
    setGuardando(true)
    const actualizado = { ...cliente, ...datosCliente, nombre }
    try {
      // Renombrar proyectos primero; si falla la ficha, restaurar su asociación.
      const renombrar = async (anterior, siguiente) => {
        const { error } = await supabase.from('proyectos').update({ cliente: siguiente })
          .eq('cliente', anterior).eq('user_id', usuario.id)
        if (error) throw error
      }
      const cambiaNombre = cliente.nombre !== nombre
      if (cambiaNombre) await renombrar(cliente.nombre, nombre)
      try {
        const { error } = await supabase.from('clientes')
          .update({ ...datosCliente, nombre }).eq('id', cliente.id)
          .eq('user_id', usuario.id).select('id').single()
        if (error) throw error
      } catch (error) {
        if (cambiaNombre) {
          try { await renombrar(nombre, cliente.nombre) }
          catch { throw new Error('No se pudo guardar ni restaurar la asociación de proyectos. Recarga y revisa el cliente.') }
        }
        throw error
      }
      setClientes(prev => prev.map(c => c.id === cliente.id ? actualizado : c))
      onClientUpdated(actualizado, cliente.nombre)
      setDatosCliente({ ...datosCliente, nombre })
      setEditando(false)
    } catch (error) { alert(translateUI("No se pudo guardar el cliente: ") + error.message) }
    finally { setGuardando(false) }
  }
     return (

    <div
      className="panel-overlay"
      onMouseDown={(e)=>{

        if(e.target === e.currentTarget){
          onClose()
        }

      }}
    >


      <div className="panel">


        <div className="panel-head">

          <h2 className="serif">
            👤 {cliente.nombre}
          </h2>


          <button
            className="btn"
            type="button"
            onClick={() => setEditando(!editando)}
          >{translateUI("✏️ Editar")}</button>


          <button
            className="btn"
            type="button"
            onClick={() => setConfirmarBorrado(true)}
          >{translateUI("🗑️ Eliminar")}</button>


          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {editando && (

          <div className="panel-item">

            <label>{translateUI("Nombre")}</label>

            <input
              value={datosCliente.nombre}
              onChange={(e)=>
                setDatosCliente({
                  ...datosCliente,
                  nombre:e.target.value
                })
              }
            />


            <label>{translateUI("Teléfono")}</label>

            <input
              value={datosCliente.telefono}
              onChange={(e)=>
                setDatosCliente({
                  ...datosCliente,
                  telefono:e.target.value
                })
              }
            />


            <label>{translateUI("Email")}</label>

            <input
              value={datosCliente.email}
              onChange={(e)=>
                setDatosCliente({
                  ...datosCliente,
                  email:e.target.value
                })
              }
            />


            <label>{translateUI("Dirección")}</label>

            <input
              value={datosCliente.direccion}
              onChange={(e)=>
                setDatosCliente({
                  ...datosCliente,
                  direccion:e.target.value
                })
              }
              />


  <label>{translateUI("Notas")}</label>

  <textarea
    value={datosCliente.notas}
    onChange={(e)=>
      setDatosCliente({
        ...datosCliente,
        notas:e.target.value
      })
    }
  />


  <button
    className="btn"
    type="button"
    disabled={guardando}
    onClick={guardarCliente}
  >{translateUI("💾 Guardar cliente")}</button>

          </div>

        )}



        {confirmarBorrado && (

          <div className="panel-item">

            <strong>{translateUI("¿Eliminar cliente?")}</strong>


            <span>{translateUI("Esta acción no se puede deshacer.")}</span>


            <button
              className="btn"
              type="button"
              onClick={() => onDeleteClient(cliente)}
            >{translateUI("Sí, eliminar")}</button>


            <button
              className="btn"
              type="button"
              onClick={() => setConfirmarBorrado(false)}
            >{translateUI("Cancelar")}</button>


          </div>

        )}
                <div className="panel-item">

          <strong>{translateUI("Teléfono")}</strong>

          <span>
            {cliente.telefono || '-'}
          </span>

        </div>



        <div className="panel-item">

          <strong>{translateUI("Email")}</strong>

          <span>
            {cliente.email || '-'}
          </span>

        </div>



        <div className="panel-item">

          <strong>{translateUI("Dirección")}</strong>

          <span>
            {cliente.direccion || '-'}
          </span>

        </div>
        
<div className="panel-item">

  <strong>{translateUI("Notas")}</strong>

  <span>
    {cliente.notas || '-'}
  </span>

</div>


        {modulos.economia && <div className="section-label">{translateUI("Resumen económico")}</div>}



        <div className="panel-item">

          <strong>{translateUI("Proyectos")}</strong>

          <span>
            {proyectosCliente.length}
          </span>

        </div>



        {modulos.economia && <>
        <div className="panel-item">

          <strong>{translateUI("Contratado")}</strong>

          <span>
            {totalContratado.toLocaleString(getLocale())} €
          </span>

        </div>



        <div className="panel-item">

          <strong>{translateUI("Cobrado")}</strong>

          <span>
            {totalCobrado.toLocaleString(getLocale())} €
          </span>

        </div>



        <div className="panel-item">

          <strong>{translateUI("Pendiente")}</strong>

          <span>
            {pendiente.toLocaleString(getLocale())} €
          </span>

        </div>
        </>}



        <div className="section-label">{translateUI("Proyectos del cliente")}</div>



        {proyectosCliente.map((p)=>(

          <button
            key={p.id}
            className="panel-item"
            onClick={() =>
              onOpenProject(p)
            }
          >

            <strong>
              {p.nombre}
            </strong>

            <span>
              {translateUI(p.fase)}
            </span>

          </button>

        ))}


      </div>

    </div>

  )

} 
