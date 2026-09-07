import { t as translateUI, getLocale } from '../i18n.js'
import { formatearFecha } from '../storage.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'
export default function PaymentsPanel({
  proyectos,
  onClose,
  onOpen,
  modulos = MODULOS_PREDETERMINADOS
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

          <h2 className="serif">{translateUI("💰 Cobros pendientes")}</h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {cobros.length === 0 && (

          <p className="mono">{translateUI("No hay cobros pendientes.")}</p>

        )}



        {cobros.map((item) => (

          <button
            key={item.id}
            className="panel-item"
            onClick={() =>
              onOpen(item.proyecto, 'economia')
            }
          >

            <strong>
              {item.proyecto.nombre}
            </strong>


            {modulos.clientes && <span>{translateUI("Cliente: ")}{item.proyecto.cliente || translateUI("Sin cliente")}
            </span>}


            <span>
              {item.concepto}
            </span>


            <span>
              📅 {formatearFecha(item.fecha)}
            </span>


            <b>
              💰 {Number(item.importe)
                .toLocaleString(getLocale())} €
            </b>


          </button>

        ))}


      </div>

    </div>

  )

}
