import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { t } from '../i18n.js'
import { APPEARANCE_KEY, normalizeAppearance } from '../appearance.js'
import { guardarMetadatosDeUsuario, notificarCambioModulos } from '../modules/preferences/repository.js'
import { supabase } from '../supabase.js'
import { createPortal } from 'react-dom'
import ProfileImageCropper from './ProfileImageCropper.jsx'

export default forwardRef(function AppearanceSettings({ usuario, settings, logoUrl, onSaved, onBusy, editing = false, actionsTarget, saving = false }, ref) {
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
    if (!editing) setDraft(normalizeAppearance(settings))
  }, [settings.palette, settings.font, settings.logoPath, settings.headerLabel, settings.headerTitle, settings.useProfileIcon, editing])
  useImperativeHandle(ref, () => ({ save, cancel }))
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
    if (lock.current) return false
    if (!preview && JSON.stringify(normalizeAppearance(draft)) === JSON.stringify(normalizeAppearance(settings))) return true
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
      return true
    } catch (e) {
      // Ante un fallo de red, el servidor puede haber guardado los metadatos.
      // Conservar la imagen evita dejar una referencia a un archivo eliminado.
      setError(t('No se pudo guardar el perfil.\n\n{0}', { 0: e.message }))
      return false
    } finally { setWorking(false) }
  }
  function cancel() { setDraft(settings); setPreview(null); setOpen(false); setImageOpen(false); setError('') }
  function restoreDefaults() {
    setDraft({ ...normalizeAppearance(), headerLabel: draft.headerLabel, headerTitle: draft.headerTitle })
    setPreview(null)
    setImageOpen(false)
    setError('')
  }
  const displayedLogo = preview || (draft.logoPath ? logoUrl : import.meta.env.BASE_URL + 'icon-180.png')
  return <div className="profile-appearance">
    <div className="personal-card-header">
      {editing ? <button type="button" className="personal-photo" disabled={busy || saving} onClick={() => input.current.click()} title={t('Cambiar imagen')} aria-label={t('Cambiar imagen')}>
        <img src={displayedLogo} alt={t('Imagen del perfil')} width="88" height="88" />
        <span>{t('Cambiar imagen')}</span>
      </button> : <div className="personal-photo"><img src={preview || logoUrl} alt={t('Imagen del perfil')} width="88" height="88" /></div>}
      {editing && actionsTarget && createPortal(<button type="button" className="appearance-trigger" disabled={busy || saving} aria-label={t('Apariencia')} title={t('Apariencia')} aria-expanded={open}
        onClick={() => setOpen(value => !value)}>
        <img src={import.meta.env.BASE_URL + 'icons/color-type.png'} alt="" width="55" height="30" />
      </button>, actionsTarget)}
    </div>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={chooseImage} />
    {cropSource && <ProfileImageCropper key={cropSource} src={cropSource} onCancel={() => { setCropSource(null); setWorking(false) }} onConfirm={data => { setPreview(data); setImageOpen(true); setCropSource(null); setWorking(false) }} />}
    {editing && open && !cropSource && <fieldset className="appearance-options" disabled={busy || saving}>
      <legend>{t('Apariencia')}</legend>
      <label><span><input type="checkbox" checked={draft.useProfileIcon !== false} onChange={e => setDraft({ ...draft, useProfileIcon: e.target.checked })} /> {t('Usar la imagen del perfil como icono de la app')}</span></label>
      <label>{t('Tipo de letra')}<select value={draft.font} onChange={e => setDraft({ ...draft, font: e.target.value })}>
        <option value="default">{t('Por defecto')} (Inter)</option><option value="serif">{t('Serifa')} (Fraunces)</option>
      </select></label>
      <label>{t('Colores')}<select value={draft.palette} onChange={e => setDraft({ ...draft, palette: e.target.value })}>
        {[['green', 'Primavera'], ['yellow', 'Verano (por defecto)'], ['red', 'Otoño'], ['blue', 'Invierno'], ['seasonal', 'Según la estación']].map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
      </select></label>
      {draft.palette === 'seasonal' && <p>{t('Primavera: verdes · Verano: amarillos · Otoño: rojos · Invierno: azules')}</p>}
      <button type="button" className="btn" onClick={restoreDefaults}>{t('Restaurar apariencia inicial')}</button>
      <p>{t('Recupera la imagen original, los colores amarillos y la letra predeterminada. Pulsa Guardar para aplicar.')}</p>
    </fieldset>}
    {editing && !cropSource && <fieldset className="profile-heading-options" disabled={busy || saving}>
      <legend>{t('Cabecera de la app')}</legend>
      <label>{t('Texto superior')}<input maxLength={100} value={draft.headerLabel || ''} placeholder={t('Panel de estudio')} onChange={e => setDraft({ ...draft, headerLabel: e.target.value })} /></label>
      <label>{t('Título principal')}<input maxLength={100} value={draft.headerTitle || ''} placeholder={t('Proyectos')} onChange={e => setDraft({ ...draft, headerTitle: e.target.value })} /></label>
    </fieldset>}
    {error && <p role="alert" className="modules-error">{error}</p>}
  </div>
})
