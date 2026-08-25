export default function ClientModal({
  cliente,
  proyectos,
  onClose
}) {

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
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



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

          <div
            key={p.id}
            className="panel-item"
          >

            <strong>
              {p.nombre}
            </strong>


            <span>
              {p.fase}
            </span>

          </div>

        ))}


      </div>

    </div>

  )

}
