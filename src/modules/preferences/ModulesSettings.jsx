import { useEffect, useId, useRef, useState } from 'react'
import { t } from '../../i18n.js'
import { MODULOS_CONFIGURABLES, normalizarModulos } from './model.js'
import './preferences.css'

export default function ModulesSettings({ modulos, onSave, onClose }) {
  const id = useId()
  const [seleccion, setSeleccion] = useState(() => normalizarModulos(modulos))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(false)
  const guardandoRef = useRef(false)
  const panelRef = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    panelRef.current?.focus()
    return () => anterior?.isConnected && anterior.focus()
  }, [])

  function teclado(event) {
    if (event.key === 'Escape' && !guardandoRef.current) {
      event.stopPropagation()
      onClose()
    }
    if (event.key !== 'Tab') return
    const elementos = [...panelRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
    if (!elementos.length) { event.preventDefault(); return }
    const primero = elementos[0]
    const ultimo = elementos.at(-1)
    if (event.shiftKey && (document.activeElement === primero || document.activeElement === panelRef.current)) {
      event.preventDefault(); ultimo.focus()
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault(); primero.focus()
    }
  }

  async function guardar(event) {
    event.preventDefault()
    if (guardandoRef.current) return
    guardandoRef.current = true
    setGuardando(true)
    setError(false)
    try {
      await onSave(seleccion)
      onClose()
    } catch {
      setError(true)
    } finally {
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  return (
    <div className="overlay modules-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget && !guardandoRef.current) onClose()
    }}>
      <section className="modal modules-settings" role="dialog" aria-modal="true"
        aria-labelledby={`${id}-title`} aria-describedby={`${id}-intro`}
        ref={panelRef} tabIndex={-1} onKeyDown={teclado}>
        <div className="modal-head">
          <h2 id={`${id}-title`} className="serif">{t('Módulos')}</h2>
          <button type="button" className="icon-btn" aria-label={t('Cerrar')} disabled={guardando} onClick={onClose}>✕</button>
        </div>
        <p id={`${id}-intro`} className="modules-intro">{t('Elige las funciones que quieres utilizar. Puedes volver a activarlas cuando quieras.')}</p>
        <div className="modules-base">
          <span>{t('Proyectos')}</span><span>{t('Siempre activo')}</span>
        </div>
        <form onSubmit={guardar} aria-busy={guardando}>
          <fieldset className="modal-fields" disabled={guardando}>
            {MODULOS_CONFIGURABLES.map(modulo => (
              <label className="module-option" key={modulo.id} htmlFor={`${id}-${modulo.id}`}>
                <span className="module-option-copy">
                  <strong>{t(modulo.nombre)}</strong>
                  <span id={`${id}-${modulo.id}-description`}>{t(modulo.descripcion)}</span>
                </span>
                <input id={`${id}-${modulo.id}`} type="checkbox" role="switch"
                  aria-describedby={`${id}-${modulo.id}-description`}
                  checked={seleccion[modulo.id]}
                  onChange={event => setSeleccion(actual => ({ ...actual, [modulo.id]: event.target.checked }))} />
              </label>
            ))}
            <p className="modules-preservation">{t('Desactivar un módulo conserva sus datos.')}</p>
            {error && <p className="modules-error" role="alert">{t('No se pudo guardar la configuración. Inténtalo de nuevo.')}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>{t('Cancelar')}</button>
              <button type="submit" className="btn btn-primary">{t(guardando ? 'Guardando...' : 'Guardar configuración')}</button>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  )
}
