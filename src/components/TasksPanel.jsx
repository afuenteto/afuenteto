import { t as translateUI, formatRelativeDays } from '../i18n.js'
import { useState } from 'react'
import { diasHasta } from '../storage.js'

export default function TasksPanel({
  proyectos,
  onClose,
  onCompleteTask
}) {

  const [confirmando, setConfirmando] = useState(null)
  const [guardando, setGuardando] = useState(false)


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


  tareas.sort((a, b) =>
    (diasHasta(a.fecha || a.proyecto.fechaEntrega) ?? Infinity) -
    (diasHasta(b.fecha || b.proyecto.fechaEntrega) ?? Infinity))

  async function completar(tarea) {
    if (guardando) return
    setGuardando(true)
    try {
      if (await onCompleteTask(tarea.proyecto.id, tarea.id)) setConfirmando(null)
    } finally { setGuardando(false) }
  }

  const diasEntrega = diasHasta

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

          <h2 className="serif">{translateUI("🔴 Tareas pendientes")}</h2>


          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {tareas.length === 0 && (

          <p className="mono">{translateUI("No hay tareas pendientes.")}</p>

        )}



        {tareas.map((tarea) => (

          <div
            key={tarea.proyecto.id + ":" + tarea.id}
            className="panel-item"
          >


            <button
              className="task-button"
              onClick={() =>
                setConfirmando(
                  confirmando?.id === tarea.id && confirmando?.proyecto.id === tarea.proyecto.id
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

                <small>📅 {translateUI("Entrega")}: {formatRelativeDays(diasEntrega(
                    tarea.proyecto.fechaEntrega
                  ))}</small>

              )}


            </button>



            {confirmando?.id === tarea.id && confirmando?.proyecto.id === tarea.proyecto.id && (

              <div className="task-confirm-inline">


                <p>{translateUI("¿Dar por finalizada esta tarea?")}</p>


                <div className="task-confirm-actions">


                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setConfirmando(null)
                    }
                  >{translateUI("Cancelar")}</button>


                  <button
                    className="btn btn-primary"
                    disabled={guardando}
                    onClick={() =>
                      completar(tarea)
                    }
                  >{translateUI("✓ Completar")}</button>


                </div>


              </div>

            )}


          </div>

        ))}


      </div>

    </div>

  )

}
