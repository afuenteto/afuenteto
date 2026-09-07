import { t as translateUI, getLanguage, subscribeLanguage } from './i18n.js'
import { proyectoDesdeBD, proyectoParaBD } from './projectModel.js'
import { cargarProyectosDeUsuario } from './modules/projects/index.js'
import { ModulesSettings, modulosDeUsuario, guardarModulosDeUsuario,
  conservarDatosDesactivados, notificarCambioModulos, CLAVE_AVISO_MODULOS } from './modules/preferences/index.js'
import { reordenarProyectos, fechaLocal } from './projectUtils.js'
import StudioDashboard from './components/StudioDashboard.jsx'
import StudioToday from './components/StudioToday.jsx'
import EconomicChart from './components/EconomicChart.jsx'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import SortableProjectCard from './components/SortableProjectCard'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import ProjectModal from './components/ProjectModal.jsx'
import TasksModal from './components/TasksModal.jsx'
import DeliveryModal from './components/DeliveryModal.jsx'
import StudioProfile from './components/StudioProfile.jsx'
import FooterActions from './components/FooterActions.jsx'
import TasksPanel from './components/TasksPanel.jsx'
import DeliveriesPanel from './components/DeliveriesPanel.jsx'
import PaymentsPanel from './components/PaymentsPanel.jsx'
import BlockedPanel from './components/BlockedPanel.jsx'
import ClientModal from './components/ClientModal.jsx'
import ClientsPanel from './components/ClientsPanel.jsx'
import { supabase } from './supabase.js'
import {
  FASES,
  nuevoProyecto,
} from './storage.js'

export default function App() {
  useSyncExternalStore(subscribeLanguage, getLanguage, () => 'es')
  const [usuario, setUsuario] = useState(null)
  const modulos = useMemo(() => modulosDeUsuario(usuario), [usuario])
  const [configurandoModulos, setConfigurandoModulos] = useState(false)
  const [guardandoModulos, setGuardandoModulos] = useState(false)
  const usuarioActualRef = useRef(null)
  const revisionUsuarioRef = useRef(0)
  usuarioActualRef.current = usuario?.id
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [clientes, setClientes] = useState([])
  const [clienteAbierto, setClienteAbierto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [tareasAbiertas, setTareasAbiertas] = useState(null)
  const [entregaAbierta, setEntregaAbierta] = useState(null)
  const [seccionInicial, setSeccionInicial] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [ordenProyectos, setOrdenProyectos] = useState('fecha')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [panelAbierto, setPanelAbierto] = useState(null)
  const [informacionAbierta, setInformacionAbierta] = useState(null)
  const [enviandoContacto, setEnviandoContacto] = useState(false)
  const operacionRef = useRef(false)
  const [errorCarga, setErrorCarga] = useState('')
  const [intentoCarga, setIntentoCarga] = useState(0)
  const [recuperando, setRecuperando] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const splashInicioRef = useRef(Date.now())
  const [splashTerminado, setSplashTerminado] = useState(false)

  useEffect(() => {
    if (cargando) {
      setSplashTerminado(false)
      return undefined
    }

    const ciclo = 1300
    const timer = setTimeout(() => setSplashTerminado(true), ciclo)

    return () => clearTimeout(timer)
  }, [cargando])

  const handleDragEnd = async ({ active, over }) => {
    if (!usuario || !over || active.id === over.id || guardando || operacionRef.current) return
    const ordenados = reordenarProyectos(proyectos, proyectosOrdenados.map(p => p.id), active.id, over.id)
    if (ordenados === proyectos) return
    operacionRef.current = true
    setGuardando(true)
    try {
      for (const proyecto of ordenados) {
        const { error } = await supabase.from('proyectos').update({ orden: proyecto.orden })
          .eq('id', proyecto.id).eq('user_id', usuario.id).select('id').single()
        if (error) throw error
      }
      setProyectos(ordenados)
    } catch (error) {
      setAviso(translateUI("No se pudo guardar todo el orden: ") + error.message)
      setIntentoCarga(n => n + 1)
    } finally {
      operacionRef.current = false
      setGuardando(false)
    }
  }

async function cargarClientes(user) {

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('user_id', user.id)
    .order('nombre')

  if (error) {
    console.error(error)
    throw error
  }

  return data || []

}


useEffect(() => {
    let activo = true
    function actualizarPerfil(token, propietario) {
      const revision = ++revisionUsuarioRef.current
      // Consultar fuera del callback de Auth evita bloquear el cerrojo de su sesión.
      queueMicrotask(() => {
        if (!activo) return
        supabase.auth.getUser(token).then(({ data, error }) => {
          if (!error && activo && revision === revisionUsuarioRef.current &&
            usuarioActualRef.current === propietario && data?.user?.id === propietario) {
            setUsuario(data.user)
          }
        }).catch(error => console.error('ERROR ACTUALIZANDO PREFERENCIAS:', error))
      })
    }
    function cambioPreferencias(event) {
      if (event.key !== CLAVE_AVISO_MODULOS || !event.newValue) return
      try {
        const { usuarioId: propietario } = JSON.parse(event.newValue)
        if (propietario && propietario === usuarioActualRef.current) actualizarPerfil(undefined, propietario)
      } catch { /* Ignorar notificaciones inválidas de otras pestañas. */ }
    }
    window.addEventListener('storage', cambioPreferencias)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) return
      const cambioDeCuenta = usuarioActualRef.current !== session?.user?.id
      usuarioActualRef.current = session?.user?.id
      ++revisionUsuarioRef.current
      setUsuario(actual => !cambioDeCuenta && actual && session
        ? { ...session.user, user_metadata: actual.user_metadata }
        : session?.user ?? null)
      if (session) actualizarPerfil(session.access_token, session.user.id)
      if (cambioDeCuenta) {
        setConfigurandoModulos(false)
        setProyectos([])
        setClientes([])
        setEditando(null)
        setTareasAbiertas(null)
        setEntregaAbierta(null)
        setClienteAbierto(null)
        setPanelAbierto(null)
        setSeccionInicial(null)
        setInformacionAbierta(null)
        setAviso('')
        setErrorCarga('')
        setCargando(Boolean(session))
      }
      if (event === 'PASSWORD_RECOVERY') setRecuperando(true)
      if (!session) {
        setConfigurandoModulos(false)
        setProyectos([])
        setClientes([])
        setEditando(null)
        setTareasAbiertas(null)
        setEntregaAbierta(null)
        setClienteAbierto(null)
        setPanelAbierto(null)
        setSeccionInicial(null)
        setRecuperando(false)
        setAviso('')
        setErrorCarga('')
        setCargando(false)
      }
    })
    supabase.auth.getSession().then(({ error }) => {
      if (activo && error) { setErrorLogin(error.message); setCargando(false) }
    }).catch(error => {
      if (activo) { setErrorLogin(error.message); setCargando(false) }
    })
    return () => { activo = false; subscription.unsubscribe(); window.removeEventListener('storage', cambioPreferencias) }
  }, [])

  const usuarioId = usuario?.id
  useEffect(() => {
    setConfigurandoModulos(false)
  }, [usuarioId])

  useEffect(() => {
    if (!modulos.tareas) setTareasAbiertas(null)
    if (!modulos.entregas) setEntregaAbierta(null)
    if (!modulos.clientes) setClienteAbierto(null)
    setPanelAbierto(actual => {
      const modulo = { tareas: 'tareas', entregas: 'entregas', clientes: 'clientes', cobros: 'economia' }[actual]
      return modulo && !modulos[modulo] ? null : actual
    })
  }, [modulos])
  useEffect(() => {
    if (!usuarioId) return
    let activo = true
    setCargando(true)
    setErrorCarga('')
    Promise.all([cargarProyectosDeUsuario(usuarioId), cargarClientes({ id: usuarioId })])
      .then(([datos, datosClientes]) => {
        if (activo) { setProyectos(datos); setClientes(datosClientes) }
      })
      .catch(error => { if (activo) setErrorCarga(error.message) })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [usuarioId, intentoCarga])

  async function actualizarPassword(e) {
    e.preventDefault()
    setGuardando(true)
    setErrorLogin('')
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
      if (error) throw error
      setRecuperando(false)
      setNuevaPassword('')
      setAviso(translateUI("Contraseña actualizada."))
    } catch (error) { setErrorLogin(error.message) }
    finally { setGuardando(false) }
  }
  async function recuperarPassword() {
  if (!email.trim()) {
    alert(translateUI("Escribe primero tu email para recuperar la contraseña."))
    return
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo:
        new URL(import.meta.env.BASE_URL, window.location.href).href,
    }
  )

  if (error) {
    console.error(error)

    alert(
      translateUI("No se pudo enviar el correo.\n\n{0}", { 0: error.message })
    )

    return
  }

  alert(
    translateUI("Se ha enviado un correo para recuperar la contraseña.")
  )
}
  async function iniciarSesion(e) {
    e.preventDefault()

    setErrorLogin('')
    setCargando(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      setPassword('')
    } catch (error) {
      console.error(error)

      setErrorLogin(
        error.message ||
          translateUI("No se ha podido iniciar sesión. Comprueba el email y la contraseña.")
      )
      setCargando(false)
    }
  }

  async function cerrarSesion() {
    if (guardandoModulos) return
    const { error } = await supabase.auth.signOut()
    if (error) { setAviso(translateUI("No se pudo cerrar la sesión: ") + error.message); return }
    setUsuario(null)
    setProyectos([])
    setEditando(null)
    setTareasAbiertas(null)
    setEntregaAbierta(null)
    setSeccionInicial(null)
  }

  async function guardarConfiguracionModulos(seleccion) {
    if (!usuario || operacionRef.current) throw new Error('No se puede guardar ahora.')
    const propietario = usuario.id
    operacionRef.current = true
    setGuardandoModulos(true)
    try {
      const actualizado = await guardarModulosDeUsuario(propietario, seleccion)
      if (usuarioActualRef.current !== propietario) throw new Error('La sesión ha cambiado.')
      ++revisionUsuarioRef.current
      setUsuario(actualizado)
      notificarCambioModulos(propietario)
      setAviso(translateUI('Configuración guardada.'))
      setTimeout(() => setAviso(''), 3000)
    } finally {
      operacionRef.current = false
      setGuardandoModulos(false)
    }
  }

  function abrirNuevo() {
    setSeccionInicial(null)
    setEditando({ ...nuevoProyecto(), orden: Math.max(-1, ...proyectos.map(p => p.orden ?? 0)) + 1 })
  }

function abrirExistente(proyecto, seccion = null) {

  setPanelAbierto(null)
  setSeccionInicial(seccion)
  setEditando(proyecto)
}

  function abrirTareas(proyecto) {
    if (!modulos.tareas) return
    setPanelAbierto(null)
    setTareasAbiertas(proyecto)
  }

  function abrirEntrega(proyecto) {
    if (!modulos.entregas) return
    setPanelAbierto(null)
    setEntregaAbierta(proyecto)
  }

async function guardarTareas(proyectoId, tareas) {
  if (!usuario || !modulos.tareas || operacionRef.current) return
  operacionRef.current = true

  setGuardando(true)
  setAviso('')

  try {

    const proyectoActual = proyectos.find(
      (p) => p.id === proyectoId
    )

    let historialNuevo = [
      ...(proyectoActual?.historial || [])
    ]

    const tareasAnteriores =
      proyectoActual?.tareas || []


    tareas.forEach((tarea) => {

      const anterior = tareasAnteriores.find(
        (t) => t.id === tarea.id
      )


      if (
        tarea.hecha &&
        !anterior?.hecha
      ) {

        historialNuevo.push({
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          texto: `Tarea completada: ${tarea.texto}`,
          icono: '✓'
        })

      }

    })


    const { error } = await supabase
      .from('proyectos')
      .update({
        tareas,
        historial: historialNuevo
      })
      .eq('id', proyectoId)
      .eq('user_id', usuario.id)
      .select('id').single()

    if (error) throw error


    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyectoId
          ? {
              ...p,
              tareas,
              historial: historialNuevo
            }
          : p
      )
    )


    setTareasAbiertas(null)

    setAviso(translateUI("Tareas guardadas correctamente."))

    setTimeout(() => setAviso(''), 3000)


  } catch (error) {

    console.error(error)

    alert(
      translateUI("No se pudieron guardar las tareas.\n\n{0}", { 0: error.message })
    )

  } finally {

    operacionRef.current = false
    setGuardando(false)

  }
}
  async function completarTareaDesdePanel(proyectoId, tareaId) {
    if (!usuario || !modulos.tareas || operacionRef.current) return false
    const proyecto = proyectos.find(p => p.id === proyectoId)
    const tarea = proyecto?.tareas.find(t => t.id === tareaId)
    if (!tarea || tarea.hecha) return false
    operacionRef.current = true
    setGuardando(true)
    const tareas = proyecto.tareas.map(t => t.id === tareaId
      ? { ...t, hecha: true, fechaCompletada: fechaLocal() } : t)
    const historial = [...(proyecto.historial || []), {
      id: crypto.randomUUID(), fecha: new Date().toISOString(),
      texto: 'Tarea completada: ' + tarea.texto, icono: '✓'
    }]
    try {
      const { error } = await supabase.from('proyectos').update({ tareas, historial })
        .eq('id', proyectoId).eq('user_id', usuario.id).select('id').single()
      if (error) throw error
      setProyectos(prev => prev.map(p => p.id === proyectoId ? { ...p, tareas, historial } : p))
      return true
    } catch (error) {
      alert(translateUI("No se pudo completar la tarea: ") + error.message)
      return false
    } finally {
      operacionRef.current = false
      setGuardando(false)
    }
  }
async function guardar(datos) {
  if (!usuario || operacionRef.current) return
  datos = conservarDatosDesactivados(datos, proyectos.find(p => p.id === datos.id), modulos)
  operacionRef.current = true

  setGuardando(true)
  setAviso('')

  try {

    // Crear cliente si no existe todavía
    if (modulos.clientes && datos.cliente) {

      const clienteExiste = clientes.some(
        (c) =>
          c.nombre.toLowerCase().trim() ===
          datos.cliente.toLowerCase().trim()
      )


      if (!clienteExiste) {

        const { data: nuevoCliente, error: errorCliente } =
          await supabase
            .from('clientes')
            .insert({
              user_id: usuario.id,
              nombre: datos.cliente,
              telefono: datos.telefono || '',
              email: datos.email || '',
              direccion: datos.direccion || ''
            })
            .select()
            .single()


        if (errorCliente) {
          throw errorCliente
        }


        setClientes((prev) => [
          ...prev,
          nuevoCliente
        ])

      }

    }
// Comprobar cambios en cliente existente
if (modulos.clientes && datos.cliente) {

  const clienteActual =
    clientes.find(
      (c) =>
        c.nombre.toLowerCase().trim() ===
        datos.cliente.toLowerCase().trim()
    )


  if (clienteActual) {

    const cambios =
      clienteActual.telefono !== datos.telefono ||
      clienteActual.email !== datos.email ||
      clienteActual.direccion !== datos.direccion


    if (cambios) {

      const actualizar =
        window.confirm(
          translateUI("Los datos de {0} han cambiado.\n\n¿Actualizar ficha del cliente?", { 0: clienteActual.nombre })
        )


      if (actualizar) {

        const { error } =
          await supabase
            .from('clientes')
            .update({
              telefono: datos.telefono || '',
              email: datos.email || '',
              direccion: datos.direccion || ''
            })
            .eq('id', clienteActual.id)
            .eq('user_id', usuario.id)


        if (error) {
          throw error
        }


        setClientes((prev) =>
          prev.map((c) =>
            c.id === clienteActual.id
              ? {
                  ...c,
                  telefono: datos.telefono,
                  email: datos.email,
                  direccion: datos.direccion
                }
              : c
          )
        )

      }

    }

  }

}

    if (!datos.historial || datos.historial.length === 0) {
      datos.historial = [
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          texto: 'Proyecto creado',
          icono: '✨'
        }
      ]
    }
    const anteriores = proyectos.find(p => p.id === datos.id)?.tareas || []
    datos = { ...datos, historial: [...(datos.historial || [])] }
    for (const tarea of datos.tareas || []) {
      if (tarea.hecha && !anteriores.find(t => t.id === tarea.id)?.hecha) {
        datos.historial.push({ id: crypto.randomUUID(), fecha: new Date().toISOString(),
          texto: 'Tarea completada: ' + tarea.texto, icono: '✓' })
      }
    }
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
      setSeccionInicial(null)

      setAviso(translateUI("Proyecto guardado correctamente."))
      setTimeout(() => setAviso(''), 3000)
      return true
    } catch (error) {
      console.error(error)

      alert(
        translateUI("No se pudo guardar el proyecto.\n\n{0}", { 0: error.message })
      )
      return false
    } finally {
      operacionRef.current = false
      setGuardando(false)
    }
  }
async function eliminarCliente(cliente) {
  if (!usuario || !modulos.clientes) return

  const tieneProyectos =
    proyectos.some(
      p => p.cliente.trim().toLowerCase() === cliente.nombre.trim().toLowerCase()
    )


  if (tieneProyectos) {

    alert(
      translateUI("No se puede eliminar este cliente porque tiene proyectos asociados.")
    )

    return

  }


  const { error } =
    await supabase
      .from('clientes')
      .delete()
      .eq('id', cliente.id)
      .eq('user_id', usuario.id)


  if (error) {

    console.error(error)
    alert(error.message)
    return

  }


  setClientes(prev =>
    prev.filter(
      c => c.id !== cliente.id
    )
  )


  setClienteAbierto(null)

}
  async function cambiarEstadoProyecto(id, estado) {
    if (!usuario || operacionRef.current) return

    const proyecto = proyectos.find((p) => p.id === id)
    if (!proyecto) return

    const confirmado = confirm(
      estado === 'finalizado'
        ? translateUI("¿Finalizar este proyecto? Podrás reabrirlo cuando quieras.")
        : translateUI("¿Reabrir este proyecto? Volverá a los proyectos activos.")
    )

    if (!confirmado) return

    operacionRef.current = true
    setGuardando(true)
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .update({ estado })
        .eq('id', id)
        .eq('user_id', usuario.id)
        .select()
        .single()

      if (error) throw error

      const actualizado = proyectoDesdeBD(data)
      setProyectos((prev) =>
        prev.map((p) => (p.id === id ? actualizado : p))
      )
      setEditando(actualizado)
      setAviso(estado === 'finalizado' ? translateUI("Proyecto finalizado.") : translateUI("Proyecto reabierto."))
      setTimeout(() => setAviso(''), 3000)
    } catch (error) {
      console.error(error)
      alert(
        translateUI("No se pudo actualizar el estado del proyecto.\n\n{0}", { 0: error.message })
      )
    } finally {
      operacionRef.current = false
      setGuardando(false)
    }
  }

  async function eliminar(id) {
    if (!usuario || operacionRef.current) return

    const confirmado = confirm(
      translateUI("¿Eliminar este proyecto? Esta acción no se puede deshacer.")
    )

    if (!confirmado) return

    operacionRef.current = true
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
      setSeccionInicial(null)

      setAviso(translateUI("Proyecto eliminado."))
      setTimeout(() => setAviso(''), 3000)
    } catch (error) {
      console.error(error)

      alert(
        translateUI("No se pudo eliminar el proyecto.\n\n{0}", { 0: error.message })
      )
    } finally {
      operacionRef.current = false
      setGuardando(false)
    }
  }

  const proyectosActivos = proyectos.filter((p) => p.estado !== 'finalizado')
  const proyectosFinalizados = proyectos.filter((p) => p.estado === 'finalizado')

  const proyectosFiltrados =
    filtro === 'Todos'
      ? proyectosActivos
      : filtro === 'Finalizados'
        ? proyectosFinalizados
        : proyectosActivos.filter((p) => p.fase === filtro)

const proyectosOrdenados = [...proyectosFiltrados].sort((a, b) => {
  if (ordenProyectos === 'importancia') {
    return (Number(b.importancia) || 5) - (Number(a.importancia) || 5)
  }

  const fechaA = a.fechaEntrega || '9999-12-31'
  const fechaB = b.fechaEntrega || '9999-12-31'

  return fechaA.localeCompare(fechaB) || (a.orden ?? 0) - (b.orden ?? 0)
})

  /*
   * PANTALLA DE ENTRADA
   *
   * Solo aparece el icono.
   * No hay título ni subtítulo.
   *
   * La ruta corresponde al icono que ya tienes
   * dentro de la carpeta assets.
   */
  if (cargando || !splashTerminado) {
    return (
      <div className="splash">
        <img
          src={import.meta.env.BASE_URL + "icon-512.png"}
          className="splash-logo"
          alt=""
        />
      </div>
    )
  }

  if (recuperando && usuario) {
    return <div className="app"><form onSubmit={actualizarPassword}>
      <h1 className="serif">{translateUI("Nueva contraseña")}</h1>
      <label htmlFor="nueva-password">{translateUI("Contraseña (mínimo 6 caracteres)")}</label>
      <input id="nueva-password" type="password" autoComplete="new-password" minLength={6} required
        value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} />
      {errorLogin && <p role="alert">{errorLogin}</p>}
      <button className="btn btn-primary" disabled={guardando}>{translateUI("Guardar contraseña")}</button>
    </form><FooterActions onLogout={cerrarSesion} disabled={guardando} /></div>
  }
  if (usuario && errorCarga) {
    return <div className="app">
      <h1 className="serif">{translateUI("No se pudieron cargar los datos")}</h1>
      <p role="alert">{errorCarga}</p>
      <button className="btn" onClick={() => setIntentoCarga(n => n + 1)}>{translateUI("Reintentar")}</button>
      <FooterActions onLogout={cerrarSesion} disabled={guardando} />
    </div>
  }
  if (!usuario) {
    return (
      <div className="app app-login">
        <div
          style={{
            maxWidth: '420px',
            margin: '80px auto',
          }}
        >
         <div className="login-brand">

  <img
    src={import.meta.env.BASE_URL + "icon-180.png"}
    className="login-logo"
    alt=""
  />

  <div>
    <p className="eyebrow">{translateUI("Antonio Fuente")}</p>

    <h1 className="serif">{translateUI("Proyectos")}</h1>
  </div>

</div>

          <hr className="rule" />

          <form onSubmit={iniciarSesion}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
              }}
            >{translateUI("Email")}</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '18px',
              }}
            />

            <label
              style={{
                display: 'block',
                marginBottom: '8px',
              }}
            >{translateUI("Contraseña")}</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '18px',
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
            >{translateUI("Entrar")}</button>
            <button
  type="button"
  className="btn btn-ghost"
  style={{
    width: '100%',
    marginTop: '12px',
  }}
  onClick={recuperarPassword}
>{translateUI("¿Has olvidado la contraseña?")}</button>
          </form>
        </div>
        <FooterActions />
      </div>
    )
  }

  return (
    <div className="app">
     <div className="topbar">
  <div className="brand">
<StudioProfile usuario={usuario}>
  <img
    src={import.meta.env.BASE_URL + "icon-180.png"}
    className="app-logo"
    alt=""
  />
</StudioProfile>

    <div>
      <p className="eyebrow">{translateUI("Panel de estudio")}</p>

      <h1 className="serif">{translateUI("Proyectos")}</h1>
    </div>
  </div>

      <div className="top-actions">

  <button
    className="btn btn-primary"
    onClick={abrirNuevo}
    disabled={guardando}
  >{translateUI("+ Nuevo proyecto")}</button>
        
{modulos.clientes && <button
  className="btn"
  onClick={() => setPanelAbierto('clientes')}
>{translateUI("👥 Clientes")}</button>}

<button type="button" className="btn" disabled={guardando || guardandoModulos}
  onClick={() => setConfigurandoModulos(true)}>{translateUI('Módulos')}</button>
        
</div>
</div>
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
        >{translateUI("Guardando...")}</p>
      )}

      <div className="study-overview-stack">
        <StudioToday
          modulos={modulos}
          proyectos={proyectosActivos}
          onOpen={abrirExistente}
          onOpenTasks={abrirTareas}
          setPanelAbierto={setPanelAbierto}
        />

      </div>

      <hr className="rule" />

      <div className="filters">
        <div className="filter-row filter-row-categories">
        <button
          className={'chip' + (filtro === 'Todos' ? ' active' : '')}
          onClick={() => setFiltro('Todos')}
        >{translateUI("Todos (")}{proyectosActivos.length})
        </button>

        {FASES.map((fase) => (
          <button
            key={fase}
            className={
              'chip' + (filtro === fase ? ' active' : '')
            }
            onClick={() => setFiltro(fase)}
          >
            {translateUI(fase)} (
            {proyectosActivos.filter((p) => p.fase === fase).length}
            )
          </button>
        ))}

        <button
          className={'chip' + (filtro === 'Finalizados' ? ' active' : '')}
          onClick={() => setFiltro('Finalizados')}
        >{translateUI("Finalizados (")}{proyectosFinalizados.length})
        </button>

        </div>

        <div className="filter-row filter-row-sorting">
        <button
          className={'chip' + (ordenProyectos === 'fecha' ? ' active' : '')}
          onClick={() => setOrdenProyectos('fecha')}
        >{translateUI("Fecha")}</button>

        <button
          className={'chip' + (ordenProyectos === 'importancia' ? ' active' : '')}
          onClick={() => setOrdenProyectos('importancia')}
        >{translateUI("Importancia")}</button>
        </div>
      </div>


      {proyectosOrdenados.length === 0 ? (
        <div className="empty">
          <h3 className="serif">
            {proyectos.length === 0
              ? translateUI("Todavía no hay proyectos")
              : translateUI("Ningún proyecto en esta fase")}
          </h3>

          <p>
            {proyectos.length === 0
              ? translateUI("Crea el primero para empezar a ver el estado de tu estudio de un vistazo.")
              : translateUI("Prueba con otro filtro o crea un proyecto nuevo.")}
          </p>
        </div>

       ) : (
    <div>
     <DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={proyectosOrdenados.map(p => p.id)}
    strategy={rectSortingStrategy}
  >
    <div className="grid">
      {proyectosOrdenados.map((proyecto) => (
        <SortableProjectCard
          modulos={modulos}
          key={proyecto.id}
          proyecto={proyecto}
          onOpen={() => abrirExistente(proyecto)}
          onOpenTasks={() => abrirTareas(proyecto)}
            onOpenDelivery={() => abrirEntrega(proyecto)}
        />
      ))}
    </div>

  </SortableContext>
</DndContext>
    </div>
  )}

 {editando && (
  <>


   <ProjectModal
  modulos={modulos}
  key={editando.id}
  guardando={guardando}
  proyecto={editando}
  clientes={clientes}
  usuario={usuario}
  setClientes={setClientes}
  onOpenClient={setClienteAbierto}
  onSave={guardar}
  onDelete={eliminar}
  onFinalize={() => cambiarEstadoProyecto(editando.id, 'finalizado')}
  onReopen={() => cambiarEstadoProyecto(editando.id, 'activo')}
  seccionInicial={seccionInicial}
  onClose={() => {
    setEditando(null)
    setSeccionInicial(null)
  }}
/>
  </>
)}
     
{modulos.tareas && panelAbierto === 'tareas' && (
  <TasksPanel
  modulos={modulos}
  proyectos={proyectosActivos}
  onClose={() => setPanelAbierto(null)}
  onOpenTasks={abrirTareas}
  onCompleteTask={completarTareaDesdePanel}
/>
  
)}
{modulos.clientes && panelAbierto === 'clientes' && (
  <ClientsPanel
    clientes={clientes}
    onOpenClient={(cliente)=>{
      setPanelAbierto(null)
      setClienteAbierto(cliente)
    }}
    onClose={() =>
      setPanelAbierto(null)
    }
  />

)}
{modulos.entregas && panelAbierto === 'entregas' && (
  <DeliveriesPanel
    modulos={modulos}
    proyectos={proyectosActivos}
    onClose={() => setPanelAbierto(null)}
    onOpen={abrirExistente}
  />
)}

{modulos.economia && panelAbierto === 'cobros' && (
  <PaymentsPanel
    modulos={modulos}
    proyectos={proyectosActivos}
    onClose={() => setPanelAbierto(null)}
    onOpen={abrirExistente}
  />
)}

{panelAbierto === 'bloqueados' && (
  <BlockedPanel
    modulos={modulos}
    proyectos={proyectosActivos}
    onClose={() => setPanelAbierto(null)}
    onOpen={abrirExistente}
  />
)}
{modulos.clientes && clienteAbierto && (
  <ClientModal
    modulos={modulos}
    key={clienteAbierto.id}
    usuario={usuario}
    clientes={clientes}
    onClientUpdated={(actualizado, nombreAnterior) => {
      setClienteAbierto(actualizado)
      setProyectos(prev => prev.map(p => p.cliente === nombreAnterior ? { ...p, cliente: actualizado.nombre } : p))
      setEditando(prev => prev?.cliente === nombreAnterior ? { ...prev, cliente: actualizado.nombre } : prev)
    }}
    cliente={clienteAbierto}
    proyectos={proyectos}
    setClientes={setClientes}
    onDeleteClient={eliminarCliente}
 onOpenProject={(proyecto) => {

  setClienteAbierto(null)

  setSeccionInicial(null)

  setEditando({
    ...proyecto
  })

}}

    onClose={() => setClienteAbierto(null)}
  />
)}

{modulos.tareas && tareasAbiertas && (
  <TasksModal
    key={tareasAbiertas.id}
    proyecto={tareasAbiertas}
    onSave={guardarTareas}
    onClose={() => setTareasAbiertas(null)}
    guardando={guardando}
  />
)}

{modulos.entregas && entregaAbierta && (
  <DeliveryModal
    modulos={modulos}
    key={entregaAbierta.id}
    proyecto={entregaAbierta}
    guardando={guardando}
    onClose={() => setEntregaAbierta(null)}
    onSave={async (datos) => {
      const guardado = await guardar(datos)
      if (guardado) setEntregaAbierta(null)
    }}
    onOpenProject={(proyecto) => {
      setEntregaAbierta(null)
      abrirExistente(proyecto)
    }}
  />
)}

{configurandoModulos && (
  <ModulesSettings key={usuario.id} modulos={modulos}
    onSave={guardarConfiguracionModulos} onClose={() => setConfigurandoModulos(false)} />
)}

{informacionAbierta && (
  <div
    className="overlay"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) setInformacionAbierta(null)
    }}
  >
    <section className="modal footer-info-modal" aria-labelledby="footer-info-title">
      <div className="modal-head">
        <h2 id="footer-info-title" className="serif">
          {informacionAbierta === 'legal' && translateUI("Aviso legal")}
          {informacionAbierta === 'privacidad' && translateUI("Privacidad")}
          {informacionAbierta === 'condiciones' && translateUI("Condiciones de uso")}
          {informacionAbierta === 'contacto' && translateUI("Contacto")}
        </h2>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setInformacionAbierta(null)}
          aria-label={translateUI("Cerrar")}
        >
          ✕
        </button>
      </div>

      {informacionAbierta === 'legal' && (
        <div className="footer-info-content">
          <p>{translateUI("Fuente Studio utiliza esta aplicación para gestionar proyectos, clientes, tareas y documentación de trabajo.")}</p>
          <p>{translateUI("La información mostrada pertenece al usuario autenticado y debe utilizarse únicamente para la gestión profesional de su actividad.")}</p>
          <p>{translateUI("Los datos identificativos y fiscales del titular deberán completarse antes de publicar esta información como texto legal definitivo.")}</p>
        </div>
      )}

      {informacionAbierta === 'privacidad' && (
        <div className="footer-info-content">
          <p>{translateUI("Los datos se almacenan en Supabase y se asocian a la cuenta autenticada del usuario.")}</p>
          <p>{translateUI("La aplicación utiliza los datos introducidos para organizar proyectos, clientes, cobros, tareas y documentos.")}</p>
          <p>{translateUI("No introduzcas información que no sea necesaria para la gestión profesional del proyecto. El titular deberá completar la información legal y los plazos de conservación conforme a su actividad y jurisdicción.")}</p>
        </div>
      )}

      {informacionAbierta === 'condiciones' && (
        <div className="footer-info-content">
          <p>{translateUI("El acceso a la aplicación es personal y debe protegerse con credenciales seguras.")}</p>
          <p>{translateUI("El usuario es responsable de la exactitud de los datos introducidos y de conservar copias de seguridad adecuadas.")}</p>
          <p>{translateUI("La aplicación es una herramienta de gestión y no sustituye asesoramiento legal, fiscal o profesional.")}</p>
        </div>
      )}

      {informacionAbierta === 'contacto' && (
        <form
          className="footer-contact-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const formulario = event.currentTarget
            const formData = new FormData(formulario)
            const nombre = formData.get('nombre')
            const email = formData.get('email')
            const asunto = formData.get('asunto')
            const mensaje = formData.get('mensaje')

            setEnviandoContacto(true)
            try {
              const { error } = await supabase
                .from('mensajes_contacto')
                .insert({
                  user_id: usuario.id,
                  nombre,
                  email,
                  asunto,
                  mensaje
                })

              if (error) throw error

              const { error: emailError } = await supabase.functions.invoke(
                'send-contact-email',
                {
                  body: { nombre, email, asunto, mensaje }
                }
              )

              if (emailError) throw emailError

              formulario.reset()
              setAviso(translateUI("Mensaje enviado correctamente."))
              setInformacionAbierta(null)
              setTimeout(() => setAviso(''), 3000)
            } catch (error) {
              console.error('ERROR MENSAJE CONTACTO:', error)
              alert(translateUI("No se pudo enviar el mensaje.\n\n{0}", { 0: error.message }))
            } finally {
              setEnviandoContacto(false)
            }
          }}
        >
          <p className="footer-contact-intro">{translateUI("Envíanos tu consulta y la guardaremos de forma segura para poder atenderla.")}</p>

          <label htmlFor="contact-name">{translateUI("Nombre")}</label>
          <input id="contact-name" name="nombre" required />

          <label htmlFor="contact-email">{translateUI("Tu email")}</label>
          <input id="contact-email" name="email" type="email" required />

          <label htmlFor="contact-subject">{translateUI("Asunto")}</label>
          <input id="contact-subject" name="asunto" required />

          <label htmlFor="contact-message">{translateUI("Mensaje")}</label>
          <textarea id="contact-message" name="mensaje" rows="5" required />

          <button type="submit" className="btn btn-primary footer-contact-submit" disabled={enviandoContacto}>
            {enviandoContacto ? translateUI("Enviando…") : translateUI("Enviar")}
          </button>
        </form>
      )}
    </section>
  </div>
)}

<div className="study-overview-stack study-overview-bottom">
  {modulos.economia && <EconomicChart proyectos={proyectosOrdenados} />}
  <StudioDashboard
    modulos={modulos}
    proyectos={proyectosActivos}
    clientes={clientes}
    onOpenTasks={() => setPanelAbierto('tareas')}
    onOpenDeliveries={() => setPanelAbierto('entregas')}
    onOpenPayments={() => setPanelAbierto('cobros')}
    onFilterPhase={(fase) => setFiltro(fase)}
    onShowAll={() => setFiltro('Todos')}
  />
</div>

<footer className="app-footer">

  <div className="app-footer-links">
    <button type="button" onClick={() => setInformacionAbierta('legal')}>{translateUI("Aviso legal")}</button>

    <button type="button" onClick={() => setInformacionAbierta('privacidad')}>{translateUI("Privacidad")}</button>

    <button type="button" onClick={() => setInformacionAbierta('condiciones')}>{translateUI("Condiciones de uso")}</button>

    <button type="button" onClick={() => setInformacionAbierta('contacto')}>{translateUI("Contacto")}</button>
  </div>

  <div className="app-footer-copy">{translateUI("© 2026 Fuente Studio · Gestión de proyectos ·")}{' '}
    <a
      href="https://www.beusual.com/"
      target="_blank"
      rel="noreferrer"
    >{translateUI("Beusual")}</a>{' '}{translateUI("v1.0")}</div>

  <FooterActions onLogout={cerrarSesion} disabled={guardando || guardandoModulos} />

</footer>

</div>
)
}
