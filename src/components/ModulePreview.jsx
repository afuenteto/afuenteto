import { useEffect, useMemo, useState } from 'react'
import { t, getLocale } from '../i18n.js'
import { fechaLocal } from '../projectUtils.js'
import { buildAgenda } from '../todayModel.js'
import { valorContratado } from '../projectFinance.js'
import { FASES } from '../projectModel.js'

export function PreviewStats({ items }) {
  return <span className="module-preview">{items.map(([label, value, alert]) =>
    <span className={'module-preview-stat' + (alert ? ' is-alert' : '')} key={label}>
      <strong>{value}</strong><span>{t(label)}</span>
    </span>)}</span>
}

export default function ModulePreview({ kind, proyectos, clientes, modulos }) {
  const [today, setToday] = useState(fechaLocal)
  useEffect(() => {
    if (kind !== 'today') return
    const refresh = () => setToday(fechaLocal())
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [kind])
  const agenda = useMemo(() => kind === 'today' || kind === 'summary' ? buildAgenda(proyectos, modulos, today) : [], [kind, proyectos, modulos, today])
  const money = value => value.toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })
  if (kind === 'today') {
    const overdue = agenda.filter(item => item.days !== null && item.days < 0).length
    return <span className="module-preview-wrap">
      <PreviewStats items={[
        ['Para hoy', agenda.filter(item => item.days === 0).length],
        ['Vencimientos pendientes', overdue, overdue > 0],
        ['Próximos 7 días', agenda.filter(item => item.days > 0 && item.days <= 7).length],
      ]} />
      {agenda.filter(item => item.days !== null).slice(0, 2).map(item => <span className="module-preview-event" key={item.id}>
        {item.days === 0 ? t('Para hoy') : new Date(item.date + 'T12:00:00').toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' })}
        {item.time ? ` · ${item.time}` : ''} · {item.title}{item.type === 'task' ? ` · ${item.project.nombre}` : ''}
      </span>)}
    </span>
  }
  if (kind === 'projects') return <PreviewStats items={[
    ['Proyectos activos', proyectos.length],
    ...FASES.map(phase => [phase, proyectos.filter(p => p.fase === phase).length]).filter(([, count]) => count > 0),
  ]} />
  if (kind === 'economy') {
    const total = proyectos.reduce((sum, p) => sum + valorContratado(p), 0)
    const paid = proyectos.reduce((sum, p) => sum + (p.cobros || []).filter(c => c.estado !== 'previsto').reduce((s, c) => s + Number(c.importe || 0), 0), 0)
    return <PreviewStats items={[
      ['Valor contratado', money(total)], ['Total cobrado', money(paid)], ['Pendiente de cobro', money(total - paid)],
    ]} />
  }
  return <PreviewStats items={[
    ...(modulos.tareas ? [['🔴 Tareas pendientes', agenda.filter(item => item.type === 'task').length]] : []),
    ...(modulos.entregas ? [['📅 Entregas previstas', agenda.filter(item => item.type === 'delivery').length]] : []),
    ...(modulos.clientes ? [['Clientes registrados', clientes.length]] : []),
    ['🔵 Proyectos bloqueados', proyectos.filter(p => p.prioridad === 'bloqueado').length],
  ]} />
}
