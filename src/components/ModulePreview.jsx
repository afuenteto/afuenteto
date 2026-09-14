import { useEffect, useMemo, useState } from 'react'
import { t } from '../i18n.js'
import { fechaLocal } from '../projectUtils.js'
import { buildAgenda } from '../todayModel.js'

const paths = {
  tareas: 'M9 11l2 2 4-4 M9 4H5v16h14V4h-4 M9 3h6v4H9z',
  entregas: 'M4 5h16v15H4z M4 10h16 M8 3v4 M16 3v4',
  cobros: 'M12 3v18 M17 6H9a3 3 0 000 6h6a3 3 0 010 6H6',
  bloqueados: 'M7 10V7a5 5 0 0110 0v3 M5 10h14v11H5z',
}

export default function ModulePreview({ proyectos, modulos, onOpenTasks, onOpenDelivery, setPanelAbierto }) {
  const [today, setToday] = useState(fechaLocal)
  useEffect(() => {
    const refresh = () => setToday(fechaLocal())
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const agenda = useMemo(() => buildAgenda(proyectos, modulos, today), [proyectos, modulos, today])
  const tasks = agenda.filter(item => item.type === 'task' && ((item.days !== null && item.days <= 0) || item.task.prioridad === 'alta'))
  const deliveries = agenda.filter(item => item.type === 'delivery' && item.days <= 7)
  const payments = modulos.economia ? proyectos.flatMap(p => (p.cobros || []).filter(c => c.estado === 'previsto')) : []
  const blocked = proyectos.filter(p => p.prioridad === 'bloqueado')
  const actions = [
    ['tareas', 'Tareas', tasks.length, () => tasks.length === 1 ? onOpenTasks(tasks[0].project) : setPanelAbierto('tareas')],
    ['entregas', 'Entregas', deliveries.length, () => deliveries.length === 1 ? onOpenDelivery(deliveries[0].project) : setPanelAbierto('entregas')],
    ['cobros', 'Cobros pendientes', payments.length, () => setPanelAbierto('cobros')],
    ['bloqueados', 'Proyectos bloqueados', blocked.length, () => setPanelAbierto('bloqueados')],
  ].filter(([, , count]) => count > 0)
  if (!actions.length) return null
  return <div className="module-quick-actions">{actions.map(([id, label, count, onClick]) =>
    <button type="button" key={id} className="module-quick-action" onClick={onClick} title={`${t(label)}: ${count}`} aria-label={`${t(label)}: ${count}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id]} /></svg>
      <span>{count}</span>
    </button>)}</div>
}
