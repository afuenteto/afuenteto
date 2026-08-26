import { useState } from 'react'
import { supabase } from '../supabase.js'
export default function ClientModal({
  cliente,
  proyectos,
  setClientes,
  onOpenProject,
  onClose
}) {

  if (!cliente) return null
const [editando, setEditando] = useState(false)
  
const [datosCliente, setDatosCliente] = useState({
  nombre: cliente.nombre || '',
  telefono: cliente.telefono || '',
  email: cliente.email || '',
  direccion: cliente.direccion || ''
})

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
          .filter(c => c.estado !== 'previsto')
          .reduce(
            (suma, c) =>
              suma + Number(c.importe || 0),
            0
          ),
      0
    )


  const pendiente =
    totalContratado - totalCobrado



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
>
  ✏️ Editar
</button>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>
{editando && (

  <div className="panel-item">

    <label>Nombre</label>
    <input
      value={datosCliente.nombre}
      onChange={(e) =>
        setDatosCliente({
          ...datosCliente,
          nombre: e.target.value
        })
      }
    />


    <label>Teléfono</label>
    <input
      value={datosCliente.telefono}
      onChange={(e) =>
        setDatosCliente({
          ...datosCliente,
          telefono: e.target.value
        })
      }
    />


    <label>Email</label>
    <input
      value={datosCliente.email}
      onChange={(e) =>
        setDatosCliente({
          ...datosCliente,
          email: e.target.value
        })
      }
    />


    <label>Dirección</label>
    <input
      value={datosCliente.direccion}
      onChange={(e) =>
        setDatosCliente({
          ...datosCliente,
          direccion: e.target.value
        })
      }
    />


    <button
      className="btn"
      type="button"
     onClick={async () => {

  const { error } =
    await supabase
      .from('clientes')
      .update(datosCliente)
      .eq('id', cliente.id)


  if (error) {
    alert(error.message)
    return
  }


  setClientes((prev) =>
    prev.map((c) =>
      c.id === cliente.id
        ? {
            ...c,
            ...datosCliente
          }
        : c
    )
  )


  cliente.nombre = datosCliente.nombre
  cliente.telefono = datosCliente.telefono
  cliente.email = datosCliente.email
  cliente.direccion = datosCliente.direccion


  setEditando(false)

}}
    >
      💾 Guardar cliente
    </button>


  </div>

)}


        <div className="panel-item">
          <strong>
            Teléfono
          </strong>

          <span>
            {cliente.telefono || '-'}
          </span>
        </div>



        <div className="panel-item">
          <strong>
            Email
          </strong>

          <span>
            {cliente.email || '-'}
          </span>
        </div>



        <div className="panel-item">
          <strong>
            Dirección
          </strong>

          <span>
            {cliente.direccion || '-'}
          </span>
        </div>



        <div className="section-label">
          Resumen económico
        </div>


        <div className="panel-item">
          <strong>
            Proyectos
          </strong>

          <span>
            {proyectosCliente.length}
          </span>
        </div>


        <div className="panel-item">
          <strong>
            Contratado
          </strong>

          <span>
            {totalContratado.toLocaleString('es-ES')} €
          </span>
        </div>


        <div className="panel-item">
          <strong>
            Cobrado
          </strong>

          <span>
            {totalCobrado.toLocaleString('es-ES')} €
          </span>
        </div>


        <div className="panel-item">
          <strong>
            Pendiente
          </strong>

          <span>
            {pendiente.toLocaleString('es-ES')} €
          </span>
        </div>



        <div className="section-label">
          Proyectos del cliente
        </div>



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
    {p.fase}
  </span>

</button>

        ))}


      </div>

    </div>

  )

}
