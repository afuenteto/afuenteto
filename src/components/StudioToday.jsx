import { useState } from 'react'
import { diasHasta } from '../storage.js'

export default function StudioToday({
  proyectos,
  onOpen,
  onOpenTasks,
  setPanelAbierto
}) {

  const [abierto, setAbierto] = useState(false)


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


  const entregas = proyectos.filter((proyecto) => {

    const dias = diasHasta(
      proyecto.fechaEntrega
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


  const proyectosBloqueados =
    proyectos.filter(
      (proyecto) =>
        proyecto.prioridad === 'bloqueado'
    )


  return (

    <div className="studio-today">


      <div
        className="dashboard-toggle"
        onClick={() => setAbierto(!abierto)}
      >

        <span>
          Hoy en el estudio
        </span>


        <div className="today-counters">


          {tareasUrgentes.length > 0 && (

<button
  className="today-counter"
  type="button"
  onClick={(e) => {
    e.stopPropagation()
    setPanelAbierto('tareas')
  }}
>
  🔴 {tareasUrgentes.length}
</button>

)}



          {entregas.length > 0 && (

            <button
  className="today-counter"
  type="button"
  onClick={(e) => {
    e.stopPropagation()
    setPanelAbierto('entregas')
  }}
>
  📅 {entregas.length}
</button>

          )}



        {cobrosPendientes.length > 0 && (

  <button
  className="today-counter"
  type="button"
  onClick={(e) => {
    e.stopPropagation()
    setPanelAbierto('cobros')
  }}
>
  💰 {cobrosPendientes.length}
</button>

)}



          {proyectosBloqueados.length > 0 && (

           <button
  className="today-counter"
  type="button"
  onClick={(e) => {
    e.stopPropagation()
    setPanelAbierto('bloqueados')
  }}
>
  🔵 {proyectosBloqueados.length}
</button>

          )}



          <span>
            {abierto ? '−' : '+'}
          </span>


        </div>

      </div>



      {abierto && (

        <div className="today-content">



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
                    onOpenTasks(
                      item.proyecto
                    )
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
                    {proyecto.fechaEntrega}
                    {' · '}
                    {diasHasta(
                      proyecto.fechaEntrega
                    )} días
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
                   onOpen(item.proyecto, 'economia')
                  }
                >

                  <strong>
                    {item.proyecto.nombre}
                  </strong>


                  <span>
                    {Number(
                      item.importe
                    ).toLocaleString('es-ES')} €
                  </span>


                </button>

              ))}


            </div>

          )}






          {proyectosBloqueados.length > 0 && (

            <div className="today-block">

              <h3>
                🔵 Proyectos bloqueados
              </h3>


              {proyectosBloqueados.map((proyecto) => (

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
                    Proyecto bloqueado
                  </span>


                </button>

              ))}


            </div>

          )}



        </div>

      )}


    </div>

  )

}
