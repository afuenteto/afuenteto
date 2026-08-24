import { useState } from 'react'

export default function TasksPanel({
  proyectos,
  onClose,
  onCompleteTask
}) {

  const [confirmando, setConfirmando] = useState(null)
  const [completadas, setCompletadas] = useState([])


  const tareas = []


  proyectos.forEach((proyecto) => {

    ;(proyecto.tareas || []).forEach((tarea) => {

      if (!tarea.hecha) {

        tareas.push({
          ...tarea,
          proyecto
        })

      }

    })

  })


  // Ordenar por fecha de entrega más cercana
  tareas.sort((a, b) => {

    const diasA = a.proyecto.fechaEntrega
      ? Math.ceil(
          (
            new Date(a.proyecto.fechaEntrega) -
            new Date()
          ) /
          (1000 * 60 * 60 * 24)
        )
      : 9999


    const diasB = b.proyecto.fechaEntrega
      ? Math.ceil(
          (
            new Date(b.proyecto.fechaEntrega) -
            new Date()
          ) /
          (1000 * 60 * 60 * 24)
        )
      : 9999


    return diasA - diasB

  })



  function completar(tarea) {

    setCompletadas([
      ...completadas,
      tarea.id
    ])


    setTimeout(() => {

      onCompleteTask(
        tarea.proyecto.id,
        tarea.id
      )

      setConfirmando(null)

    }, 700)

  }



  function diasEntrega(fecha) {

    if (!fecha) return null

    const dias = Math.ceil(
      (
        new Date(fecha) -
        new Date()
      ) /
      (1000 * 60 * 60 * 24)
    )

    return dias

  }



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
            🔴 Tareas pendientes
          </h2>


          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {tareas.length === 0 && (

          <p className="mono">
            No hay tareas pendientes.
          </p>

        )}



        {tareas.map((tarea) => (

          <div
            key={tarea.id}
            className={
              'panel-item ' +
              (
                completadas.includes(tarea.id)
                  ? 'task-completed'
                  : ''
              )
            }
          >


            <button
              className="task-button"
              onClick={() =>
                setConfirmando(
                  confirmando?.id === tarea.id
                    ? null
                    : tarea
                )
              }
            >

              <strong>
                {tarea.proyecto.nombre}
              </strong>


              <span>
                {tarea.texto}
              </span>


              {diasEntrega(
                tarea.proyecto.fechaEntrega
              ) !== null && (

                <small>
                  📅 Entrega en {diasEntrega(
                    tarea.proyecto.fechaEntrega
                  )} días
                </small>

              )}


            </button>



            {confirmando?.id === tarea.id && (

              <div className="task-confirm-inline">


                <p>
                  ¿Dar por finalizada esta tarea?
                </p>


                <div className="task-confirm-actions">


                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setConfirmando(null)
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      completar(tarea)
                    }
                  >
                    ✓ Completar
                  </button>


                </div>


              </div>

            )}


          </div>

        ))}


      </div>

    </div>

  )

}
