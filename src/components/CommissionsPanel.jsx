import { useRef, useState } from 'react'
import ProjectModal from './ProjectModal.jsx'
import { supabase } from '../supabase.js'
import { t, getLocale } from '../i18n.js'

export default function CommissionsPanel({ proyectos, usuario, modulos, onSaved }) {
  const [selected, setSelected] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const money = amount => amount.toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })
  const amount = item => Number(item.presupuesto || 0) * Number(item.porcentaje || 0) / 100
  const rows = proyectos.filter(p => !selected || p.id === selected)
    .flatMap(project => (project.comisiones || []).map(item => ({ project, item })))
  async function save(project) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      // Actualiza solo comisiones, sin sobrescribir otros cambios del proyecto.
      const comisiones = project.comisiones.map(item => ({ ...item, presupuestoPdf: item.presupuestoPdfPath ? '' : item.presupuestoPdf || '' }))
      const { error } = await supabase.from('proyectos').update({ comisiones })
        .eq('id', project.id).eq('user_id', usuario.id).select('id').single()
      if (error) throw error
      onSaved(project)
      setEditing(null)
    } catch { setError(t('No se pudieron guardar las comisiones. Inténtalo de nuevo.')) }
    finally { lock.current = false; setBusy(false) }
  }
  return <section aria-label={t('Comisiones')}>
    <div className="daily-actions"><label>{t('Proyecto')} <select value={selected} onChange={e => setSelected(e.target.value)}>
      <option value="">{t('Todos')}</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select></label><button className="btn" disabled={!selected || busy} onClick={() => setEditing(proyectos.find(p => p.id === selected))}>{t('Gestionar comisiones')}</button></div>
    {!selected && <p>{t('Selecciona un proyecto para añadir o gestionar sus comisiones.')}</p>}
    <div className="daily-stats">
      {['Generadas', 'Cobradas', 'Pendientes'].map((label, index) => <div className="daily-stat" key={label}><span>{t(label)}</span><strong>{money(rows.filter(({ item }) => index === 0 || (index === 1 ? item.estado === 'cobrada' : item.estado !== 'cobrada')).reduce((sum, { item }) => sum + amount(item), 0))}</strong></div>)}
    </div>
    {rows.map(({ project, item }) => <article className="commission-card" key={`${project.id}-${item.id}`}>
      <div className="commission-card-head"><strong>{item.colaborador} · {item.concepto}</strong><span className={'commission-status ' + (item.estado === 'cobrada' ? 'is-paid' : 'is-pending')}>{t(item.estado === 'cobrada' ? 'Cobrada' : 'Pendiente')}</span></div>
      <p>{project.nombre} · {money(amount(item))}</p>
      <button className="chip" onClick={() => setEditing(project)}>{t('Editar')}</button>
    </article>)}
    {!rows.length && <p>{t('No hay comisiones en esta vista.')}</p>}
    {error && !editing && <p role="alert">{error}</p>}
    {editing && <><ProjectModal commissionsOnly saveError={error} proyecto={editing} usuario={usuario} modulos={modulos} guardando={busy} onSave={save} onClose={() => !lock.current && setEditing(null)} />
</>}
  </section>
}
