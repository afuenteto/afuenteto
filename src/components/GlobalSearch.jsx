import { useEffect, useRef, useState } from 'react'
import LineIcon from './LineIcon.jsx'

function matches(values, query) {
  const needle = query.trim().toLocaleLowerCase()
  return needle && values.some(value => String(value || '').toLocaleLowerCase().includes(needle))
}

export default function GlobalSearch({ projects, clients, suppliers, appointments, onOpenProject, onOpenPanel, onClosePanels }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  useEffect(() => {
    function close(event) { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  const results = query.trim() ? [
    ...projects.filter(item => matches([item.nombre, item.cliente, item.notas], query)).map(item => ({ type: 'Proyecto', label: item.nombre, detail: item.cliente, action: () => onOpenProject(item) })),
    ...clients.filter(item => matches([item.nombre, item.email, item.telefono], query)).map(item => ({ type: 'Cliente', label: item.nombre, detail: item.email, action: () => onOpenPanel('clientes') })),
    ...suppliers.filter(item => matches([item.nombre, item.contacto, item.email], query)).map(item => ({ type: 'Proveedor', label: item.nombre, detail: item.contacto, action: () => onOpenPanel('suppliers') })),
    ...projects.flatMap(project => (project.tareas || []).filter(task => !task.hecha && matches([task.texto, project.nombre], query)).map(task => ({ type: 'Tarea', label: task.texto, detail: project.nombre, action: () => onOpenProject(project, task.tipo === 'cita' ? 'cita' : 'tarea') }))),
    ...appointments.filter(item => matches([item.texto, item.fecha], query)).map(item => ({ type: 'Cita', label: item.texto, detail: item.fecha, action: () => onOpenPanel('appointments') })),
  ].slice(0, 12) : []
  function select(result) { setQuery(''); setOpen(false); onClosePanels(); result.action() }
  return <div className="global-search" ref={root}>
    <div className="global-search-field">
      <LineIcon name="search" />
      <input type="search" value={query} placeholder="Buscar en el estudio" aria-label="Buscar en el estudio" onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true) }} />
      {query && <button type="button" className="global-search-clear" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}>×</button>}
    </div>
    {open && query.trim() && <div className="global-search-results" role="listbox">
      {results.length ? results.map((result, index) => <button type="button" role="option" className="global-search-result" key={`${result.type}-${result.label}-${index}`} onClick={() => select(result)}>
        <strong>{result.label}</strong><small>{result.type}{result.detail ? ` · ${result.detail}` : ''}</small>
      </button>) : <p className="global-search-empty">Sin resultados</p>}
    </div>}
  </div>
}
