import { useState } from 'react'
import { diasHasta, FASES } from '../storage.js'

export default function DeliveryModal({
  proyecto,
  onClose,
  onOpenProject,
  onSave,
  guardando = false
}) {
  const [datos, setDatos] = useState({
    nombre: proyecto.nombre || '',
    cliente: proyecto.cliente || '',
    fechaEntrega: proyecto.fechaEntrega || '',
    fase: proyecto.fase || FASES[0]
  })
  const dias = diasHasta(datos.fechaEntrega)

  function cambiarDato(campo, valor) {
    setDatos((actuales) => ({
      ...actuales,
      [campo]: valor
    }))
  }

  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal delivery-modal">
        <fieldset className="modal-fields" disabled={guardando}>
        <div className="modal-head">
          <h2 className="serif">Entrega</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="delivery-modal-field">
          <label htmlFor="delivery-project-name">Proyecto</label>
          <input
            id="delivery-project-name"
            type="text"
            value={datos.nombre}
            onChange={(event) => cambiarDato('nombre', event.target.value)}
          />
        </div>

        <div className="delivery-modal-details">
          <div>
            <label htmlFor="delivery-client">Cliente</label>
            <input
              id="delivery-client"
              type="text"
              value={datos.cliente}
              placeholder="Sin cliente asignado"
              onChange={(event) => cambiarDato('cliente', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="delivery-date">Fecha de entrega</label>
            <input
              id="delivery-date"
              type="date"
              value={datos.fechaEntrega}
              onChange={(event) => cambiarDato('fechaEntrega', event.target.value)}
            />
          </div>
          <div>
            <span>Tiempo restante</span>
            <strong>
              {dias === null
                ? 'Sin fecha'
                : dias < 0
                  ? `Vencida hace ${Math.abs(dias)} días`
                  : dias === 0
                    ? 'Es hoy'
                    : `Quedan ${dias} días`}
            </strong>
          </div>
          <div>
            <label htmlFor="delivery-phase">Fase</label>
            <select
              id="delivery-phase"
              value={datos.fase}
              onChange={(event) => cambiarDato('fase', event.target.value)}
            >
              {FASES.map((fase) => (
                <option key={fase} value={fase}>{fase}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={guardando}
            onClick={() => onSave({ ...proyecto, ...datos })}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onOpenProject(proyecto)}
          >
            Abrir proyecto
          </button>
        </div>
        </fieldset>
      </div>
    </div>
  )
}
