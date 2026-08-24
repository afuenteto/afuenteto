import { useState } from 'react'

export default function TasksPanel({
  proyectos,
  onClose,
  onOpenTasks,
  onCompleteTask
}) {

  const [confirmando, setConfirmando] = useState(null)
  const [completadas, setCompletadas] = useState([])


  const tareas = []

  proyectos.forEach((p) => {

    ;(p.tareas || []).forEach((t) => {

      if (!t.hecha) {

        tareas.push({
          ...t,
          proyecto: p
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

    <div className="panel-overlay">

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



        {tareas.map((t) => (

          <div
            key={t.id}
            className={
              'panel-item ' +
              (completadas.includes(t.id)
                ? 'task-completed'
                : '')
            }
          >

            <button
              className="task-button"
              onClick={() =>
                setConfirmando(t)
              }
            >

              <strong>
                {t.proyecto.nombre}
              </strong>

              <span>
                {t.texto}
              </span>

            </button>


          </div>

        ))}



        {confirmando && (

          <div className="task-confirm">

            <p>
              ¿Dar por finalizada esta tarea?
            </p>

            <strong>
              {confirmando.texto}
            </strong>


            <div>

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
                  completar(confirmando)
                }
              >
                ✓ Completar
              </button>

            </div>

          </div>

        )}


      </div>

    </div>

  )

}
