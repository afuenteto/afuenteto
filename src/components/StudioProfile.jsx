import { useState } from 'react'

export default function StudioProfile() {

  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(false)

  const [perfil, setPerfil] = useState({
    nombre: 'Antonio Fuente',
    web: '',
    instagram: '',
    telefono: '',
  })


  function cambiarCampo(e) {
    setPerfil({
      ...perfil,
      [e.target.name]: e.target.value,
    })
  }


  return (
    <div className="studio-profile">

      <button
        className="profile-trigger"
        onClick={() => setAbierto(!abierto)}
      >
        Perfil del estudio
      </button>


      {abierto && (

        <div className="profile-panel">

          {!editando ? (

            <>
              <h3 className="serif">
                {perfil.nombre}
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
                onClick={() => setEditando(false)}
              >
                Guardar
              </button>

            </>

          )}

        </div>

      )}

    </div>
  )
}
