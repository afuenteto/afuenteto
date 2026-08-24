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
