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
        setConfirmando(
          confirmando?.id === t.id
            ? null
            : t
        )
      }
    >

      <strong>
        {t.proyecto.nombre}
      </strong>

      <span>
        {t.texto}
      </span>

    </button>


    {confirmando?.id === t.id && (

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
              completar(t)
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
