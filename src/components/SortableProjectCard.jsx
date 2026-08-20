import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ProjectCard from './ProjectCard'

export default function SortableProjectCard({
  proyecto,
  onOpen
}) {

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
      />

      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        type="button"
      >
        ⠿
      </button>

    </div>
  )
}
