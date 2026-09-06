import { t as translateUI, getLocale, formatRelativeDays } from '../i18n.js'
import PhaseRail from './PhaseRail.jsx'
import { diasHasta, formatearFecha } from '../storage.js'

export default function ProjectCard({ proyecto, onOpen, onOpenTasks, onOpenDelivery }) {
  const tareas = Array.isArray(proyecto.tareas) ? proyecto.tareas : []
  const tareasPendientes = tareas.filter((t) => !t.hecha).length

  const valorProyecto =
    proyecto.presupuestoTotal && Number(proyecto.presupuestoTotal) > 0
      ? Number(proyecto.presupuestoTotal)
      : Number(proyecto.honorariosDiseno || 0) +
        Number(proyecto.honorariosGestion || 0) +
        Number(proyecto.otrosImportes || 0)

  const totalCobrado =
    (proyecto.cobros || [])
      .filter((cobro) => cobro.estado !== 'previsto')
      .reduce(
        (total, cobro) => total + Number(cobro.importe || 0),
        0
      )

  const totalPrevisto =
    (proyecto.cobros || [])
      .filter((cobro) => cobro.estado === 'previsto')
      .reduce(
        (total, cobro) => total + Number(cobro.importe || 0),
        0
      )

  const pendienteCobro = valorProyecto - totalCobrado

  const comisiones = Array.isArray(proyecto.comisiones)
    ? proyecto.comisiones
    : []

  const importeComision = (comision) =>
    Number(comision.presupuesto || 0) * Number(comision.porcentaje || 0) / 100

  const totalComisiones = comisiones.reduce(
    (total, comision) => total + importeComision(comision),
    0
  )

  const comisionesCobradas = comisiones
    .filter((comision) => comision.estado === 'cobrada')
    .reduce((total, comision) => total + importeComision(comision), 0)

  const comisionesPrevistas = comisiones
    .filter((comision) => comision.estado === 'previsto')
    .reduce((total, comision) => total + importeComision(comision), 0)

  const comisionesPendientes = comisiones
    .filter((comision) => !['cobrada', 'previsto'].includes(comision.estado))
    .reduce((total, comision) => total + importeComision(comision), 0)

  const pct =
    valorProyecto > 0
      ? Math.min(100, (totalCobrado / valorProyecto) * 100)
      : 0

  const sobrepasado = totalCobrado > valorProyecto

  const dias = diasHasta(proyecto.fechaEntrega)
  const finalizado = proyecto.estado === 'finalizado'
  const tieneImagen = Boolean(proyecto.imagenProyecto)

  const urgente =
    !finalizado &&
    dias !== null &&
    dias <= 7 &&
    dias >= 0 &&
    proyecto.fase !== 'Entrega'

  const vencido =
    !finalizado &&
    dias !== null &&
    dias < 0 &&
    proyecto.fase !== 'Entrega'

  const coloresPrioridad = {
    urgente: '#c43d32',
    en_curso: '#ffd400',
    estable: '#4caf50',
    bloqueado: '#2196f3',
  }

  const colorPrioridad =
    coloresPrioridad[proyecto.prioridad || 'en_curso']

  return (
    <div
      className={
        'card' +
        (finalizado ? ' project-finalized-card' : '') +
        (tieneImagen ? ' has-project-image' : '')
      }
      style={{
        borderInlineStart: `5px solid ${colorPrioridad}`,
      }}
    >
      {tieneImagen && (
        <div className="card-cover-strip" aria-hidden="true">
          <img src={proyecto.imagenProyecto} alt="" />
          <span className="card-cover-shade" />
        </div>
      )}

      {finalizado && (
        <div className="finalized-watermark">{translateUI("FINALIZADO")}</div>
      )}

     <div className="card-head">
        <h3 className="serif">
          <button
            type="button"
            className="project-open-btn"
            onClick={onOpen}
          >
            {proyecto.nombre || translateUI("Sin nombre")}
          </button>
        </h3>

        {!finalizado && vencido && (
          <span className="tag-urgent">{translateUI("Entrega vencida")}</span>
        )}

{!finalizado && !vencido && urgente && (
  <button
    className="tag-urgent"
    aria-label={`${translateUI("Entrega")}: ${formatRelativeDays(dias)}`}
    onClick={(e) => {
      e.stopPropagation()
        onOpenDelivery(proyecto)
    }}
  >{translateUI("Entrega")}: &lt;{dias.toLocaleString(getLocale())} {translateUI("d")}</button>
)}
      </div>

      <p className={tieneImagen ? "card-client card-client-image" : "card-client"}>
  {proyecto.cliente || translateUI("Sin cliente asignado")}
</p>

      <PhaseRail fase={proyecto.fase} />

      {valorProyecto > 0 && (
        <div>
          <div className="budget-bar">
            <div
              className={
                'budget-bar-fill' +
                (sobrepasado ? ' over' : '')
              }
              style={{ width: `${pct}%` }}
            />
          </div>

          <div
            className="card-stats"
            style={{ marginTop: 6 }}
          >
            <span className="mono">
              <strong>
                {totalCobrado.toLocaleString(getLocale())} €
              </strong>{' '}{translateUI("cobrados")}</span>

            <span>{translateUI("Pendiente:")}{' '}
              {pendienteCobro.toLocaleString(getLocale())} €
            </span>

            {totalPrevisto > 0 && (
              <span>{translateUI("Previsto:")}{' '}
                {totalPrevisto.toLocaleString(getLocale())} €
              </span>
            )}
          </div>

          <div className="mono" style={{ marginTop: 6 }}>{translateUI("Total proyecto:")}{' '}
            {valorProyecto.toLocaleString(getLocale())} €
          </div>
        </div>
      )}

      {comisiones.length > 0 && (
        <div className="card-finance-section">
          <div className="section-label">{translateUI("Comisiones")}</div>

          <div className="card-stats">
            <span>{translateUI("Total:")}{' '}
              <strong>{totalComisiones.toLocaleString(getLocale())} €</strong>
            </span>
            <span>{translateUI("Cobradas: ")}{comisionesCobradas.toLocaleString(getLocale())} €
            </span>
          </div>

          <div className="card-stats">
            <span>{translateUI("Pendiente: ")}{comisionesPendientes.toLocaleString(getLocale())} €
            </span>
            <span>{translateUI("Previsto: ")}{comisionesPrevistas.toLocaleString(getLocale())} €
            </span>
          </div>
        </div>
      )}

      <div className="card-footer">
        <span>{translateUI("Inicio: ")}{formatearFecha(proyecto.fechaInicio)}
        </span>

      {tareas.length > 0 && (
  <button
    type="button"
    className="tasks-open-btn"
    onClick={(e) => {
      e.stopPropagation()
      onOpenTasks(proyecto)
    }}
  >{translateUI("Tareas")}{tareasPendientes > 0
      ? translateUI(" · Tareas pendientes: {0}", { 0: tareasPendientes.toLocaleString(getLocale()) })
      : translateUI(" · completadas")}
  </button>
)}
      </div>
    </div>
  )
}
