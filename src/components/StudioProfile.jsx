import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

export default function StudioProfile({ children, usuario }) {
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [perfil, setPerfil] = useState({
    id: null,
    nombre: '',
    web: '',
    instagram: '',
    telefono: '',
  })

  useEffect(() => {
    if (!usuario) return

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

      if (data) {
        setPerfil({
          id: data.id,
          nombre: data.nombre || '',
          web: data.web || '',
          instagram: data.instagram || '',
          telefono: data.telefono || '',
        })
      }
    }

    cargarPerfil()
  }, [usuario])

  function cambiarCampo(e) {
    setPerfil((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }))
  }

  async function guardarPerfil() {
    if (!usuario) return

    setGuardando(true)

    const fila = {
      user_id: usuario.id,
      nombre: perfil.nombre || '',
      web: perfil.web || '',
      instagram: perfil.instagram || '',
      telefono: perfil.telefono || '',
    }

    const { data, error } = await supabase
      .from('perfil_estudio')
      .upsert(fila, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) {
      console.error('ERROR GUARDANDO PERFIL:', error)

      alert(
        `No se pudo guardar el perfil.\n\n${error.message}`
      )

      setGuardando(false)
      return
    }

    if (data) {
      setPerfil({
        id: data.id,
        nombre: data.nombre || '',
        web: data.web || '',
        instagram: data.instagram || '',
        telefono: data.telefono || '',
      })

      setEditando(false)
    }

    setGuardando(false)
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
    <div className="studio-profile">

      <button
        type="button"
        className="profile-trigger"
        onClick={() => setAbierto((a) => !a)}
        aria-label="Abrir perfil del estudio"
      >
        {children}
      </button>

      {abierto && (
        <div className="profile-panel">

          {!editando ? (
            <>
              <h3 className="serif">
                {perfil.nombre || 'Perfil del estudio'}
              </h3>

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

              <button
                type="button"
                className="btn"
                onClick={() => setEditando(true)}
              >
                Editar perfil
              </button>
            </>
          ) : (
            <>
              <input
                name="nombre"
                value={perfil.nombre}
                onChange={cambiarCampo}
                placeholder="Nombre y apellidos"
              />

              <input
                name="web"
                value={perfil.web}
                onChange={cambiarCampo}
                placeholder="Web"
              />

              <input
                name="instagram"
                value={perfil.instagram}
                onChange={cambiarCampo}
                placeholder="Instagram"
              />

              <input
                name="telefono"
                value={perfil.telefono}
                onChange={cambiarCampo}
                placeholder="Teléfono"
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={guardarPerfil}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setEditando(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
            </>
          )}

        </div>
      )}

    </div>
  )
}
