import { useState } from 'react'
import { uid } from '../storage.js'

export default function TasksModal({
  proyecto,
  onSave,
  onClose,
  guardando = false,
}) {
  const [tareas, setTareas] = useState(
    Array.isArray(proyecto.tareas)
      ? proyecto.tareas.map((t) => ({ ...t }))
      : []
  )

  const [nuevaTarea, setNuevaTarea] = useState('')

  function agregarTarea() {
    const texto = nuevaTarea.trim()
    if (!texto) return

    setTareas((prev) => [
      ...prev,
      {
        id: uid(),
        texto,
        hecha: false,
      },
    ])

    setNuevaTarea('')
  }

  function alternarTarea(id) {
    setTareas((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, hecha: !t.hecha }
          : t
      )
    )
  }

  function editarTarea(id, texto) {
    setTareas((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, texto }
          : t
      )
    )
  }

  function borrarTarea(id) {
    setTareas((prev) =>
      prev.filter((t) => t.id !== id)
    )
  }

  function guardar() {
    onSave(proyecto.id, tareas)
  }

  const pendientes = tareas.filter((t) => !t.hecha).length

  return (
    <div
      className="overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="modal tasks-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">Tareas</p>
            <h2 className="serif">
              {proyecto.nombre || 'Proyecto'}
            </h2>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="tasks-modal-summary">
          {pendientes === 0
            ? 'Todas las tareas están completadas'
            : `${pendientes} tarea${pendientes !== 1 ? 's' : ''} pendiente${pendientes !== 1 ? 's' : ''}`}
        </div>

        <div className="tasks-modal-list">
          {tareas.length === 0 && (
            <p className="tasks-empty">
              Todavía no hay tareas en este proyecto.
            </p>
          )}

          {tareas.map((tarea) => (
            <div
              className={
                'task-edit-row' +
                (tarea.hecha ? ' task-done' : '')
              }
              key={tarea.id}
            >
              <input
                type="checkbox"
                checked={tarea.hecha}
                onChange={() => alternarTarea(tarea.id)}
                aria-label={
                  tarea.hecha
                    ? 'Marcar como pendiente'
                    : 'Marcar como completada'
                }
              />

              <input
                type="text"
                value={tarea.texto}
                onChange={(e) =>
                  editarTarea(tarea.id, e.target.value)
                }
                className="task-text-input"
              />

              <button
                type="button"
                className="icon-btn"
                onClick={() => borrarTarea(tarea.id)}
                aria-label="Eliminar tarea"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="task-add-row">
          <input
            type="text"
            value={nuevaTarea}
            placeholder="Añadir nueva tarea"
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarTarea()
              }
            }}
          />

          <button
            type="button"
            className="btn btn-sm"
            onClick={agregarTarea}
          >
            Añadir
          </button>
        </div>

        <div className="modal-actions">
          <div />

          <div className="right">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={guardar}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
