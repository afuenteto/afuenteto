import { fechaLocal, diasEntreFechas as daysFrom } from './projectUtils.js'
export { diasEntreFechas as daysFrom } from './projectUtils.js'

export function remainingTime(item, now = new Date()) {
  if (!item.date || !item.time) return null
  const milliseconds = new Date(`${item.date}T${item.time}:00`).getTime() - now.getTime()
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null
  const minutes = Math.ceil(milliseconds / 60000)
  return { days: Math.floor(minutes / 1440), hours: Math.floor(minutes % 1440 / 60), minutes: minutes % 60 }
}

export function buildAgenda(projects, modules, today = fechaLocal(), now = new Date()) {
  const agenda = []
  for (const project of projects.filter(p => p.estado !== 'finalizado')) {
    if (modules.tareas) {
      for (const task of project.tareas || []) {
        if (task.hecha) continue
        agenda.push({ id: `task-${project.id}-${task.id}`, type: 'task', title: task.texto,
          date: task.fecha || '', time: /^([01]\d|2[0-3]):[0-5]\d$/.test(task.hora || '') ? task.hora : '',
          days: daysFrom(task.fecha, today), project, task })
      }
    }
    if (modules.entregas && project.fechaEntrega) {
      const days = daysFrom(project.fechaEntrega, today)
      if (days !== null) agenda.push({ id: `delivery-${project.id}`, type: 'delivery',
        title: project.nombre, date: project.fechaEntrega, time: '', days, project })
    }
  }
  const timestamp = item => item.days === null ? Infinity : new Date(item.date + 'T' + (item.time || '23:59') + ':00').getTime()
  const group = item => item.days === null ? 2 : timestamp(item) < now.getTime() ? 1 : 0
  return agenda.sort((a, b) => group(a) - group(b) ||
    (group(a) === 1 ? timestamp(b) - timestamp(a) : timestamp(a) - timestamp(b)) ||
    Number(b.task?.prioridad === 'alta') - Number(a.task?.prioridad === 'alta') || a.title.localeCompare(b.title))
}

export function filterAgenda(agenda, filter) {
  return agenda.filter(item => filter === 'all' ||
    (filter === 'immediate' && (item.days === 0 || item.days === 1)) ||
    (filter === 'overdue' && item.days !== null && item.days < 0) ||
    (filter === 'today' && item.days !== null && item.days <= 0) ||
    (filter === 'week' && item.days !== null && item.days <= 7) ||
    (filter === 'undated' && item.days === null))
}
