export default function PaymentsPanel({
  proyectos,
  onClose,
  onOpen
}) {

  const cobros = []

  proyectos.forEach((proyecto) => {

    ;(proyecto.cobros || []).forEach((cobro) => {

      if (cobro.estado === 'previsto') {

        cobros.push({
          ...cobro,
          proyecto
        })

      }

    })

  })


  cobros.sort(
    (a, b) =>
      new Date(a.fecha) -
      new Date(b.fecha)
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
            💰 Cobros pendientes
          </h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {cobros.length === 0 && (

          <p className="mono">
            No hay cobros pendientes.
          </p>

        )}



        {cobros.map((item) => (

          <button
            key={item.id}
            className="panel-item"
            onClick={() =>
              onOpen(item.proyecto)
            }
          >

            <strong>
              {item.proyecto.nombre}
            </strong>


            <span>
              Cliente: {item.proyecto.cliente || 'Sin cliente'}
            </span>


            <span>
              {item.concepto}
            </span>


            <span>
              📅 {item.fecha}
            </span>


            <b>
              💰 {Number(item.importe)
                .toLocaleString('es-ES')} €
            </b>


          </button>

        ))}


      </div>

    </div>

  )

}
