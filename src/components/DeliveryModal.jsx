import { t as translateUI, formatRelativeDays } from '../i18n.js'
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
          <h2 className="serif">{translateUI("Entrega")}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={translateUI("Cerrar")}
          >
            ✕
          </button>
        </div>

        <div className="delivery-modal-field">
          <label htmlFor="delivery-project-name">{translateUI("Proyecto")}</label>
          <input
            id="delivery-project-name"
            type="text"
            value={datos.nombre}
            onChange={(event) => cambiarDato('nombre', event.target.value)}
          />
        </div>

        <div className="delivery-modal-details">
          <div>
            <label htmlFor="delivery-client">{translateUI("Cliente")}</label>
            <input
              id="delivery-client"
              type="text"
              value={datos.cliente}
              placeholder={translateUI("Sin cliente asignado")}
              onChange={(event) => cambiarDato('cliente', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="delivery-date">{translateUI("Fecha de entrega")}</label>
            <input
              id="delivery-date"
              type="date"
              value={datos.fechaEntrega}
              onChange={(event) => cambiarDato('fechaEntrega', event.target.value)}
            />
          </div>
          <div>
            <span>{translateUI("Tiempo restante")}</span>
            <strong>
              {dias === null
                ? translateUI("Sin fecha")
                : formatRelativeDays(dias)}
            </strong>
          </div>
          <div>
            <label htmlFor="delivery-phase">{translateUI("Fase")}</label>
            <select
              id="delivery-phase"
              value={datos.fase}
              onChange={(event) => cambiarDato('fase', event.target.value)}
            >
              {FASES.map((fase) => (
                <option key={fase} value={fase}>{translateUI(fase)}</option>
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
            {guardando ? translateUI("Guardando...") : translateUI("Guardar cambios")}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onOpenProject(proyecto)}
          >{translateUI("Abrir proyecto")}</button>
        </div>
        </fieldset>
      </div>
    </div>
  )
}
