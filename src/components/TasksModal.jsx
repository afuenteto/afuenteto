import { useState } from 'react'
import { uid } from '../storage.js'

export default function TasksModal({
  proyecto,
  onSave,
  onClose,
  guardando
}) {

  const [tareas, setTareas] = useState(
    proyecto.tareas || []
  )

  const [nuevaTarea, setNuevaTarea] = useState('')


function cambiarEstado(id) {

  setTareas((prev) =>
    prev.map((t) =>
      t.id === id
        ? {
            ...t,
            hecha: !t.hecha,
            fecha: t.fecha || '',
            prioridad: t.prioridad || 'normal'
          }
        : t
    )
  )

}


  function añadirTarea() {

    const texto = nuevaTarea.trim()

    if (!texto) return


    setTareas((prev) => [
      ...prev,
      {
        id: uid(),
        texto,
        hecha: false
      }
    ])

    setNuevaTarea('')

  }


  function borrarTarea(id) {

    setTareas((prev) =>
      prev.filter(
        (t) => t.id !== id
      )
    )

  }


  const pendientes =
    tareas.filter(
      (t) => !t.hecha
    )

  const terminadas =
    tareas.filter(
      (t) => t.hecha
    )


  return (

    <div
      className="overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >

      <div className="modal">


        <div className="modal-head">

          <h2 className="serif">
            Tareas
          </h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>


        <p className="mono">
          {proyecto.nombre}
        </p>


        <div className="section-label">
          Pendientes
        </div>


        {pendientes.map((t) => (

          <div
            className="list-row"
            key={t.id}
          >

            <input
              type="checkbox"
              checked={false}
              onChange={() =>
                cambiarEstado(t.id)
              }
            />


            <div>

  <span>
    {t.texto}
  </span>


  {(t.fecha || t.prioridad) && (

    <div className="task-info">

      {t.fecha && (
        <span>
          📅 {t.fecha}
        </span>
      )}

      {t.prioridad === 'alta' && (
        <span>
          🔴 Alta
        </span>
      )}

      {t.prioridad === 'normal' && (
        <span>
          🟡 Normal
        </span>
      )}

    </div>

  )}

</div>

            <button
              className="icon-btn"
              onClick={() =>
                borrarTarea(t.id)
              }
            >
              ✕
            </button>


          </div>

        ))}



       <div className="add-row">

  <input
    value={nuevaTarea}
    placeholder="Nueva tarea..."
    onChange={(e) =>
      setNuevaTarea(e.target.value)
    }
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        añadirTarea()
      }
    }}
  />

  <button
    className="btn btn-sm"
    onClick={añadirTarea}
  >
    Añadir
  </button>

</div>



        {terminadas.length > 0 && (

          <>

            <div className="section-label">
              Terminadas
            </div>


            {terminadas.map((t) => (

              <div
                className="list-row task-done"
                key={t.id}
              >

                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    cambiarEstado(t.id)
                  }
                />


                <span>
                  {t.texto}
                </span>


                <button
                  className="icon-btn"
                  onClick={() =>
                    borrarTarea(t.id)
                  }
                >
                  ✕
                </button>

              </div>

            ))}

          </>

        )}



        <div className="modal-actions">

          <button
            className="btn btn-primary"
            disabled={guardando}
            onClick={() =>
              onSave(
                proyecto.id,
                tareas
              )
            }
          >
            Guardar
          </button>

        </div>


      </div>

    </div>

  )
}
