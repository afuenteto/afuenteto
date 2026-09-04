export default function BlockedPanel({
  proyectos,
  onClose,
  onOpen
}) {


  const bloqueados =
    proyectos.filter(
      (proyecto) =>
        proyecto.prioridad === 'bloqueado'
    )


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



        {bloqueados.length === 0 && (

          <p className="mono">
            No hay proyectos bloqueados.
          </p>

        )}



        {bloqueados.map((proyecto) => (

          <button
            key={proyecto.id}
            className="panel-item"
            onClick={() =>
              onOpen(proyecto)
            }
          >

            <strong>
              {proyecto.nombre}
            </strong>


            <span>
              Cliente: {proyecto.cliente || 'Sin cliente'}
            </span>


            <span>
              🔵 Proyecto bloqueado
            </span>


            {proyecto.notas && (

              <span>
                {proyecto.notas}
              </span>

            )}


          </button>

        ))}


      </div>

    </div>

  )

}
