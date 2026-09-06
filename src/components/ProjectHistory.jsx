import { t as translateUI, getLocale } from '../i18n.js'
export default function ProjectHistory({
  proyecto,
  onDeleteHistory
}) {

  const historial = proyecto.historial || []

  return (

    <div>

      <div className="section-label">{translateUI("Historial")}</div>


      {historial.length === 0 && (

        <p className="mono">{translateUI("Todavía no hay actividad registrada.")}</p>

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
                  .toLocaleDateString(getLocale())}
              </small>
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={() => onDeleteHistory?.(evento.id)}
            >
              ✕
            </button>

          </div>

        ))}

    </div>

  )
}
