export default function ProjectHistory({ historial = [] }) {

  return (
    <div className="project-history">

      <div className="section-label">
        Historial
      </div>


      {historial.length === 0 && (
        <p className="history-empty">
          Todavía no hay actividad registrada.
        </p>
      )}


      {historial.map((evento) => (

        <div
          className="history-item"
          key={evento.id}
        >

          <div className="history-date">
            {evento.fecha}
          </div>

          <div className="history-text">
            {evento.texto}
          </div>

        </div>

      ))}

    </div>
  )
}
import { useState } from 'react'

export default function ProjectHistory({
  proyecto
}) {

  const historial =
    proyecto.historial || []


  return (

    <div>

      <div className="section-label">
        Historial
      </div>


      {historial.length === 0 && (

        <p className="mono">
          Todavía no hay actividad registrada.
        </p>

      )}


      {historial
        .slice()
        .reverse()
        .map((evento) => (

          <div
            className="history-row"
            key={evento.id}
          >

            <span className="history-icon">
              {evento.icono || '•'}
            </span>


            <div>

              <div>
                {evento.texto}
              </div>

              <small>
                {new Date(evento.fecha)
                  .toLocaleDateString('es-ES')}
              </small>

            </div>

          </div>

        ))}


    </div>

  )
}
