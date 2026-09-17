import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import LineIcon from './LineIcon.jsx'
import { changeCommissionNumber, prepareCommission } from '../commissions.js'
import { fechaLocal } from '../projectUtils.js'
import { supabase } from '../supabase.js'
import { urlFirmada } from '../storageFiles.js'
import { t } from '../i18n.js'

export default function CommissionModal({ initial, projectId, projects, collaborators, usuario, modulos, onSave, onClose }) {
  const [draft, setDraft] = useState(initial)
  const [project, setProject] = useState(projectId || '')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const form = useRef(null)
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement
    form.current?.querySelector('select')?.focus()
    return () => previous?.isConnected && previous.focus()
  }, [])
  const set = (key, value) => setDraft(previous => ({ ...previous, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      if (!project) throw new Error('Selecciona un proyecto.')
      let item = prepareCommission(draft)
      if (file) {
        if (file.type !== 'application/pdf') throw new Error('Selecciona un archivo PDF.')
        const path = `${usuario.id}/${project}/comision-${item.id}-${crypto.randomUUID()}.pdf`
        const { error } = await supabase.storage.from('presupuestos').upload(path, file)
        if (error) throw error
        item = { ...item, presupuestoPdfPath: path, presupuestoPdfNombre: file.name, presupuestoPdf: await urlFirmada('presupuestos', path) }
        setDraft(item); setFile(null)
      }
      await onSave(project, item)
    } catch (cause) { setError(t(cause.message || 'No se pudo guardar. Inténtalo de nuevo.')) }
    finally { lock.current = false; setBusy(false) }
  }
  function keyboard(event) {
    if (event.key === 'Escape' && !lock.current) { event.stopPropagation(); onClose() }
    if (event.key !== 'Tab') return
    const elements = [...form.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')]
    const first = elements[0], last = elements.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  async function remove() {
    if (lock.current || !window.confirm(t('¿Eliminar esta comisión?'))) return
    lock.current = true; setBusy(true); setError('')
    try { await onSave(project, draft, true) }
    catch (cause) { setError(t(cause.message || 'No se pudo guardar. Inténtalo de nuevo.')) }
    finally { lock.current = false; setBusy(false) }
  }
  const modal = <div className="overlay" onMouseDown={e => e.target === e.currentTarget && !lock.current && onClose()} onKeyDown={keyboard}>
    <form ref={form} className="modal tasks-modal commission-editor" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={submit}>
      <fieldset className="modal-fields" disabled={busy}>
        <div className="modal-head window-title-bar"><h2 className="serif" id={`${id}-title`}>{t('Comisión')}</h2><button type="button" className="icon-btn" aria-label={t('Cerrar')} onClick={onClose}><LineIcon name="close-main" /></button></div>
        <div className="field"><label htmlFor={`${id}-project`}>{t('Proyecto')}</label><select id={`${id}-project`} required value={project} disabled={Boolean(initial.existing)} onChange={e => setProject(e.target.value)}><option value="">{t('Selecciona un proyecto')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
        <div className="field"><label htmlFor={`${id}-collaborator`}>{t('Colaboradores guardados')}</label><select id={`${id}-collaborator`} value={collaborators.some(c => c.nombre === draft.colaborador) ? draft.colaborador : ''} onChange={e => {
          const found = collaborators.find(c => c.nombre === e.target.value)
          setDraft(previous => ({ ...previous, colaborador: found?.nombre || '', concepto: found?.concepto || '', contacto: found?.contacto || '', telefono: found?.telefono || '', email: found?.email || '', direccion: found?.direccion || '' }))
        }}><option value="">{t('Nuevo colaborador')}</option>{collaborators.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}</select></div>
        <div className="commission-grid">
          {Object.entries({ colaborador: 'Colaborador', concepto: 'Especialidad / concepto', contacto: 'Persona de contacto', telefono: 'Teléfono', email: 'Email', direccion: 'Dirección' }).map(([key, label]) => <div className="field" key={key}><label htmlFor={`${id}-${key}`}>{t(label)}</label><input id={`${id}-${key}`} required={key === 'colaborador'} type={key === 'email' ? 'email' : key === 'telefono' ? 'tel' : 'text'} maxLength={300} value={draft[key] || ''} onChange={e => set(key, e.target.value)} /></div>)}
          {Object.entries({ presupuesto: 'Presupuesto aceptado (€)', porcentaje: 'Comisión acordada (%)', importe: 'Comisión (€)' }).map(([key, label]) => <div className="field" key={key}><label htmlFor={`${id}-${key}`}>{t(label)}</label><input id={`${id}-${key}`} inputMode="decimal" type="text" required value={draft[key] ?? ''} onChange={e => setDraft(previous => changeCommissionNumber(previous, key, e.target.value))} /></div>)}
          <div className="field"><label htmlFor={`${id}-date`}>{t('Fecha presupuesto')}</label><input id={`${id}-date`} type="date" value={draft.fecha || ''} onChange={e => set('fecha', e.target.value)} /></div>
          <div className="field"><label htmlFor={`${id}-status`}>{t('Estado')}</label><select id={`${id}-status`} value={draft.estado} onChange={e => setDraft(previous => ({ ...previous, estado: e.target.value, fechaCobro: e.target.value === 'cobrada' ? previous.fechaCobro || fechaLocal() : '' }))}><option value="pendiente">{t('Pendiente')}</option><option value="previsto">{t('Previsto')}</option><option value="cobrada">{t('Cobrada')}</option></select></div>
          {draft.estado === 'cobrada' && <div className="field"><label htmlFor={`${id}-paid`}>{t('Fecha de cobro')}</label><input id={`${id}-paid`} required type="date" value={draft.fechaCobro || ''} onChange={e => set('fechaCobro', e.target.value)} /></div>}
        </div>
        <p className="daily-hint">{t('Introduce el porcentaje o el importe de comisión; el otro se calcula automáticamente.')}</p>
        {modulos.documentos && <div className="field"><label htmlFor={`${id}-pdf`}>{t('Presupuesto PDF')}</label><input id={`${id}-pdf`} type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />{draft.presupuestoPdf && <a href={draft.presupuestoPdf} target="_blank" rel="noreferrer">{t('Ver presupuesto')}</a>}</div>}
        {error && <p role="alert">{error}</p>}
        <div className="modal-actions">{initial.existing && <button type="button" className="btn btn-ghost btn-danger" onClick={remove}>{t('Eliminar comisión')}</button>}<button type="button" className="btn btn-ghost" onClick={onClose}>{t('Cancelar')}</button><button className="btn btn-primary" type="submit">{t(busy ? 'Guardando...' : 'Guardar')}</button></div>
      </fieldset>
    </form>
  </div>
  const target = typeof document !== 'undefined' ? document.querySelector('.app') || document.body : null
  return target ? createPortal(modal, target) : modal
}
