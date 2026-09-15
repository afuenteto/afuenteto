import ProjectName from './ProjectName.jsx'
import { iconText } from './LineIcon.jsx'
import FlatStatus from './FlatStatus.jsx'
import { t, getLocale, formatRelativeDays } from '../i18n.js'
import { useEffect, useMemo, useState } from 'react'
import { fechaLocal } from '../projectUtils.js'
import { buildAgenda, filterAgenda } from '../todayModel.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'
import CalendarAction from './CalendarAction.jsx'

export default function StudioToday({ proyectos = [], onOpen, onOpenTasks, onCompleteTask, onSchedule,
  guardando, setPanelAbierto, modulos = MODULOS_PREDETERMINADOS }) {
  const [filter, setFilter] = useState('week')
  const [limit, setLimit] = useState(6)
  const [today, setToday] = useState(fechaLocal)
  const [scheduling, setScheduling] = useState(false)
  const [draft, setDraft] = useState({ project: '', texto: '', fecha: '', hora: '', tipo: 'tarea' })
  const [scheduleError, setScheduleError] = useState(false)
  async function schedule(event) {
    event.preventDefault()
    if (guardando || !draft.texto.trim()) return
    setScheduleError(false)
    try {
      const saved = await onSchedule(draft.project, { id: crypto.randomUUID(), texto: draft.texto.trim(),
        fecha: draft.fecha, hora: draft.hora, tipo: draft.tipo, hecha: false, prioridad: 'normal', fechaCompletada: '' })
      if (!saved) { setScheduleError(true); return }
      setDraft({ project: '', texto: '', fecha: '', hora: '', tipo: 'tarea' })
      setScheduling(false)
      changeFilter('all')
    } catch { setScheduleError(true) }
  }
  useEffect(() => {
    const refresh = () => setToday(fechaLocal())
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const agenda = useMemo(() => buildAgenda(proyectos, modulos, today), [proyectos, modulos, today])
  const visible = filterAgenda(agenda, filter)
  const overdue = agenda.filter(item => item.days !== null && item.days < 0).length
  const dueToday = agenda.filter(item => item.days === 0).length
  const upcoming = agenda.filter(item => item.days > 0 && item.days <= 7).length
  const undated = agenda.filter(item => item.days === null).length
  const blocked = proyectos.filter(p => p.estado !== 'finalizado' && p.prioridad === 'bloqueado')
  const payments = modulos.economia ? proyectos.filter(p => p.estado !== 'finalizado')
    .flatMap(p => (p.cobros || []).filter(c => c.estado === 'previsto')) : []
  const changeFilter = next => { setFilter(next); setLimit(6) }
  const dateLabel = date => new Date(date + 'T12:00:00').toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' })

  return <section className="studio-today daily-agenda" aria-labelledby="daily-title">
    <header className="daily-header">
      <div>
        <p className="daily-date">{new Date(today + 'T12:00:00').toLocaleDateString(getLocale(), {
          weekday: 'long', day: 'numeric', month: 'long',
        })}</p>
        <h2 id="daily-title" className="serif">{t('Hoy en el estudio')}</h2>
        <p className="daily-intro">{t('Tu agenda, de un vistazo.')}</p>
      </div>
      {modulos.tareas && <div className="daily-actions">
        {onSchedule && <button type="button" className="btn" disabled={guardando || proyectos.length === 0}
          aria-expanded={scheduling} onClick={() => setScheduling(value => !value)}>{t('Programar tarea o cita')}</button>}
        <button type="button" className="chip" onClick={() => setPanelAbierto('tareas')}>{t('Tareas')}</button>
      </div>}
    </header>
    {modulos.tareas && scheduling && <form className="daily-schedule" onSubmit={schedule}>
      <fieldset disabled={guardando}>
        <label>{t('Proyecto')}<select required value={draft.project} onChange={e => setDraft({ ...draft, project: e.target.value })}>
          <option value="">{t('Selecciona un proyecto')}</option>
          {proyectos.filter(p => p.estado !== 'finalizado').map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select></label>
        <label>{t('Tipo')}<select value={draft.tipo} onChange={e => setDraft({ ...draft, tipo: e.target.value })}>
          <option value="tarea">{t('Tareas')}</option><option value="cita">{t('Cita')}</option>
        </select></label>
        <label className="daily-schedule-title">{t('Descripción')}<input required maxLength={300} value={draft.texto}
          onChange={e => setDraft({ ...draft, texto: e.target.value })} /></label>
        <label>{t('Fecha')}<input type="date" required value={draft.fecha} onChange={e => setDraft({ ...draft, fecha: e.target.value })} /></label>
        <label>{t('Hora (opcional)')}<input type="time" value={draft.hora} onChange={e => setDraft({ ...draft, hora: e.target.value })} /></label>
        <div className="daily-actions"><button className="btn" type="submit">{t(guardando ? 'Guardando...' : 'Guardar')}</button>
          <button className="chip" type="button" onClick={() => setScheduling(false)}>{t('Cancelar')}</button></div>
      </fieldset>
      {scheduleError && <p role="alert">{t('No se pudo guardar. Inténtalo de nuevo.')}</p>}
    </form>}
    {(modulos.tareas || modulos.entregas) && <>
      <div className="daily-stats">
        {[
          [t('Vencimientos pendientes'), overdue, 'today', overdue > 0 ? 'is-overdue' : ''],
          [t('Para hoy'), dueToday, 'today', ''],
          [t('Próximos 7 días'), upcoming, 'week', ''],
          [t('Sin fecha'), undated, 'undated', ''],
        ].map(([label, count, value, style]) => <button type="button" key={label}
          className={`daily-stat ${style}`} onClick={() => changeFilter(value)}>
          <strong>{count}</strong><span>{label}</span>
        </button>)}
      </div>
      <div className="daily-filters" aria-label={t('Agenda')}>
        {[[ 'today', 'Para hoy' ], [ 'week', 'Próximos 7 días' ], [ 'undated', 'Sin fecha' ], [ 'all', 'Todos' ]]
          .map(([value, label]) => <button type="button" key={value} className={'chip' + (filter === value ? ' active' : '')}
            aria-pressed={filter === value} onClick={() => changeFilter(value)}>{t(label)}</button>)}
      </div>
      {(filter === 'today' || filter === 'week') && overdue > 0 &&
        <p className="daily-hint">{t('Incluye los vencimientos pendientes.')}</p>}
      <div className="daily-list">
        {visible.slice(0, limit).map(item => <article key={item.id} className={'daily-row' + (item.days !== null && item.days < 0 ? ' is-overdue' : '')}>
          <div className="daily-when">
            <strong>{item.days === null ? t('Sin fecha') : dateLabel(item.date)}</strong>
            <span>{item.days === null ? t('Por programar') : formatRelativeDays(item.days)}</span>
            {item.time && <span>{item.time}</span>}
          </div>
          <button type="button" className="daily-main" onClick={() => item.type === 'task' ? onOpenTasks(item.project) : onOpen(item.project)}>
            <span className="daily-kind">{t(item.type === 'task' ? (item.task.tipo === 'cita' ? 'Cita' : 'Tareas') : 'Entregas')}{item.task?.prioridad === 'alta' ? <> · <FlatStatus label="🔴 Alta" /></> : ''}</span>
            <strong><ProjectName proyecto={item.project} enabled={modulos.documentos}>{item.title}</ProjectName></strong>
            <span>{item.type === 'task' ? item.project.nombre : item.project.cliente}</span>
          </button>
          <div className="daily-actions">
            {item.days !== null && <CalendarAction event={{ id: item.id, date: item.date, time: item.time,
              title: item.type === 'task' ? `${item.title} · ${item.project.nombre}` : `${t('Entregas')} · ${item.title}`,
              description: item.project.nombre,
            }} />}
            {item.type === 'task' && onCompleteTask && <button type="button" className="chip complete-task-button" disabled={guardando}
              aria-label={t('Completar tarea: {0}', { 0: item.title })}
              onClick={() => onCompleteTask(item.project.id, item.task.id)}>{t('Completar')}</button>}
          </div>
        </article>)}
        {visible.length === 0 && <p className="daily-empty">{t('No hay pendientes en esta vista.')}</p>}
      </div>
      {visible.length > limit && <button type="button" className="chip daily-more" onClick={() => setLimit(n => n + 6)}>
        {t('Ver más ({0})', { 0: visible.length - limit })}</button>}
    </>}
    <footer className="daily-footer">
      {modulos.economia && <button type="button" onClick={() => setPanelAbierto('cobros')}>
        <strong>{payments.length}</strong> {iconText('💰 Cobros previstos')} · {payments.reduce((sum, c) => sum + Number(c.importe || 0), 0).toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })}
      </button>}
      <button type="button" onClick={() => setPanelAbierto('bloqueados')}><strong>{blocked.length}</strong> <FlatStatus label="🔵 Proyectos bloqueados" /></button>
    </footer>
  </section>
}
