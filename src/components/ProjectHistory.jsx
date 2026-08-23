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
