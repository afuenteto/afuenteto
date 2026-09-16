import LineIcon from './LineIcon.jsx'
import { useEffect, useMemo, useState } from 'react'
import { t } from '../i18n.js'
import { fechaLocal } from '../projectUtils.js'
import { buildAgenda } from '../todayModel.js'

export default function ModulePreview({ proyectos, modulos, onOpenTasks, onOpenDelivery, setPanelAbierto }) {
  const [today, setToday] = useState(fechaLocal)
  useEffect(() => {
    const refresh = () => setToday(fechaLocal())
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const agenda = useMemo(() => buildAgenda(proyectos, modulos, today), [proyectos, modulos, today])
  const tasks = agenda.filter(item => item.type === 'task' && item.task.tipo !== 'cita')
  const appointments = agenda.filter(item => item.type === 'task' && item.task.tipo === 'cita')
  const deliveries = agenda.filter(item => item.type === 'delivery' && item.days <= 7)
  const payments = modulos.economia ? proyectos.flatMap(p => (p.cobros || []).filter(c => c.estado === 'previsto')) : []
  const actions = [
    ['📅', 'Citas', appointments.length, () => setPanelAbierto('citas')],
    ['tareas', 'Tareas', tasks.length, () => tasks.length === 1 ? onOpenTasks(tasks[0].project) : setPanelAbierto('tareas')],
    ['entregas', 'Entregas', deliveries.length, () => deliveries.length === 1 ? onOpenDelivery(deliveries[0].project) : setPanelAbierto('entregas')],
    ['cobros', 'Cobros pendientes', payments.length, () => setPanelAbierto('cobros')],
  ].filter(([id, , count]) => id === '📅' || id === 'tareas' ? modulos.tareas : count > 0)
  if (!actions.length) return null
  return <div className="module-quick-actions">{actions.map(([id, label, count, onClick]) =>
    <button type="button" key={id} className={'module-quick-action' + ((id === '📅' || id === 'tareas') && agenda.some(item => item.type === 'task' && (id === '📅' ? item.task.tipo === 'cita' : item.task.tipo !== 'cita') && (item.days === 0 || item.days === 1)) ? ' is-due-soon' : '')} onClick={onClick} title={`${t(label)}: ${count}`} aria-label={`${t(label)}: ${count}`}>
      <LineIcon name={id} />
      <span>{count}</span>
    </button>)}</div>
}

