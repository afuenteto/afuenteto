import { t as translateUI, formatRelativeDays } from '../i18n.js'
import { diasHasta, formatearFecha } from '../storage.js'

export default function DeliveriesPanel({
  proyectos,
  onClose,
  onOpen
}) {


  const entregas =
    proyectos.filter((proyecto) => {

      const dias =
        diasHasta(proyecto.fechaEntrega)

      return dias !== null

    })


  entregas.sort((a, b) =>
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

          <h2 className="serif">{translateUI("📅 Entregas próximas")}</h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {entregas.length === 0 && (

          <p className="mono">{translateUI("No hay entregas previstas.")}</p>

        )}



        {entregas.map((proyecto) => (

          <button
            key={proyecto.id}
            className="panel-item"
            onClick={() =>
              onOpen(proyecto)
            }
          >

            <strong>
              {proyecto.nombre}
            </strong>


            <span>{translateUI("Cliente: ")}{proyecto.cliente || translateUI("Sin cliente")}
            </span>


            <span>{translateUI("📅 Entrega:")}{' '}
              {formatearFecha(proyecto.fechaEntrega)}
            </span>


            <b>⏳ {formatRelativeDays(diasHasta(
                proyecto.fechaEntrega
              ))}</b>


          </button>

        ))}


      </div>

    </div>

  )

}
