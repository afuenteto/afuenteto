import { t as translateUI } from '../i18n.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'
export default function BlockedPanel({
  proyectos,
  onClose,
  onOpen,
  modulos = MODULOS_PREDETERMINADOS
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

          <h2 className="serif">{translateUI("🔵 Proyectos bloqueados")}</h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {bloqueados.length === 0 && (

          <p className="mono">{translateUI("No hay proyectos bloqueados.")}</p>

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


            {modulos.clientes && <span>{translateUI("Cliente: ")}{proyecto.cliente || translateUI("Sin cliente")}
            </span>}


            <span>{translateUI("🔵 Proyecto bloqueado")}</span>


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
