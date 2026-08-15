import { useEffect, useRef, useState } from 'react'
import ProjectCard from './components/ProjectCard.jsx'
import ProjectModal from './components/ProjectModal.jsx'
import { supabase } from './supabase.js'
import {
  FASES,
  nuevoProyecto,
  exportarJSON,
  importarJSON,
} from './storage.js'

import ICONO from './icon-180.png'

function proyectoDesdeBD(row) {
  return {
    id: row.id,
    nombre: row.nombre || '',
    cliente: row.cliente || '',
    telefono: row.telefono || '',
    email: row.email || '',
    direccion: row.direccion || '',
    fechaInicio: row.fecha_inicio || '',
    fechaEntrega: row.fecha_entrega || '',
    fase: row.fase || FASES[0],
    presupuestoTotal: row.presupuesto_total ?? '',
    presupuestoGastado: row.presupuesto_gastado ?? '',
    notas: row.notas || '',
    tareas: Array.isArray(row.tareas) ? row.tareas : [],
    proveedores: Array.isArray(row.proveedores) ? row.proveedores : [],
  }
}

function proyectoParaBD(proyecto, userId) {
  return {
    id: proyecto.id,
    user_id: userId,
    nombre: proyecto.nombre || '',
    cliente: proyecto.cliente || '',
    telefono: proyecto.telefono || '',
    email: proyecto.email || '',
    direccion: proyecto.direccion || '',
    fecha_inicio: proyecto.fechaInicio || null,
    fecha_entrega: proyecto.fechaEntrega || null,
    fase: proyecto.fase || FASES[0],
    presupuesto_total:
      proyecto.presupuestoTotal === '' ||
      proyecto.presupuestoTotal === null
        ? null
        : Number(proyecto.presupuestoTotal),
    presupuesto_gastado:
      proyecto.presupuestoGastado === '' ||
      proyecto.presupuestoGastado === null
        ? null
        : Number(proyecto.presupuestoGastado),
    notas: proyecto.notas || '',
    tareas: Array.isArray(proyecto.tareas) ? proyecto.tareas : [],
    proveedores: Array.isArray(proyecto.proveedores)
      ? proyecto.proveedores
      : [],
  }
}

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true)

  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setMostrarSplash(false)
    }, 1800)

    return () => clearTimeout(temporizador)
  }, [])

  async function cargarDesdeSupabase(user) {
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      throw error
    }

    return (data || []).map(proyectoDesdeBD)
  }

  useEffect(() => {
    let activo = true

    async function iniciar() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!activo) return

        if (session?.user) {
          setUsuario(session.user)

          const datos = await cargarDesdeSupabase(session.user)

          if (activo) {
            setProyectos(datos)
          }
        }
      } catch (error) {
        console.error(error)

        if (activo) {
          setErrorLogin(
            'No se han podido cargar los datos. Comprueba la configuración de Supabase.'
          )
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    iniciar()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!activo) return

      if (session?.user) {
        setUsuario(session.user)

        try {
          const datos = await cargarDesdeSupabase(session.user)

          if (activo) {
            setProyectos(datos)
          }
        } catch (error) {
          console.error(error)
        }
      } else {
        setUsuario(null)
        setProyectos([])
      }
    })

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [])

  async function iniciarSesion(e) {
    e.preventDefault()

    setErrorLogin('')
    setCargando(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      setUsuario(data.user)

      const datos = await cargarDesdeSupabase(data.user)
      setProyectos(datos)

      setPassword('')
    } catch (error) {
      console.error(error)

      setErrorLogin(
        error.message ||
          'No se ha podido iniciar sesión. Comprueba el email y la contraseña.'
      )
    } finally {
      setCargando(false)
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUsuario(null)
    setProyectos([])
    setEditando(null)
  }

  function abrirNuevo() {
    setEditando(nuevoProyecto())
  }

  function abrirExistente(proyecto) {
    setEditando(proyecto)
  }

  async function guardar(datos) {
    if (!usuario) return

    setGuardando(true)
    setAviso('')

    try {
      const fila = proyectoParaBD(datos, usuario.id)

      const { data, error } = await supabase
        .from('proyectos')
        .upsert(fila)
        .select()
        .single()

      if (error) throw error

      const proyectoGuardado = proyectoDesdeBD(data)

      setProyectos((prev) => {
        const existe = prev.some((p) => p.id === proyectoGuardado.id)

        if (existe) {
          return prev.map((p) =>
            p.id === proyectoGuardado.id ? proyectoGuardado : p
          )
        }

        return [...prev, proyectoGuardado]
      })

      setEditando(null)

      setAviso('Proyecto guardado correctamente.')
      setTimeout(() => setAviso(''), 3000)
    } catch (error) {
      console.error(error)

      alert(`No se pudo guardar el proyecto.\n\n${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id) {
    if (!usuario) return

    const confirmado = confirm(
      '¿Eliminar este proyecto? Esta acción no se puede deshacer.'
    )

    if (!confirmado) return

    setGuardando(true)

    try {
      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', id)
        .eq('user_id', usuario.id)

      if (error) throw error

      setProyectos((prev) => prev.filter((p) => p.id !== id))
      setEditando(null)

      setAviso('Proyecto eliminado.')
      setTimeout(() => setAviso(''), 3000)
    } catch (error) {
      console.error(error)

      alert(`No se pudo eliminar el proyecto.\n\n${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    try {
      const datos = await importarJSON(file)

      const confirmado = confirm(
        `Se han encontrado ${datos.length} proyecto(s) en el archivo.\n\n` +
          'Se añadirán a la base de datos. ¿Continuar?'
      )

      if (!confirmado) return

      setGuardando(true)

      for (const proyecto of datos) {
        const fila = proyectoParaBD(proyecto, usuario.id)

        const { error } = await supabase
          .from('proyectos')
          .upsert(fila)

        if (error) throw error
      }

      const actualizados = await cargarDesdeSupabase(usuario)

      setProyectos(actualizados)

      setAviso(
        `Importados ${datos.length} proyecto(s) correctamente.`
      )

      setTimeout(() => setAviso(''), 4000)
    } catch (error) {
      console.error(error)

      alert(
        `No se pudieron importar los proyectos.\n\n${error.message}`
      )
    } finally {
      setGuardando(false)
    }
  }

  const proyectosFiltrados =
    filtro === 'Todos'
      ? proyectos
      : proyectos.filter((p) => p.fase === filtro)

  const proyectosOrdenados = [...proyectosFiltrados].sort((a, b) => {
    if (!a.fechaEntrega) return 1
    if (!b.fechaEntrega) return -1

    return a.fechaEntrega.localeCompare(b.fechaEntrega)
  })

  /* ---------- PANTALLA INICIAL ---------- */

  if (mostrarSplash) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#f5c400',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            animation: 'entradaIcono 1.4s ease-out forwards',
          }}
        >
          <img
            src={ICONO}
            alt="Proyectos de Interiorismo"
            style={{
              width: '180px',
              height: '180px',
              objectFit: 'cover',
              display: 'block',
              borderRadius: '28px',
              boxShadow: '0 18px 50px rgba(0,0,0,0.20)',
            }}
          />

          <div
            style={{
              marginTop: '22px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#171717',
            }}
          >
            Proyectos de Interiorismo
          </div>
        </div>

        <style>
          {`
            @keyframes entradaIcono {
              0% {
                opacity: 0;
                transform: scale(0.82);
              }

              60% {
                opacity: 1;
                transform: scale(1.04);
              }

              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}
        </style>
      </div>
    )
  }

  /* ---------- CARGANDO ---------- */

  if (cargando) {
    return (
      <div className="app">
        <div className="empty">
          <h3 className="serif">Cargando...</h3>
          <p>Conectando con la base de datos.</p>
        </div>
      </div>
    )
  }

  /* ---------- LOGIN ---------- */

  if (!usuario) {
    return (
      <div className="app">
        <div
          style={{
            maxWidth: '420px',
            margin: '60px auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <img
              src={ICONO}
              alt=""
              style={{
                width: '58px',
                height: '58px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            />

            <div>
              <p className="eyebrow" style={{ margin: 0 }}>
                Panel de estudio
              </p>

              <h1
                className="serif"
                style={{
                  margin: '3px 0 0',
                  fontSize: '25px',
                }}
              >
                Proyectos
              </h1>
            </div>
          </div>

          <hr className="rule" />

          <form onSubmit={iniciarSesion}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginBottom: '18px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '15px',
              }}
            />

            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginBottom: '18px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '15px',
              }}
            />

            {errorLogin && (
              <p
                style={{
                  color: '#b42318',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {errorLogin}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={cargando}
              style={{ width: '100%' }}
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ---------- APLICACIÓN ---------- */

  return (
    <div className="app">
      <div className="topbar">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <img
            src={ICONO}
            alt="Logo"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'cover',
              borderRadius: '9px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            }}
          />

          <div>
            <p className="eyebrow">Panel de estudio</p>

            <h1
              className="serif"
              style={{
                margin: 0,
              }}
            >
              Proyectos de interiorismo
            </h1>
          </div>
        </div>

        <div className="top-actions">
          <button
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={guardando}
          >
            Importar
          </button>

          <button
            className="btn"
            onClick={() => exportarJSON(proyectos)}
            disabled={guardando}
          >
            Exportar copia
          </button>

          <button
            className="btn btn-primary"
            onClick={abrirNuevo}
            disabled={guardando}
          >
            + Nuevo proyecto
          </button>

          <button
            className="btn"
            onClick={cerrarSesion}
            disabled={guardando}
          >
            Salir
          </button>
        </div>
      </div>

      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {aviso && (
        <p
          className="mono"
          style={{
            fontSize: '12.5px',
            color: 'var(--accent)',
            margin: '8px 0 0',
          }}
        >
          {aviso}
        </p>
      )}

      {guardando && (
        <p
          className="mono"
          style={{
            fontSize: '12.5px',
            color: 'var(--accent)',
            margin: '8px 0 0',
          }}
        >
          Guardando...
        </p>
      )}

      <hr className="rule" />

      <div className="filters">
        <button
          className={'chip' + (filtro === 'Todos' ? ' active' : '')}
          onClick={() => setFiltro('Todos')}
        >
          Todos ({proyectos.length})
        </button>

        {FASES.map((fase) => (
          <button
            key={fase}
            className={
              'chip' + (filtro === fase ? ' active' : '')
            }
            onClick={() => setFiltro(fase)}
          >
            {fase} (
            {proyectos.filter((p) => p.fase === fase).length}
            )
          </button>
        ))}
      </div>

      {proyectosOrdenados.length === 0 ? (
        <div className="empty">
          <h3 className="serif">
            {proyectos.length === 0
              ? 'Todavía no hay proyectos'
              : 'Ningún proyecto en esta fase'}
          </h3>

          <p>
            {proyectos.length === 0
              ? 'Crea el primero para empezar a ver el estado de tu estudio de un vistazo.'
              : 'Prueba con otro filtro o crea un proyecto nuevo.'}
          </p>
        </div>
      ) : (
        <div className="grid">
          {proyectosOrdenados.map((proyecto) => (
            <ProjectCard
              key={proyecto.id}
              proyecto={proyecto}
              onOpen={() => abrirExistente(proyecto)}
            />
          ))}
        </div>
      )}

      {editando && (
        <ProjectModal
          proyecto={editando}
          onSave={guardar}
          onDelete={eliminar}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  )
}
