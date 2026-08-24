export default function BlockedPanel({
  proyectos,
  onClose,
  onOpen
}) {


  const bloqueados =
    proyectos.filter(
      p => p.prioridad === 'bloqueado'
    )


  return (

    <div className="panel-overlay">

      <div className="panel">

        <div className="panel-head">

          <h2 className="serif">
            🔵 Proyectos bloqueados
          </h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>


        {bloqueados.map((p)=>(

          <button
            key={p.id}
            className="panel-item"
            onClick={() =>
              onOpen(p)
            }
          >

            <strong>
              {p.nombre}
            </strong>

            <span>
              {p.cliente}
            </span>

          </button>

        ))}


      </div>

    </div>

  )

}
