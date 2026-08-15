import { useEffect, useRef, useState } from 'react'
import ProjectCard from './components/ProjectCard.jsx'
import ProjectModal from './components/ProjectModal.jsx'
import { supabase } from './supabase.js'
import {
  FASES,
  cargarProyectos,
  guardarProyecto,
  eliminarProyecto,
  nuevoProyecto,
  exportarJSON,
  importarJSON,
} from './storage.js'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const fileInputRef = useRef(null)
  const [avisoImport, setAvisoImport] = useState('')
  const [guardando, setGuardando] = useState(false)

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

          const datos = await cargarProyectos()

          if (activo) {
            setProyectos(datos)
          }
        }
      } catch (error) {
        console.error(error)
        setErrorLogin('No se pudieron cargar los proyectos.')
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
          const datos = await cargarProyectos()

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
        email,
        password,
      })

      if (error) throw error

      setUsuario(data.user)

      const datos = await cargarProyectos()
      setProyectos(datos)
      setPassword('')
    } catch (error) {
      console.error(error)

      setErrorLogin(
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
  }

  function abrirNuevo() {
    setEditando(nuevoProyecto())
  }

  function abrirExistente(p) {
    setEditando(p)
  }

  async function guardar(datos) {
    setGuardando(true)

    try {
      const proyectoGuardado = await guardarProyecto(datos)

      setProyectos((prev) => {
        const existe = prev.some((p) => p.id === proyectoGuardado.id)

        return existe
          ? prev.map((p) =>
              p.id === proyectoGuardado.id ? proyectoGuardado : p
            )
          : [...prev, proyectoGuardado]
      })

      setEditando(null)
    } catch (error) {
      console.error(error)
      alert(`No se pudo guardar el proyecto:\n\n${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await eliminarProyecto(id)

      setProyectos((prev) => prev.filter((p) => p.id !== id))
      setEditando(null)
    } catch (error) {
      console.error(error)
      alert(`No se pudo eliminar el proyecto:\n\n${error.message}`)
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    try {
      const datos = await importarJSON(file)

      const confirmado = confirm(
        `Se han encontrado ${datos.length} proyecto(s) en el archivo. ` +
          `Se añadirán a tus proyectos actuales en la base de datos. ¿Continuar?`
      )

      if (!confirmado) return

      setGuardando(true)

      for (const proyecto of datos) {
        await guardarProyecto(proyecto)
      }

      const actualizados = await cargarProyectos()
      setProyectos(actualizados)

      setAvisoImport(
        `Importados ${datos.length} proyecto(s) correctamente.`
      )

      setTimeout(() => setAvisoImport(''), 4000)
    } catch (error) {
      console.error(error)
      alert(`No se pudieron importar los proyectos:\n\n${error.message}`)
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

  if (cargando) {
    return (
      <div className="app">
        <div className="empty">
          <h3 className="serif">Cargando...</
