import { useEffect, useMemo, useState } from 'react'
import CommissionModal from './CommissionModal.jsx'
import { supabase } from '../supabase.js'
import { collaboratorOptions, commissionAmount, saveCommission } from '../commissions.js'
import { t, getLocale } from '../i18n.js'

export default function CommissionsPanel({ proyectos, usuario, modulos, onSaved }) {
  const [selected, setSelected] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [supplierError, setSupplierError] = useState(false)
  useEffect(() => {
    let active = true
    setSuppliers([])
    if (!modulos.proveedores) return
    supabase.from('proveedores').select('*').eq('user_id', usuario.id).then(({ data, error }) => {
      if (active) { setSuppliers(data || []); setSupplierError(Boolean(error)) }
    }).catch(() => { if (active) setSupplierError(true) })
    return () => { active = false }
  }, [usuario.id, modulos.proveedores, editing?.item.id])
  const collaborators = useMemo(() => collaboratorOptions(proyectos, suppliers), [proyectos, suppliers])
  const money = amount => amount.toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })
  const rows = proyectos.filter(p => !selected || p.id === selected).flatMap(project => (project.comisiones || []).map(item => ({ project, item })))
  const visible = rows.filter(({ item }) => filter === 'all' || (filter === 'paid' ? item.estado === 'cobrada' : item.estado !== 'cobrada'))
  function open(project, item) {
    setEditing({ projectId: project?.id || selected, item: item ? { ...item, existing: true, importe: commissionAmount(item).toFixed(2), calculo: item.calculo || 'porcentaje' } : {
      id: crypto.randomUUID(), colaborador: '', concepto: '', presupuesto: '', porcentaje: '', importe: '', calculo: 'porcentaje', estado: 'pendiente', fecha: '', fechaCobro: '',
    } })
  }
  async function save(projectId, item, remove = false) {
    const { existing, ...draft } = item
    const result = await saveCommission(usuario.id, projectId, draft, supabase, remove)
    // Conserva las URL firmadas de las demás comisiones para esta sesión.
    const current = proyectos.find(p => p.id === projectId)
    onSaved({ ...result, comisiones: result.comisiones.map(c => {
      const old = current?.comisiones.find(previous => previous.id === c.id)
      return c.id !== draft.id && c.presupuestoPdfPath && old?.presupuestoPdfPath === c.presupuestoPdfPath ? { ...c, presupuestoPdf: old.presupuestoPdf } : c
    }) })
    setEditing(null)
  }
  return <section className="studio-today daily-agenda commissions-agenda" aria-label={t('Comisiones')}>
    <header className="daily-header"><label>{t('Proyecto')} <select value={selected} onChange={e => setSelected(e.target.value)}><option value="">{t('Todos')}</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
      <button type="button" className="daily-add" title={t('Añadir comisión')} aria-label={t('Añadir comisión')} disabled={!proyectos.length} onClick={() => open(null, null)}>+</button></header>
    <div className="daily-stats">{[['all', 'Generadas'], ['paid', 'Cobradas'], ['pending', 'Pendientes']].map(([key, label]) => <button type="button" className="daily-stat" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}><strong>{money(rows.filter(({ item }) => key === 'all' || (key === 'paid' ? item.estado === 'cobrada' : item.estado !== 'cobrada')).reduce((sum, { item }) => sum + commissionAmount(item), 0))}</strong><span>{t(label)}</span></button>)}</div>
    <div className="daily-filters">{[['all', 'Todas'], ['pending', 'Pendientes'], ['paid', 'Cobradas']].map(([key, label]) => <button type="button" className="chip" aria-pressed={filter === key} key={key} onClick={() => setFilter(key)}>{t(label)}</button>)}</div>
    {supplierError && <p className="daily-hint" role="status">{t('No se pudieron cargar los proveedores. Puedes elegir colaboradores de comisiones anteriores o escribir uno nuevo.')}</p>}
    <div className="daily-list">{visible.map(({ project, item }) => <article className={'daily-row ' + (item.estado === 'cobrada' ? 'commission-paid' : 'commission-pending')} key={`${project.id}-${item.id}`}>
      <div className="daily-when"><strong>{money(commissionAmount(item))}</strong><span>{item.porcentaje}%</span></div>
      <button type="button" className="daily-main" onClick={() => open(project, item)}><span className="daily-kind">{t(item.estado === 'cobrada' ? 'Cobrada' : 'Pendiente')}</span><strong>{item.colaborador}</strong><span>{item.concepto} · {project.nombre}</span></button>
      <div className="daily-actions"><button type="button" className="chip" onClick={() => open(project, item)}>{t('Editar')}</button></div>
    </article>)}{!visible.length && <p className="daily-empty">{t('No hay comisiones en esta vista.')}</p>}</div>
    {editing && <CommissionModal initial={editing.item} projectId={editing.projectId} projects={proyectos} collaborators={collaborators} usuario={usuario} modulos={modulos} onSave={save} onClose={() => setEditing(null)} />}
  </section>
}
