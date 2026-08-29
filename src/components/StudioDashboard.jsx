import { useState } from 'react'
import { diasHasta } from '../storage.js'


export default function StudioDashboard({
  proyectos = [],
  clientes = [],
  onOpenTasks,
  onOpenDeliveries,
  onOpenPayments,
  onFilterPhase,
  onShowAll
}) {

  const [mostrarResumen, setMostrarResumen] = useState(false)


  const valorTotal = proyectos.reduce(
    (total, p) => {

      const valor =
        p.presupuestoTotal &&
        Number(p.presupuestoTotal) > 0
          ? Number(p.presupuestoTotal)
          : Number(p.honorariosDiseno || 0) +
            Number(p.honorariosGestion || 0) +
            Number(p.otrosImportes || 0)

      return total + valor

    }, 0
  )


  const cobradoTotal = proyectos.reduce(
    (total, p) =>
      total +
      (p.cobros || [])
        .filter(c => c.estado !== 'previsto')
        .reduce(
          (s, c) => s + Number(c.importe || 0),
          0
        ),
    0
  )


  const pendienteTotal =
    valorTotal - cobradoTotal


  const tareasPendientes =
    proyectos.reduce(
      (total, p) =>
        total +
        (p.tareas || [])
          .filter(t => !t.hecha)
          .length,
      0
    )


  const entregasProximas =
    proyectos.filter(
      p => diasHasta(p.fechaEntrega) !== null
    ).length


  const cobrosPendientes =
    proyectos.reduce(
      (total, p) =>
        total +
        (p.cobros || [])
          .filter(c => c.estado === 'previsto')
          .length,
      0
    )


  const proyectosPorFase =
    proyectos.reduce((acc, p) => {

      const fase = p.fase || 'Sin fase'

      acc[fase] = (acc[fase] || 0) + 1

      return acc

    }, {})



  return (

    <div className="studio-dashboard">


      <h3
        className="serif dashboard-toggle"
        onClick={() =>
          setMostrarResumen(!mostrarResumen)
        }
        style={{cursor:'pointer'}}
      >

        Resumen del estudio

        <span style={{float:'right'}}>
          {mostrarResumen ? '−' : '+'}
        </span>

      </h3>



      {mostrarResumen && (

      <>


      <div className="dashboard-grid">


        <div className="field">
          <label>
            Valor contratado
          </label>

          <input
            readOnly
            value={`${valorTotal.toLocaleString('es-ES')} €`}
          />
        </div>


        <div className="field">
          <label>
            Total cobrado
          </label>

          <input
            readOnly
            value={`${cobradoTotal.toLocaleString('es-ES')} €`}
          />
        </div>


        <div className="field">
          <label>
            Pendiente de cobro
          </label>

          <input
            readOnly
            value={`${pendienteTotal.toLocaleString('es-ES')} €`}
          />
        </div>


        <div className="field">
          <label>
            Proyectos activos
          </label>

          <input
            readOnly
            value={proyectos.length}
          />
        </div>


        <div className="field">
          <label>
            Clientes registrados
          </label>

          <input
            readOnly
            value={clientes.length}
          />
        </div>


      </div>



      <div className="section-label">
        ⚠️ Atención
      </div>



      <div className="dashboard-grid">


        <div
          className="field dashboard-action attention-task"
          onClick={onOpenTasks}
        >

          <label>
            🔴 Tareas pendientes
          </label>

          <input
            readOnly
            value={tareasPendientes}
          />

        </div>



        <div
          className="field dashboard-action attention-delivery"
          onClick={onOpenDeliveries}
        >

          <label>
            📅 Entregas previstas
          </label>

          <input
            readOnly
            value={entregasProximas}
          />

        </div>



        <div
          className="field dashboard-action attention-payment"
          onClick={onOpenPayments}
        >

          <label>
            💰 Cobros pendientes
          </label>

          <input
            readOnly
            value={cobrosPendientes}
          />

        </div>


      </div>




      <div className="section-label">
        Proyectos por fase
      </div>




      <div className="dashboard-grid">


        {
          Object.entries(proyectosPorFase)
          .map(([fase,cantidad]) => (

            <div
              key={fase}
              className="field dashboard-action"
              onClick={() => onFilterPhase(fase)}
            >

              <label>
                {fase}
              </label>

              <input
                readOnly
                value={cantidad}
              />

            </div>

          ))
        }


      </div>



      <div
        className="field dashboard-action"
        onClick={onShowAll}
      >

        <label>
          Ver todos los proyectos
        </label>

        <input
          readOnly
          value="Todos"
        />

      </div>


      </>

      )}


    </div>

  )

}