import PhaseRail from './PhaseRail.jsx'
import { diasHasta, formatearFecha } from '../storage.js'

export default function ProjectCard({ proyecto, onOpen }) {
  const tareasPendientes = proyecto.tareas.filter((t) => !t.hecha).length
  const total = parseFloat(proyecto.presupuestoTotal) || 0
  const gastado = parseFloat(proyecto.presupuestoGastado) || 0
  const pct = total > 0 ? Math.min(100, (gastado / total) * 100) : 0
  const sobrepasado = total > 0 && gastado > total

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

      {total > 0 && (
        <div>
          <div className="budget-bar">
            <div
              className={'budget-bar-fill' + (sobrepasado ? ' over' : '')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="card-stats" style={{ marginTop: 6 }}>
            <span className="mono">
              <strong>{gastado.toLocaleString('es-ES')} €</strong> de {total.toLocaleString('es-ES')} €
            </span>
            <span>{Math.round(pct)}%</span>
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
