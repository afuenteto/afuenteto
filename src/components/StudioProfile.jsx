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

    cargarPerfil()

  }, [usuario])


  async function cargarPerfil() {

    const { data, error } = await supabase
      .from('perfil_estudio')
      .select('*')
      .eq('user_id', usuario.id)
      .single()


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


  function cambiarCampo(e) {

    setPerfil({
      ...perfil,
      [e.target.name]: e.target.value,
    })

  }


  async function guardarPerfil() {

    setGuardando(true)


    const fila = {

      user_id: usuario.id,
      nombre: perfil.nombre,
      web: perfil.web,
      instagram: perfil.instagram,
      telefono: perfil.telefono,

    }


    const { data, error } = await supabase
      .from('perfil_estudio')
      .upsert(fila)
      .select()
      .single()


    if (!error && data) {

      setPerfil({
        ...perfil,
        id: data.id,
      })

      setEditando(false)

    }


    setGuardando(false)

  }


  return (

    <div className="studio-profile">


      <button
        className="profile-trigger"
        onClick={() => setAbierto(!abierto)}
      >
        {children}
      </button>


      {abierto && (

        <div className="profile-panel">


          {!editando ? (

            <>

              <h3 className="serif">
                {perfil.nombre || 'Sin nombre'}
              </h3>


              {perfil.web && (
                <p>
                  <a
                    href={perfil.web}
                    target="_blank"
                  >
                    {perfil.web}
                  </a>
                </p>
              )}


              {perfil.instagram && (
                <p>
                  <a
                    href={`https://instagram.com/${perfil.instagram.replace('@','')}`}
                    target="_blank"
                  >
                    @{perfil.instagram.replace('@','')}
                  </a>
                </p>
              )}


              {perfil.telefono && (
                <p>
                  <a href={`tel:${perfil.telefono}`}>
                    {perfil.telefono}
                  </a>
                </p>
              )}


              <button
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
                className="btn btn-primary"
                onClick={guardarPerfil}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>


            </>

          )}


        </div>

      )}


    </div>

  )
}
