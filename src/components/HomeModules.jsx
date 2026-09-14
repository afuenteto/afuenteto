import LineIcon from './LineIcon.jsx'
import { useEffect, useId, useState } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { t } from '../i18n.js'
import { normalizeHomeOrder, moveHomeModule } from '../homeModulesModel.js'

function Module({ section, open, toggle }) {
  const panelId = useId()
  const [visited, setVisited] = useState(open)

  useEffect(() => { if (open) setVisited(true) }, [open])
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: section.id })
  return <section ref={setNodeRef} className="home-module" style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 20 : undefined }}>
    <header className="home-module-heading">
      <button type="button" className="home-module-toggle serif" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <span>{t(section.title)}</span>
      </button>
      {section.summary}
      <button type="button" className="home-module-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }} aria-label={t('Mover módulo') + ': ' + t(section.title)}>
        <LineIcon name="grip" />
      </button>
    </header>
    <div id={panelId} hidden={!open} className="home-module-body">{(open || visited) && section.content}</div>
  </section>
}

export default function HomeModules({ usuarioId, sections, openRequest }) {
  const key = `fuente-studio.home-order.${usuarioId}`
  const ids = sections.map(s => s.id)
  const [order, setOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) } catch { return [] }
  })
  const [opened, setOpened] = useState({})
  useEffect(() => { if (openRequest) setOpened(prev => ({ ...prev, [openRequest.id]: true })) }, [openRequest])
  const sorted = normalizeHomeOrder(order).filter(id => ids.includes(id))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  function move({ active, over }) {
    if (!over || active.id === over.id) return
    const next = moveHomeModule(order, ids, active.id, over.id)
    setOrder(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* El orden sigue disponible en esta sesión. */ }
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={move}>
    <SortableContext items={sorted} strategy={verticalListSortingStrategy}>
      <div className="home-modules">{sorted.map(id => <Module key={id} section={sections.find(s => s.id === id)} open={Boolean(opened[id])}
        toggle={() => setOpened(prev => ({ ...prev, [id]: !prev[id] }))} />)}</div>
    </SortableContext>
  </DndContext>
}


