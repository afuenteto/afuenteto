import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

function formatDate(value) {
  if (!value) return 'Sin actividad'
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

export default function DemoAnalyticsPanel({ onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.functions.invoke('get-demo-analytics')
      .then(({ data: result, error: requestError }) => {
        if (!active) return
        if (requestError) setError(requestError.message)
        else setData(result)
        setLoading(false)
      })
      .catch(requestError => {
        if (active) { setError(requestError.message); setLoading(false) }
      })
    return () => { active = false }
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
                <td>{invitation.estado}</td>
                <td>{invitation.accessCount}</td>
                <td>{formatDate(invitation.lastAccess)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
      </section>
    </div>
  )
}
