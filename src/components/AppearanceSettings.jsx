import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n.js'
import { APPEARANCE_KEY, normalizeAppearance } from '../appearance.js'
import { guardarMetadatosDeUsuario, notificarCambioModulos } from '../modules/preferences/repository.js'
import { supabase } from '../supabase.js'
import { createPortal } from 'react-dom'
import ProfileImageCropper from './ProfileImageCropper.jsx'

export default function AppearanceSettings({ usuario, settings, logoUrl, onSaved, onBusy, editing = false, actionsTarget }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(settings)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const input = useRef(null)
  const [imageOpen, setImageOpen] = useState(false)
  const [cropSource, setCropSource] = useState(null)
  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource) }, [cropSource])
  useEffect(() => { if (!editing) { setOpen(false); setPreview(null); setImageOpen(false) } }, [editing])
  useEffect(() => {
    if (!open && !imageOpen && !busy) setDraft(normalizeAppearance(settings))
  }, [settings.palette, settings.font, settings.logoPath, open, imageOpen, busy])
  function setWorking(value) { lock.current = value; setBusy(value); onBusy?.(value) }
  async function chooseImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || lock.current) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(t('Elige una imagen PNG, JPG o WebP de hasta 10 MB.')); return
    }
    setWorking(true); setError('')
    setCropSource(URL.createObjectURL(file))
  }
  async function save() {
    if (lock.current) return
    setWorking(true); setError('')
    try {
      const next = normalizeAppearance(draft)
      if (preview) {
        const { data: { session } = {}, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || session?.user?.id !== usuario.id) throw new Error(t('La sesión ha cambiado.'))
        const uploaded = `${usuario.id}/perfil/${crypto.randomUUID()}.png`
        const blob = await (await fetch(preview)).blob()
        const { error: uploadError } = await supabase.storage.from('imagenes-proyectos').upload(uploaded, blob, { contentType: 'image/png' })
        if (uploadError) throw uploadError
        next.logoPath = uploaded
      }
      const updated = await guardarMetadatosDeUsuario(usuario.id, { [APPEARANCE_KEY]: next })
      onSaved(updated)
      notificarCambioModulos(usuario.id)
      setDraft(next); setPreview(null); setOpen(false); setImageOpen(false)
    } catch (e) {
      // Ante un fallo de red, el servidor puede haber guardado los metadatos.
      // Conservar la imagen evita dejar una referencia a un archivo eliminado.
      setError(t('No se pudo guardar el perfil.\n\n{0}', { 0: e.message }))
    } finally { setWorking(false) }
  }
  function cancel() { setDraft(settings); setPreview(null); setOpen(false); setImageOpen(false); setError('') }
  return <div className="profile-appearance">
    <div className="personal-card-header">
      {editing ? <button type="button" className="personal-photo" disabled={busy} onClick={() => input.current.click()} title={t('Cambiar imagen')} aria-label={t('Cambiar imagen')}>
        <img src={preview || logoUrl} alt={t('Imagen del perfil')} width="88" height="88" />
        <span>{t('Cambiar imagen')}</span>
      </button> : <div className="personal-photo"><img src={preview || logoUrl} alt={t('Imagen del perfil')} width="88" height="88" /></div>}
      {editing && actionsTarget && createPortal(<button type="button" className="appearance-trigger" disabled={busy} aria-label={t('Apariencia')} title={t('Apariencia')} aria-expanded={open}
        onClick={() => { if (!open) setDraft(settings); setOpen(value => !value) }}>
        <img src={import.meta.env.BASE_URL + 'icons/palette.png'} alt="" width="30" height="30" />
      </button>, actionsTarget)}
    </div>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={chooseImage} />
    {cropSource && <ProfileImageCropper key={cropSource} src={cropSource} onCancel={() => { setCropSource(null); setWorking(false) }} onConfirm={data => { setPreview(data); setImageOpen(true); setCropSource(null); setWorking(false) }} />}
    {editing && open && !cropSource && <fieldset className="appearance-options" disabled={busy}>
      <legend>{t('Apariencia')}</legend>
      <label>{t('Tipo de letra')}<select value={draft.font} onChange={e => setDraft({ ...draft, font: e.target.value })}>
        <option value="default">{t('Por defecto')}</option><option value="serif">{t('Serifa')}</option>
      </select></label>
      <label>{t('Colores')}<select value={draft.palette} onChange={e => setDraft({ ...draft, palette: e.target.value })}>
        {[['yellow', 'Amarillos (por defecto)'], ['blue', 'Azules'], ['green', 'Verdes'], ['red', 'Rojos'], ['seasonal', 'Según la estación']].map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
      </select></label>
      {draft.palette === 'seasonal' && <p>{t('Primavera: verdes · Verano: amarillos · Otoño: rojos · Invierno: azules')}</p>}
    </fieldset>}
    {editing && !cropSource && (open || imageOpen) && <div className="personal-card-actions">
      <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{t(busy ? 'Guardando...' : 'Guardar')}</button>
      <button type="button" className="btn" disabled={busy} onClick={cancel}>{t('Cancelar')}</button>
    </div>}
    {error && <p role="alert" className="modules-error">{error}</p>}
  </div>
}
