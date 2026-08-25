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


  return (

    <div
      className="panel-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
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
          Proyectos
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
