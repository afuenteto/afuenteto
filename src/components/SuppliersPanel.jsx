import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import { t } from '../i18n.js'
import { useLiveData } from '../useLiveData.js'

const empty = { nombre: '', contacto: '', telefono: '', email: '', direccion: '', notas: '', logo: '' }
export default function SuppliersPanel({ usuarioId }) {
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const [retry, setRetry] = useState(0)
  useLiveData({ userId: usuarioId, tables: 'proveedores', enabled: !loading && !busy,
    refresh: async isCurrent => {
      const { data, error } = await supabase.from('proveedores').select('*').eq('user_id', usuarioId).order('nombre')
      if (error) throw error
      if (isCurrent()) setItems(data || [])
    } })
  useEffect(() => {
    let active = true
    setLoading(true)
    supabase.from('proveedores').select('*').eq('user_id', usuarioId).order('nombre').then(({ data, error }) => {
      if (!active) return
      setError(error ? t('No se pudieron cargar los proveedores.') : '')
      if (!error) setItems(data || [])
      setLoading(false)
    }).catch(() => { if (active) { setError(t('No se pudieron cargar los proveedores.')); setLoading(false) } })
    return () => { active = false }
  }, [usuarioId, retry])
  async function save(event) {
    event.preventDefault()
    if (lock.current || !draft.nombre.trim()) return
    lock.current = true; setBusy(true); setError('')
    try {
      const values = Object.fromEntries(Object.keys(empty).map(key => [key, draft[key].trim()]))
      const request = draft.id ? supabase.from('proveedores').update(values).eq('id', draft.id).eq('user_id', usuarioId)
        : supabase.from('proveedores').insert({ ...values, user_id: usuarioId })
      const { data, error } = await request.select().single()
      if (error) throw error
      setItems(previous => [...previous.filter(item => item.id !== data.id), data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setDraft(null)
    } catch { setError(t('No se pudo guardar. Inténtalo de nuevo.')) }
    finally { lock.current = false; setBusy(false) }
  }
  async function logo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 512000) {
      setError(t('Elige un logo PNG, JPG o WebP de hasta 500 KB.')); return
    }
    setBusy(true)
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) })
      setDraft(previous => previous ? { ...previous, logo: data } : previous)
      setError('')
    } catch { setError(t('No se pudo leer la imagen.')) }
    finally { setBusy(false) }
  }
  return <section className="suppliers-panel" aria-label={t('Proveedores')}>
    <div className="daily-actions"><input type="search" aria-label={t('Buscar proveedores')} placeholder={t('Buscar proveedores')} value={query} onChange={e => setQuery(e.target.value)} />
      <button className="btn" disabled={busy || loading} onClick={() => setDraft({ ...empty })}>{t('Añadir proveedor')}</button></div>
    {error && <p role="alert">{error} {!draft && <button className="chip" onClick={() => setRetry(n => n + 1)}>{t('Reintentar')}</button>}</p>}
    {draft && <form className="supplier-form" onSubmit={save}><fieldset disabled={busy}>
      {Object.entries({ nombre: 'Nombre', contacto: 'Persona de contacto', telefono: 'Teléfono', email: 'Email', direccion: 'Dirección', notas: 'Notas' }).map(([key, label]) => <label key={key}>{t(label)}<input type={key === 'email' ? 'email' : key === 'telefono' ? 'tel' : 'text'} required={key === 'nombre'} maxLength={key === 'notas' ? 2000 : 300} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
      <label>{t('Logo')}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={logo} /></label>
      {draft.logo && <div><img className="supplier-avatar" src={draft.logo} alt={t('Logo')} /><button type="button" className="chip" onClick={() => setDraft({ ...draft, logo: '' })}>{t('Quitar logo')}</button></div>}
      <div className="daily-actions"><button className="btn" type="submit">{t(busy ? 'Guardando...' : 'Guardar')}</button><button className="chip" type="button" onClick={() => setDraft(null)}>{t('Cancelar')}</button></div>
    </fieldset></form>}
    {loading ? <p>{t('Cargando...')}</p> : <div className="supplier-grid">{items.filter(item => [item.nombre, item.contacto, item.notas].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item => <article className="supplier-card" key={item.id}>
      {item.logo ? <img className="supplier-avatar" src={item.logo} alt="" /> : <span className="supplier-avatar">{item.nombre.slice(0, 2).toLocaleUpperCase()}</span>}
      <div><h3>{item.nombre}</h3><p>{item.contacto}</p>{item.telefono && <p><a href={`tel:${item.telefono}`}>{item.telefono}</a></p>}{item.email && <p><a href={`mailto:${item.email}`}>{item.email}</a></p>}<p>{item.direccion}</p><p>{item.notas}</p><button className="chip" disabled={busy} onClick={() => setDraft({ ...empty, ...item })}>{t('Editar')}</button></div>
    </article>)}</div>}
    {!loading && !error && !items.length && <p>{t('Añade tu primer proveedor para crear tu agenda de contactos.')}</p>}
  </section>
}
