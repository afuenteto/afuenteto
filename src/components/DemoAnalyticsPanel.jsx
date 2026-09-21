import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

function formatDate(value) {
  if (!value) return 'Sin actividad'
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const minutes = Math.floor(total / 60)
  const remaining = total % 60
  return minutes ? `${minutes} min ${remaining} s` : `${remaining} s`
}

const moduleNames = {
  today: 'Hoy en el estudio',
  appointments: 'Citas',
  projects: 'Proyectos',
  debts: 'Deudas',
  economy: 'Economía',
  summary: 'Resumen',
  suppliers: 'Proveedores',
  commissions: 'Comisiones',
  documents: 'Documentos',
  tasks: 'Tareas',
  delivery: 'Entregas',
  'Hoy en el estudio': 'Hoy en el estudio',
  'The app': 'La app',
}

function sessionDuration(session) {
  const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
  const start = new Date(session.started_at).getTime()
  return Math.max(Number(session.duration_seconds) || 0, Math.round((end - start) / 1000))
}

export default function DemoAnalyticsPanel({ onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [, refreshDuration] = useState(Date.now())

  useEffect(() => {
    let active = true
    async function loadAnalytics() {
      const { data: result, error: requestError } = await supabase.functions.invoke('get-demo-analytics')
      if (!active) return
      if (requestError) setError(requestError.message)
      else { setData(result); setError('') }
      setLoading(false)
    }
    loadAnalytics()
    const timer = setInterval(loadAnalytics, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => refreshDuration(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal demo-analytics-modal" role="dialog" aria-modal="true" aria-labelledby="demo-analytics-title">
        <div className="modal-head">
          <h2 id="demo-analytics-title" className="serif">Analítica de invitados</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {loading && <p>Cargando datos…</p>}
        {error && <p role="alert">{error}</p>}
        {data && <>
          <div className="demo-analytics-summary">
            <div><strong>{data.invitations.length}</strong><span>Invitados</span></div>
            <div><strong>{data.access.length}</strong><span>Accesos registrados</span></div>
            <div><strong>{data.usage.length}</strong><span>Eventos de uso</span></div>
          </div>
          <div className="demo-analytics-table-wrap">
            <table className="demo-analytics-table">
              <thead><tr><th>Profesional</th><th>Estado</th><th>Accesos</th><th>Último acceso</th></tr></thead>
              <tbody>{data.invitations.map(invitation => <tr key={invitation.id}>
                <td><strong>{invitation.nombre || 'Sin nombre'}</strong><small>{invitation.email}</small></td>
                <td><span className={`analytics-status-dot ${invitation.estado === 'activa' ? 'is-active' : 'is-closed'}`} aria-hidden="true" />{invitation.estado}</td>
                <td>{invitation.accessCount}</td>
                <td>{formatDate(invitation.lastAccess)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <h3 className="demo-analytics-heading">Sesiones y módulos utilizados</h3>
          <div className="demo-analytics-table-wrap">
            <table className="demo-analytics-table">
              <thead><tr><th>Sesión</th><th>Inicio</th><th>Duración</th><th>Estado</th><th>Módulos</th></tr></thead>
              <tbody>{(data.sessions || []).map(session => <tr key={session.id}>
                <td>{data.invitations.find(item => item.user_id === session.user_id)?.email || session.user_id}</td>
                <td>{formatDate(session.started_at)}</td>
                <td>{formatDuration(sessionDuration(session))}{!session.ended_at && ' (activa)'}</td>
                <td><span className={`analytics-status-dot ${session.ended_at ? 'is-closed' : 'is-active'}`} aria-label={session.ended_at ? 'Cerrada' : 'Activa'} /></td>
                <td>{Object.entries((data.usage || []).filter(event => event.session_id === session.id && event.module).reduce((counts, event) => { const name = moduleNames[event.module] || event.module; counts[name] = (counts[name] || 0) + 1; return counts }, {})).map(([name, count]) => `${name} (${count})`).join(', ') || 'Sin módulos registrados'}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
      </section>
    </div>
  )
}
