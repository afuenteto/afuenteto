import { t as translateUI, getLocale } from '../i18n.js'
import { useState } from 'react'
import { diasHasta } from '../storage.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'


export default function StudioDashboard({
  proyectos = [],
  clientes = [],
  onOpenTasks,
  onOpenDeliveries,
  onOpenPayments,
  onFilterPhase,
  onShowAll,
  modulos = MODULOS_PREDETERMINADOS
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


  const resumenComisiones = proyectos.reduce(
    (acc, p) => {
      const comisiones = Array.isArray(p.comisiones) ? p.comisiones : []

      comisiones.forEach((comision) => {
        const importe =
          Number(comision.presupuesto || 0) *
          Number(comision.porcentaje || 0) / 100

        acc.generadas += importe

        if (comision.estado === 'cobrada') {
          acc.cobradas += importe
        } else {
          acc.pendientes += importe
        }
      })

      return acc
    },
    { generadas: 0, cobradas: 0, pendientes: 0 }
  )


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
      >{translateUI("Resumen del estudio")}<span style={{float:'right'}}>
          {mostrarResumen ? '−' : '+'}
        </span>

      </h3>



      {mostrarResumen && (

      <>


      <div className="dashboard-grid">


        {modulos.economia && <>
        <div className="field">
          <label>{translateUI("Valor contratado")}</label>

          <input
            readOnly
            value={`${valorTotal.toLocaleString(getLocale())} €`}
          />
        </div>


        <div className="field">
          <label>{translateUI("Total cobrado")}</label>

          <input
            readOnly
            value={`${cobradoTotal.toLocaleString(getLocale())} €`}
          />
        </div>


        <div className="field">
          <label>{translateUI("Pendiente de cobro")}</label>

          <input
            readOnly
            value={`${pendienteTotal.toLocaleString(getLocale())} €`}
          />
        </div>
        </>}


        <div className="field">
          <label>{translateUI("Proyectos activos")}</label>

          <input
            readOnly
            value={proyectos.length}
          />
        </div>


        {modulos.clientes && <div className="field">
          <label>{translateUI("Clientes registrados")}</label>

          <input
            readOnly
            value={clientes.length}
          />
        </div>}

        {modulos.economia && <>
        <div className="field">
          <label>{translateUI("Comisiones generadas")}</label>
          <input
            readOnly
            value={`${resumenComisiones.generadas.toLocaleString(getLocale())} €`}
          />
        </div>

        <div className="field">
          <label>{translateUI("Comisiones cobradas")}</label>
          <input
            readOnly
            value={`${resumenComisiones.cobradas.toLocaleString(getLocale())} €`}
          />
        </div>

        <div className="field">
          <label>{translateUI("Comisiones pendientes")}</label>
          <input
            readOnly
            value={`${resumenComisiones.pendientes.toLocaleString(getLocale())} €`}
          />
        </div>
        </>}


      </div>



      {(modulos.tareas || modulos.entregas || modulos.economia) && <>
      <div className="section-label dashboard-section-heading">{translateUI("⚠️ Atención")}</div>



      <div className="dashboard-grid">


        {modulos.tareas && <div
          className="field dashboard-action attention-task"
          onClick={onOpenTasks}
        >

          <label>{translateUI("🔴 Tareas pendientes")}</label>

          <input
            readOnly
            value={tareasPendientes}
          />

        </div>}



        {modulos.entregas && <div
          className="field dashboard-action attention-delivery"
          onClick={onOpenDeliveries}
        >

          <label>{translateUI("📅 Entregas previstas")}</label>

          <input
            readOnly
            value={entregasProximas}
          />

        </div>}



        {modulos.economia && <div
          className="field dashboard-action attention-payment"
          onClick={onOpenPayments}
        >

          <label>{translateUI("💰 Cobros pendientes")}</label>

          <input
            readOnly
            value={cobrosPendientes}
          />

        </div>}


      </div>
      </>}




      <div className="section-label dashboard-section-heading">{translateUI("Proyectos por fase")}</div>




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
                {translateUI(fase)}
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

        <label>{translateUI("Ver todos los proyectos")}</label>

        <input
          readOnly
          value={translateUI("Todos")}
        />

      </div>

      </>

      )}



    </div>

  )

}
