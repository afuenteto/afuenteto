import { diasHasta } from '../storage.js'


export default function DeliveriesPanel({
  proyectos,
  onClose,
  onOpen
}) {


  const entregas =
    proyectos.filter((p)=>
      diasHasta(p.fechaEntrega) !== null
    )


  entregas.sort((a,b)=>
    diasHasta(a.fechaEntrega) -
    diasHasta(b.fechaEntrega)
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
            📅 Entregas próximas
          </h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>


        {entregas.map((p)=>(

          <button
            key={p.id}
            className="panel-item"
            onClick={() =>
              onOpen(p)
            }
          >

            <strong>
              {p.nombre}
            </strong>


            <span>
              {p.fechaEntrega}
            </span>


            <b>
              {diasHasta(p.fechaEntrega)} días
            </b>


          </button>

        ))}


      </div>

    </div>

  )

}
