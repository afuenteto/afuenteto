export default function TasksPanel({
  proyectos,
  onClose,
  onOpenTasks,
  onCompleteTask
}) {

  const tareas=[]


  proyectos.forEach((p)=>{

    ;(p.tareas || []).forEach((t)=>{

      if(!t.hecha){

        tareas.push({
          ...t,
          proyecto:p
        })

      }

    })

  })


  return (

    <div className="panel-overlay">

      <div className="panel">


        <div className="panel-head">

          <h2 className="serif">
            🔴 Tareas pendientes
          </h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>


        {tareas.map((t)=>(

          <button
            key={t.id}
            className="panel-item"
            onClick={() =>
              onOpenTasks(t.proyecto)
            }
          >

            <strong>
              {t.proyecto.nombre}
            </strong>

            <span>
              {t.texto}
            </span>


          </button>

        ))}


      </div>

    </div>

  )

}
