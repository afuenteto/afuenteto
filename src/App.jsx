import ProjectHistory from './components/ProjectHistory.jsx'
import StudioDashboard from './components/StudioDashboard.jsx'
import StudioToday from './components/StudioToday.jsx'
import EconomicChart from './components/EconomicChart.jsx'
import { useEffect, useState } from 'react'
import SortableProjectCard from './components/SortableProjectCard'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ProjectModal from './components/ProjectModal.jsx'
import TasksModal from './components/TasksModal.jsx'
import StudioProfile from './components/StudioProfile.jsx'
import { supabase } from './supabase.js'
import {
  FASES,
  nuevoProyecto,
} from './storage.js'

function proyectoDesdeBD(row) {
  return {
    id: row.id,
    prioridad: row.prioridad || 'en_curso',
    orden: row.orden ?? 0,

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
    presupuestoPdf: row.presupuesto_pdf || '',

    notas: row.notas || '',

    tareas: Array.isArray(row.tareas)
      ? row.tareas
      : [],

    proveedores: Array.isArray(row.proveedores)
      ? row.proveedores
      : [],

    tipoProyecto: row.tipo_proyecto || 'Vivienda',

    honorariosDiseno: row.honorarios_diseno ?? '',
    honorariosGestion: row.honorarios_gestion ?? '',
    otrosImportes: row.otros_importes ?? '',

    cobros: Array.isArray(row.cobros)
      ? row.cobros
      : [],

    historial: Array.isArray(row.historial)
      ? row.historial
      : [],

    horasEstimadas: row.horas_estimadas ?? '',
    horasReales: row.horas_reales ?? '',
  }
}
function proyectoParaBD(proyecto, userId) {
  return {
    id: proyecto.id,
    prioridad: proyecto.prioridad || 'en_curso',
    orden: proyecto.orden ?? 0,
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


    
tipo_proyecto: proyecto.tipoProyecto || 'Vivienda',

honorarios_diseno:
  proyecto.honorariosDiseno === '' ||
  proyecto.honorariosDiseno === null
    ? null
    : Number(proyecto.honorariosDiseno),

honorarios_gestion:
  proyecto.honorariosGestion === '' ||
  proyecto.honorariosGestion === null
    ? null
    : Number(proyecto.honorariosGestion),

otros_importes:
  proyecto.otrosImportes === '' ||
  proyecto.otrosImportes === null
    ? null
    : Number(proyecto.otrosImportes),

cobros: proyecto.cobros || [],

horas_estimadas:
  proyecto.horasEstimadas === '' ||
  proyecto.horasEstimadas === null
    ? null
    : Number(proyecto.horasEstimadas),

horas_reales:
  proyecto.horasReales === '' ||
  proyecto.horasReales === null
    ? null
    : Number(proyecto.horasReales),

historial: Array.isArray(proyecto.historial)
  ? proyecto.historial
  : [],
    
presupuesto_pdf: proyecto.presupuestoPdf || null,
    notas: proyecto.notas || '',
    tareas: Array.isArray(proyecto.tareas) ? proyecto.tareas : [],
    
    proveedores: Array.isArray(proyecto.proveedores)
      ? proyecto.proveedores
      : [],
  }
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [editando, setEditando] = useState(null)
  const [tareasAbiertas, setTareasAbiertas] = useState(null)
  const [seccionInicial, setSeccionInicial] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const handleDragEnd = async (event) => {
  const { active, over } = event

  if (!over || active.id === over.id) return

  const nuevos = [...proyectos]

  const oldIndex = nuevos.findIndex(
    (item) => item.id === active.id
  )

  const newIndex = nuevos.findIndex(
    (item) => item.id === over.id
  )

  const [movido] = nuevos.splice(oldIndex, 1)

  nuevos.splice(newIndex, 0, movido)

  const ordenados = nuevos.map((p, index) => ({
    ...p,
    orden: index
  }))

  setProyectos(ordenados)

  for (const proyecto of ordenados) {
    await supabase
      .from('proyectos')
      .update({
        orden: proyecto.orden
      })
      .eq('id', proyecto.id)
  }
}
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
  async function recuperarPassword() {
  if (!email.trim()) {
    alert('Escribe primero tu email para recuperar la contraseña.')
    return
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo:
        window.location.origin,
    }
  )

  if (error) {
    console.error(error)

    alert(
      `No se pudo enviar el correo.\n\n${error.message}`
    )

    return
  }

  alert(
    'Se ha enviado un correo para recuperar la contraseña.'
  )
}
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
    setTareasAbiertas(null)
    setSeccionInicial(null)
  }

  function abrirNuevo() {
    setSeccionInicial(null)
    setEditando(nuevoProyecto())
  }

  function abrirExistente(proyecto, seccion = null) {
    setSeccionInicial(seccion)
    setEditando(proyecto)
  }

  function abrirTareas(proyecto) {
    setTareasAbiertas(proyecto)
  }

  async function guardarTareas(proyectoId, tareas) {
    if (!usuario) return

    setGuardando(true)
    setAviso('')

   try {

  const proyectoActual =
    proyectos.find(
      (p) => p.id === proyectoId
    )


  let historialNuevo =
    proyectoActual?.historial || []


  const tareasAnteriores =
    proyectoActual?.tareas || []


  tareas.forEach((tarea) => {

    const anterior =
      tareasAnteriores.find(
        (t) => t.id === tarea.id
      )


    if (
      tarea.hecha &&
      anterior &&
      !anterior.hecha
    ) {

      historialNuevo = [
        ...historialNuevo,
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          texto: `Tarea completada: ${tarea.texto}`,
          icono: '✓'
        }
      ]

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

  setAviso('Tareas guardadas correctamente.')

  setTimeout(() => setAviso(''), 3000)

} catch (error) {
      console.error(error)
      alert(`No se pudieron guardar las tareas.\n\n${error.message}`)
    } finally {
      setGuardando(false)
    }
  }
function añadirHistorial(proyecto, texto, icono='•') {

  return [
    ...(proyecto.historial || []),
    {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      texto,
      icono
    }
  ]

}
async function guardar(datos) {
  if (!usuario) return

  setGuardando(true)
  setAviso('')

  try {

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

      setAviso('Proyecto guardado correctamente.')
      setTimeout(() => setAviso(''), 3000)
    } catch (error) {
      console.error(error)

      alert(
        `No se pudo guardar el proyecto.\n\n${error.message}`
      )
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
      setSeccionInicial(null)

      setAviso('Proyecto eliminado.')
      setTimeout(() => setAviso(''), 3000)
    } catch (error) {
      console.error(error)

      alert(
        `No se pudo eliminar el proyecto.\n\n${error.message}`
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
  return (a.orden ?? 0) - (b.orden ?? 0)
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
  if (cargando) {
    return (
      <div className="splash">
        <img
          src="/afuenteto/icon-512.png"
          className="splash-logo"
          alt=""
        />
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="app">
        <div
          style={{
            maxWidth: '420px',
            margin: '80px auto',
          }}
        >
         <div className="login-brand">

  <img
    src="/afuenteto/icon-180.png"
    className="login-logo"
    alt=""
  />

  <div>
    <p className="eyebrow">Antonio Fuente</p>

    <h1 className="serif">
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
            <button
  type="button"
  className="btn btn-ghost"
  style={{
    width: '100%',
    marginTop: '12px',
  }}
  onClick={recuperarPassword}
>
  ¿Has olvidado la contraseña?
</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
     <div className="topbar">
  <div className="brand">
<StudioProfile usuario={usuario}>
  <img
    src="/afuenteto/icon-180.png"
    className="app-logo"
    alt=""
  />
</StudioProfile>

    <div>
      <p className="eyebrow">Panel de estudio</p>

      <h1 className="serif">
        Proyectos
      </h1>
    </div>
  </div>

      <div className="top-actions">

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

      <StudioDashboard proyectos={proyectos} />

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
    <div>
      <EconomicChart proyectos={proyectosOrdenados} />

        <StudioToday
        proyectos={proyectos}
        onOpen={abrirExistente}
        onOpenTasks={abrirTareas}
      />


     <DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={proyectosOrdenados.map(p => p.id)}
    strategy={verticalListSortingStrategy}
  >
    <div className="grid">
      {proyectosOrdenados.map((proyecto) => (
        <SortableProjectCard
          key={proyecto.id}
          proyecto={proyecto}
          onOpen={() => abrirExistente(proyecto)}
          onOpenTasks={() => abrirTareas(proyecto)}
        />
      ))}
    </div>
  </SortableContext>
</DndContext>
    </div>
  )}

  {editando && (
    <ProjectModal
      proyecto={editando}
      onSave={guardar}
      onDelete={eliminar}
      seccionInicial={seccionInicial}
      onClose={() => {
        setEditando(null)
        setSeccionInicial(null)
      }}
    />
  )}

  {tareasAbiertas && (
    <TasksModal
      proyecto={tareasAbiertas}
      onSave={guardarTareas}
      onClose={() => setTareasAbiertas(null)}
      guardando={guardando}
    />
  )}

</div>
)
}
