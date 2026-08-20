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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

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

  <ProjectCard
    proyecto={proyecto}
    onOpen={onOpen}
  />
</div>
  )
}
