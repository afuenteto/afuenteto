import PhaseRail from './PhaseRail.jsx'
import { diasHasta, formatearFecha } from '../storage.js'

export default function ProjectCard({ proyecto, onOpen }) {
  const tareasPendientes = proyecto.tareas.filter((t) => !t.hecha).length

  const valorProyecto =
    proyecto.presupuestoTotal && Number(proyecto.presupuestoTotal) > 0
      ? Number(proyecto.presupuestoTotal)
      : Number(proyecto.honorariosDiseno || 0) +
        Number(proyecto.honorariosGestion || 0) +
        Number(proyecto.otrosImportes || 0)

  const totalCobrado =
  (proyecto.cobros || []).reduce(
    (total, cobro) =>
      cobro.estado === 'previsto'
        ? total
        : total + Number(cobro.importe || 0),
    0
  )

const totalPrevisto =
  (proyecto.cobros || []).reduce(
    (total, cobro) =>
      cobro.estado === 'previsto'
        ? total + Number(cobro.importe || 0)
        : total,
    0
  )

  const pendienteCobro = valorProyecto - totalCobrado

  const pct =
    valorProyecto > 0
      ? Math.min(100, (totalCobrado / valorProyecto) * 100)
      : 0

  const sobrepasado = totalCobrado > valorProyecto


  
  const dias = diasHasta(proyecto.fechaEntrega)
  const urgente = dias !== null && dias <= 7 && dias >= 0 && proyecto.fase !== 'Entrega'
  const vencido = dias !== null && dias < 0 && proyecto.fase !== 'Entrega'

  return (
    <button className="card" onClick={onOpen}>
      <div className="card-head">
        <div>
          <h3 className="serif">{proyecto.nombre || 'Sin nombre'}</h3>
          <p className="card-client">{proyecto.cliente || 'Sin cliente asignado'}</p>
        </div>
        {vencido && <span className="tag-urgent">Entrega vencida</span>}
        {!vencido && urgente && <span className="tag-urgent">Entrega en {dias}d</span>}
      </div>

      <PhaseRail fase={proyecto.fase} />

    {valorProyecto > 0 && (
  <div>
    <div className="budget-bar">
      <div
        className={'budget-bar-fill' + (sobrepasado ? ' over' : '')}
        style={{ width: `${pct}%` }}
      />
    </div>

    <div className="card-stats" style={{ marginTop: 6 }}>
      <span className="mono">
        <strong>{totalCobrado.toLocaleString('es-ES')} €</strong> cobrados
      </span>

      <span>
  Pendiente: {pendienteCobro.toLocaleString('es-ES')} €
</span>

<span>
  Previsto: {totalPrevisto.toLocaleString('es-ES')} €
</span>
    </div>
  </div>
)}

      <div className="card-footer">
        <span>Inicio: {formatearFecha(proyecto.fechaInicio)}</span>
        <span>
          {tareasPendientes} tarea{tareasPendientes !== 1 ? 's' : ''} pendiente
          {tareasPendientes !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  )
}
