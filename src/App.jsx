import { useEffect, useRef, useState } from 'react'
import ProjectCard from './components/ProjectCard.jsx'
import ProjectModal from './components/ProjectModal.jsx'
import {
  FASES,
  cargarProyectos,
  guardarProyectos,
  nuevoProyecto,
  exportarJSON,
  importarJSON,
} from './storage.js'

export default function App() {
  const [proyectos, setProyectos] = useState(() => cargarProyectos())
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const fileInputRef = useRef(null)
  const [avisoImport, setAvisoImport] = useState('')

  useEffect(() => {
    guardarProyectos(proyectos)
  }, [proyectos])

  function abrirNuevo() {
    setEditando(nuevoProyecto())
  }

  function abrirExistente(p) {
    setEditando(p)
  }

  function guardar(datos) {
    setProyectos((prev) => {
      const existe = prev.some((p) => p.id === datos.id)
      return existe ? prev.map((p) => (p.id === datos.id ? datos : p)) : [...prev, datos]
    })
    setEditando(null)
  }

  function eliminar(id) {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return
    setProyectos((prev) => prev.filter((p) => p.id !== id))
    setEditando(null)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const datos = await importarJSON(file)
      const confirmado = confirm(
        `Se han encontrado ${datos.length} proyecto(s) en el archivo. Esto sustituirá tus proyectos actuales en este navegador. ¿Continuar?`
      )
      if (confirmado) {
        setProyectos(datos)
        setAvisoImport(`Importados ${datos.length} proyecto(s) correctamente.`)
        setTimeout(() => setAvisoImport(''), 4000)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const proyectosFiltrados =
    filtro === 'Todos' ? proyectos : proyectos.filter((p) => p.fase === filtro)

  const proyectosOrdenados = [...proyectosFiltrados].sort((a, b) => {
    if (!a.fechaEntrega) return 1
    if (!b.fechaEntrega) return -1
    return a.fechaEntrega.localeCompare(b.fechaEntrega)
  })

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <p className="eyebrow">Panel de estudio</p>
          <h1 className="serif">Proyectos de interiorismo</h1>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            Importar
          </button>
          <button className="btn" onClick={() => exportarJSON(proyectos)}>
            Exportar copia
          </button>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo proyecto
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
      {avisoImport && (
        <p className="mono" style={{ fontSize: 12.5, color: 'var(--accent)', margin: '8px 0 0' }}>
          {avisoImport}
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
        {FASES.map((f) => (
          <button
            key={f}
            className={'chip' + (filtro === f ? ' active' : '')}
            onClick={() => setFiltro(f)}
          >
            {f} ({proyectos.filter((p) => p.fase === f).length})
          </button>
        ))}
      </div>

      {proyectosOrdenados.length === 0 ? (
        <div className="empty">
          <h3 className="serif">
            {proyectos.length === 0 ? 'Todavía no hay proyectos' : 'Ningún proyecto en esta fase'}
          </h3>
          <p>
            {proyectos.length === 0
              ? 'Crea el primero para empezar a ver el estado de tu estudio de un vistazo.'
              : 'Prueba con otro filtro o crea un proyecto nuevo.'}
          </p>
        </div>
      ) : (
        <div className="grid">
          {proyectosOrdenados.map((p) => (
            <ProjectCard key={p.id} proyecto={p} onOpen={() => abrirExistente(p)} />
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
