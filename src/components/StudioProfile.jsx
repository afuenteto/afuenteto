import { t as translateUI } from '../i18n.js'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import AppearanceSettings from './AppearanceSettings.jsx'
import LineIcon from './LineIcon.jsx'

export default function StudioProfile({ children, usuario, appearance, onAppearanceSaved }) {
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const perfilRef = useRef(null)
  const appearanceRef = useRef(null)
  const savedProfile = useRef(null)
  const saveLock = useRef(false)
  const [appearanceBusy, setAppearanceBusy] = useState(false)
  const [appearanceActions, setAppearanceActions] = useState(null)

  useEffect(() => {
    if (!abierto) return
    function cerrarFuera(event) {
      if (guardando || appearanceBusy) return
      if (perfilRef.current && !perfilRef.current.contains(event.target)) setAbierto(false)
    }
    function cerrarConEscape(event) {
      if (guardando || appearanceBusy) return
      if (event.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('pointerdown', cerrarFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('pointerdown', cerrarFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto, guardando, appearanceBusy])

  const [perfil, setPerfil] = useState({
    id: null,
    nombre: '',
    web: '',
    instagram: '',
    telefono: '',
  })

  useEffect(() => {
    if (!usuario?.id) return
    let activo = true

    async function cargarPerfil() {
      const { data, error } = await supabase
        .from('perfil_estudio')
        .select('*')
        .eq('user_id', usuario.id)
        .maybeSingle()

      if (error) {
        console.error('ERROR CARGANDO PERFIL:', error)
        return
      }

      if (activo && data) {
        savedProfile.current = data
        setPerfil({
          id: data.id,
          nombre: data.nombre || '',
          web: data.web || '',
          instagram: data.instagram || '',
          telefono: data.telefono || '',
        })
      }
    }

    cargarPerfil().catch(error => console.error('ERROR CARGANDO PERFIL:', error))
    return () => { activo = false }
  }, [usuario?.id])

  function cambiarCampo(e) {
    setPerfil((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }))
  }

  async function guardarPerfil() {
    if (!usuario || saveLock.current || appearanceBusy) return
    saveLock.current = true

    setGuardando(true)

    const fila = {
      user_id: usuario.id,
      nombre: perfil.nombre || '',
      web: perfil.web || '',
      instagram: perfil.instagram || '',
      telefono: perfil.telefono || '',
    }

    try {
    const { data, error } = await supabase
      .from('perfil_estudio')
      .upsert(fila, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) throw error

    if (data) {
      savedProfile.current = data
      setPerfil({
        id: data.id,
        nombre: data.nombre || '',
        web: data.web || '',
        instagram: data.instagram || '',
        telefono: data.telefono || '',
      })

      if (appearanceRef.current && !await appearanceRef.current.save()) return
      setEditando(false)
    }

    } catch (error) {
      alert(translateUI("No se pudo guardar el perfil.\n\n{0}", { 0: error.message }))
    } finally {
      saveLock.current = false
      setGuardando(false)
    }
  }

  function urlWeb(web) {
    if (!web) return ''

    if (
      web.startsWith('http://') ||
      web.startsWith('https://')
    ) {
      return web
    }

    return `https://${web}`
  }

  const usuarioInstagram =
    perfil.instagram.replace('@', '').trim()

  return (
    <div className="studio-profile" ref={perfilRef}>

      <button
        type="button"
        className="profile-trigger"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        disabled={guardando || appearanceBusy}
        aria-label={translateUI("Abrir perfil del estudio")}
      >
        {children}
      </button>

      {abierto && (
        <div className={`profile-panel${editando ? ' is-editing' : ''}`}>
          <button type="button" className="icon-btn personal-card-close" disabled={guardando || appearanceBusy} aria-label={translateUI('Cerrar')} onClick={() => setAbierto(false)}><LineIcon name="close-main" /></button>

          {!editando ? (
            <>
              {appearance && <AppearanceSettings ref={appearanceRef} usuario={usuario} settings={appearance.settings} logoUrl={appearance.logoUrl} onSaved={onAppearanceSaved} onBusy={setAppearanceBusy} editing={editando} actionsTarget={appearanceActions} saving={guardando} />}
              <div className="profile-details">
              <h3 className="serif">
                {perfil.nombre || translateUI("Perfil del estudio")}
              </h3>
              {usuario.email && <p className="personal-email">{usuario.email}</p>}

              {perfil.web && (
                <p>
                  <a
                    href={urlWeb(perfil.web)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {perfil.web}
                  </a>
                </p>
              )}

              {usuarioInstagram && (
                <p>
                  <a
                    href={`https://instagram.com/${usuarioInstagram}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{usuarioInstagram}
                  </a>
                </p>
              )}

              {perfil.telefono && (
                <p>
                  <a
                    href={`tel:${perfil.telefono.replace(/\s/g, '')}`}
                  >
                    {perfil.telefono}
                  </a>
                </p>
              )}

              </div>
              <button
                type="button"
                className="btn profile-edit-button"
                onClick={() => setEditando(true)}
              >{translateUI("Editar perfil")}</button>
            </>
          ) : (
            <>
              <div className="profile-details">
              <label className="profile-field">{translateUI("Nombre y apellidos")}
              <input
                name="nombre"
                value={perfil.nombre}
                onChange={cambiarCampo}
                placeholder={translateUI("Nombre y apellidos")}
              />
              </label>

              <label className="profile-field">{translateUI("Web")}
              <input
                name="web"
                value={perfil.web}
                onChange={cambiarCampo}
                placeholder={translateUI("Web")}
              />
              </label>

              <label className="profile-field">{translateUI("Instagram")}
              <input
                name="instagram"
                value={perfil.instagram}
                onChange={cambiarCampo}
                placeholder={translateUI("Instagram")}
              />
              </label>

              <label className="profile-field">{translateUI("Teléfono")}
              <input
                name="telefono" type="tel" autoComplete="tel"
                value={perfil.telefono}
                onChange={cambiarCampo}
                placeholder={translateUI("Teléfono")}
              />
              </label>

              </div>
              {appearance && <AppearanceSettings ref={appearanceRef} usuario={usuario} settings={appearance.settings} logoUrl={appearance.logoUrl} onSaved={onAppearanceSaved} onBusy={setAppearanceBusy} editing={editando} actionsTarget={appearanceActions} saving={guardando} />}
              <div className="profile-edit-actions" ref={setAppearanceActions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={guardarPerfil}
                disabled={guardando || appearanceBusy}
              >
                {guardando ? translateUI("Guardando...") : translateUI("Guardar")}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  appearanceRef.current?.cancel()
                  const saved = savedProfile.current
                  setPerfil({ id: saved?.id || null, nombre: saved?.nombre || '', web: saved?.web || '', instagram: saved?.instagram || '', telefono: saved?.telefono || '' })
                  setEditando(false)
                }}
                disabled={guardando || appearanceBusy}
              >{translateUI("Cancelar")}</button>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  )
}
