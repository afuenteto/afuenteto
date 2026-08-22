import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ProjectCard from './ProjectCard'

export default function SortableProjectCard({
  proyecto,
  onOpen,
  onOpenTasks
}) {
  const [moviendo, setMoviendo] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: proyecto.id
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
      }}
    >
      <ProjectCard
        proyecto={proyecto}
        onOpen={onOpen}
        onOpenTasks={onOpenTasks}
      />

  <button
  className="drag-handle"
  {...attributes}
  {...listeners}
  type="button"
  aria-label="Mover proyecto"
>
  <span className="drag-dots">
    {Array.from({ length: 18 }).map((_, i) => (
      <span key={i}></span>
    ))}
  </span>

  <span className="drag-arrows">
    ↕ ↔
  </span>
</button>
    </div>
  )
}
