import ProjectName from './ProjectName.jsx'
import { iconText } from './LineIcon.jsx'
import FlatStatus from './FlatStatus.jsx'
import { t, getLocale, formatRelativeDays } from '../i18n.js'
import { useEffect, useMemo, useState } from 'react'
import { fechaLocal } from '../projectUtils.js'
import { buildAgenda, filterAgenda, remainingTime } from '../todayModel.js'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'
import CalendarAction from './CalendarAction.jsx'

export default function StudioToday({ proyectos = [], onOpen, onOpenTasks, onCompleteTask, onSchedule,
  guardando, setPanelAbierto, citasOnly = false, modulos = MODULOS_PREDETERMINADOS }) {
  const [filter, setFilter] = useState('immediate')
  const [kind, setKind] = useState(citasOnly ? 'cita' : 'all')
  const [now, setNow] = useState(() => new Date())
  const [completed, setCompleted] = useState(false)
  const [limit, setLimit] = useState(6)
  const [today, setToday] = useState(fechaLocal)
  const [scheduling, setScheduling] = useState(false)
  const [draft, setDraft] = useState({ project: '', texto: '', fecha: '', hora: '', tipo: citasOnly ? 'cita' : 'tarea' })
  const [scheduleError, setScheduleError] = useState(false)
  async function schedule(event) {
    event.preventDefault()
    if (guardando || !draft.texto.trim()) return
    setScheduleError(false)
    try {
      const saved = await onSchedule(draft.project, { id: draft.id || crypto.randomUUID(), texto: draft.texto.trim(),
        fecha: draft.fecha, hora: draft.hora, tipo: draft.project === 'generic' ? 'cita' : draft.tipo, hecha: Boolean(draft.hecha), prioridad: 'normal', fechaCompletada: draft.fechaCompletada || '' })
      if (!saved) { setScheduleError(true); return }
      setDraft({ project: '', texto: '', fecha: '', hora: '', tipo: citasOnly ? 'cita' : 'tarea' })
      setScheduling(false)
      setCompleted(false)
      changeFilter('all')
    } catch { setScheduleError(true) }
  }
  useEffect(() => {
    const refresh = () => { setToday(fechaLocal()); setNow(new Date()) }
    const timer = setInterval(refresh, 1000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const agenda = useMemo(() => buildAgenda(citasOnly && completed ? proyectos.map(p => ({...p, tareas: (p.tareas || []).filter(t => t.hecha && t.tipo === 'cita').map(t => ({...t, hecha: false}))})) : proyectos, modulos, today, now)
    .filter(item => kind === 'all' || (kind === 'delivery' ? item.type === 'delivery' : item.type === 'task' && (item.task.tipo || 'tarea') === kind)), [proyectos, modulos, today, now, kind, completed, citasOnly])
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

  return <section className="studio-today daily-agenda" aria-label={t(citasOnly ? 'Citas' : 'Hoy en el estudio')}>
    <header className="daily-header">
      <div>
        <p className="daily-date"><span>{new Date(today + 'T12:00:00').toLocaleDateString(getLocale(), {
          weekday: 'long', day: 'numeric', month: 'long',
        })}</span><span aria-hidden="true">|</span><time dateTime={now.toISOString()}>{[now.getHours(), now.getMinutes()].map(value => String(value).padStart(2, '0')).join(' : ')}</time></p>
      </div>
      {modulos.tareas && <div className="daily-actions"><span aria-hidden="true">|</span>
        {onSchedule && <button type="button" className="daily-add" title={t('Programar tarea o cita')} aria-label={t('Programar tarea o cita')} disabled={guardando}
          aria-expanded={scheduling} onClick={() => { if (!scheduling) setDraft({ project: '', texto: '', fecha: '', hora: '', tipo: citasOnly ? 'cita' : 'tarea' }); setScheduling(value => !value) }}><span aria-hidden="true">+</span></button>}
      </div>}
    </header>
    {modulos.tareas && scheduling && <form className="daily-schedule" onSubmit={schedule}>
      <fieldset disabled={guardando}>
        <label>{t('Proyecto')}<select required disabled={Boolean(draft.id)} value={draft.project} onChange={e => setDraft({ ...draft, project: e.target.value, tipo: e.target.value === 'generic' ? 'cita' : draft.tipo })}>
          <option value="">{t('Selecciona un proyecto')}</option>
          <option value="generic">{t('Genérico')}</option>
          {proyectos.filter(p => p.estado !== 'finalizado' && p.id !== 'generic').map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select></label>
        {!citasOnly && draft.project !== 'generic' && <label>{t('Tipo')}<select value={draft.tipo} onChange={e => setDraft({ ...draft, tipo: e.target.value })}>
          <option value="tarea">{t('Tareas')}</option><option value="cita">{t('Cita')}</option>
        </select></label>}
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
      <div className="daily-filters">
        {citasOnly ? [['pending', 'Pendientes'], ['done', 'Terminadas']].map(([value,label]) => <button type="button" className="chip" key={value} aria-pressed={completed === (value === 'done')} onClick={() => {setCompleted(value === 'done');setLimit(6)}}>{t(label)}</button>) : [['all','Todos'],['tarea','Tareas'],['cita','Citas'],['delivery','Entregas']].filter(([value]) => value === 'all' || (value === 'delivery' ? modulos.entregas : modulos.tareas)).map(([value,label]) => <button type="button" className="chip" key={value} aria-pressed={kind === value} onClick={() => {setKind(value);setLimit(6)}}>{t(label)}</button>)}
      </div>
      <div className="daily-stats">
        {[
          [t('Vencimientos pendientes'), overdue, 'overdue', overdue > 0 ? 'is-overdue' : ''],
          [t('Para hoy'), dueToday, 'today', ''],
          [t('Próximos 7 días'), upcoming, 'week', ''],
          [t('Sin fecha'), undated, 'undated', ''],
        ].map(([label, count, value, style]) => <button type="button" key={label}
          className={`daily-stat ${style}`} onClick={() => changeFilter(value)}>
          <strong>{count}</strong><span>{label}</span>
        </button>)}
      </div>
      <div className="daily-filters" aria-label={t('Agenda')}>
        {[[ 'immediate', 'Hoy y mañana' ], [ 'today', 'Para hoy' ], [ 'week', 'Próximos 7 días' ], [ 'undated', 'Sin fecha' ], [ 'all', 'Todos' ]]
          .map(([value, label]) => <button type="button" key={value} className={'chip' + (filter === value ? ' active' : '')}
            aria-pressed={filter === value} onClick={() => changeFilter(value)}>{t(label)}</button>)}
      </div>
      {(filter === 'today' || filter === 'week') && overdue > 0 &&
        <p className="daily-hint">{t('Incluye los vencimientos pendientes.')}</p>}
      <div className="daily-list">
        {visible.slice(0, limit).map(item => <article key={item.id} className={'daily-row' + (!completed && item.type === 'task' && item.days === 0 ? ' is-today' : !completed && item.type === 'task' && item.days === 1 ? ' is-tomorrow' : '') + (item.type === 'delivery' ? (item.days < 0 ? ' delivery-past' : ' delivery-upcoming') : (item.days !== null && item.days < 0 ? ' is-overdue' : ''))}>
          <div className="daily-when">
            <strong>{item.days === null ? t('Sin fecha') : dateLabel(item.date)}</strong>
            <span>{item.days === null ? t('Por programar') : formatRelativeDays(item.days)}</span>
            {item.time && <span>{item.time}</span>}
            {!completed && (() => { const left = remainingTime(item, now); return left && <span className="daily-countdown">{t('Quedan')} {left.days > 0 ? left.days + ' d · ' : ''}{left.hours} h · {left.minutes} min</span> })()}
          </div>
          <button type="button" className="daily-main" onClick={() => item.project.id === 'generic' ? (setDraft({ ...(proyectos.find(p => p.id === 'generic')?.tareas.find(task => task.id === item.task.id) || item.task), project: 'generic' }), setScheduling(true)) : item.type === 'task' ? onOpenTasks(item.project, item.task.tipo === 'cita' ? 'cita' : 'tarea') : onOpen(item.project)}>
            <span className="daily-kind">{t(item.type === 'task' ? (item.task.tipo === 'cita' ? 'Cita' : 'Tareas') : 'Entregas')}{item.task?.prioridad === 'alta' ? <> · <FlatStatus label="🔴 Alta" /></> : ''}</span>
            <strong><ProjectName proyecto={item.project} enabled={modulos.documentos}>{item.title}</ProjectName></strong>
            <span>{item.type === 'task' ? item.project.nombre : item.project.cliente}</span>
          </button>
          <div className="daily-actions">
            {item.days !== null && <CalendarAction event={{ id: item.id, date: item.date, time: item.time,
              title: item.type === 'task' ? `${item.title} · ${item.project.nombre}` : `${t('Entregas')} · ${item.title}`,
              description: item.project.nombre,
            }} />}
            {!completed && item.type === 'task' && onCompleteTask && <button type="button" className="chip complete-task-button" disabled={guardando}
              aria-label={t('Completar tarea: {0}', { 0: item.title })}
              onClick={() => onCompleteTask(item.project.id, item.task.id)}>{t('Completar')}</button>}
          </div>
        </article>)}
        {visible.length === 0 && <p className="daily-empty">{t('No hay pendientes en esta vista.')}</p>}
      </div>
      {filter === 'immediate' && <button type="button" className="chip daily-more" onClick={() => { setFilter('all'); setLimit(agenda.length) }}>{t('Ampliar · todos los pendientes')} ({agenda.length})</button>}
      {filter !== 'immediate' && <button type="button" className="chip daily-more" onClick={() => changeFilter('immediate')}>{t('Ver solo lo inmediato')}</button>}
      {visible.length > limit && <button type="button" className="chip daily-more" onClick={() => setLimit(n => n + 6)}>
        {t('Ver más ({0})', { 0: visible.length - limit })}</button>}
    </>}
    {!citasOnly && <footer className="daily-footer">
      {modulos.economia && <button type="button" onClick={() => setPanelAbierto('cobros')}>
        <strong>{payments.length}</strong> {iconText('💰 Cobros previstos')} · {payments.reduce((sum, c) => sum + Number(c.importe || 0), 0).toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })}
      </button>}
      <button type="button" onClick={() => setPanelAbierto('bloqueados')}><strong>{blocked.length}</strong> <FlatStatus label="🔵 Proyectos bloqueados" /></button>
    </footer>}
  </section>
}
