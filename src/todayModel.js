import { fechaLocal, diasEntreFechas as daysFrom } from './projectUtils.js'
export { diasEntreFechas as daysFrom } from './projectUtils.js'

export function buildAgenda(projects, modules, today = fechaLocal()) {
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
  return agenda.sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity) ||
    a.time.localeCompare(b.time) || Number(b.task?.prioridad === 'alta') - Number(a.task?.prioridad === 'alta') ||
    a.title.localeCompare(b.title))
}

export function filterAgenda(agenda, filter) {
  return agenda.filter(item => filter === 'all' ||
    (filter === 'today' && item.days !== null && item.days <= 0) ||
    (filter === 'week' && item.days !== null && item.days <= 7) ||
    (filter === 'undated' && item.days === null))
}
