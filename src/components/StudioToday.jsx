import { diasHasta } from '../storage.js'

export default function StudioToday({
  proyectos,
  onOpen,
  onOpenTasks
}) {

  const tareasPendientes = []

  proyectos.forEach((proyecto) => {
    ;(proyecto.tareas || []).forEach((tarea) => {

      if (!tarea.hecha) {

        tareasPendientes.push({
          ...tarea,
          proyecto
        })

      }

    })
  })


  const tareasUrgentes = tareasPendientes.filter((item) => {

    const dias = diasHasta(
      item.proyecto.fechaEntrega
    )

    return dias !== null && dias <= 7

  })


  const entregas = proyectos.filter((p) => {

    const dias = diasHasta(
      p.fechaEntrega
    )

    return dias !== null && dias <= 14

  })


  const cobrosPendientes = []

  proyectos.forEach((proyecto) => {

    ;(proyecto.cobros || []).forEach((cobro) => {

      if (cobro.estado === 'previsto') {

        cobrosPendientes.push({
          ...cobro,
          proyecto
        })

      }

    })

  })


  const vacio =
    tareasUrgentes.length === 0 &&
    entregas.length === 0 &&
    cobrosPendientes.length === 0


  return (

    <div className="studio-today">

     <div className="section-label dashboard-toggle">
  Hoy en el estudio
</div>

      {vacio && (
        <p className="today-empty">
          No hay asuntos pendientes.
        </p>
      )}


      {tareasUrgentes.length > 0 && (

        <div className="today-block">

          <h3>
            🔴 Tareas próximas
          </h3>

          {tareasUrgentes.map((item) => (

            <button
              key={item.id}
              className="today-item"
              onClick={() =>
                onOpenTasks(item.proyecto)
              }
            >

              <strong>
                {item.proyecto.nombre}
              </strong>

              <span>
                {item.texto}
              </span>

            </button>

          ))}

        </div>

      )}



      {entregas.length > 0 && (

        <div className="today-block">

          <h3>
            📅 Entregas próximas
          </h3>


          {entregas.map((proyecto) => (

            <button
              key={proyecto.id}
              className="today-item"
              onClick={() =>
                onOpen(proyecto)
              }
            >

              <strong>
                {proyecto.nombre}
              </strong>

              <span>
                Entrega:
                {' '}
                {proyecto.fechaEntrega}
              </span>

            </button>

          ))}

        </div>

      )}



      {cobrosPendientes.length > 0 && (

        <div className="today-block">

          <h3>
            💰 Cobros previstos
          </h3>


          {cobrosPendientes.map((item) => (

            <button
              key={item.id}
              className="today-item"
              onClick={() =>
                onOpen(item.proyecto)
              }
            >

              <strong>
  {item.proyecto.nombre}
</strong>

<span>
  {Number(item.importe).toLocaleString('es-ES')} €
</span>

            </button>

          ))}

        </div>

      )}

    </div>

  )
}
