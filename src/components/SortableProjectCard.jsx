import LineIcon from './LineIcon.jsx'
import { t as translateUI } from '../i18n.js'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ProjectCard from './ProjectCard'
import { MODULOS_PREDETERMINADOS } from '../modules/preferences/model.js'

export default function SortableProjectCard({
  proyecto,
  onOpen,
  onOpenTasks,
  onOpenDelivery,
  disabled = false,
  modulos = MODULOS_PREDETERMINADOS
}) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: proyecto.id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      className={'sortable-project' + (modulos.documentos && proyecto.imagenProyecto ? ' has-project-image' : '')}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
      }}
    >
      <ProjectCard
        proyecto={proyecto}
        modulos={modulos}
        onOpen={onOpen}
        onOpenTasks={onOpenTasks}
        onOpenDelivery={onOpenDelivery}
      />

  <button
  className="drag-handle"
  {...attributes}
  {...listeners}
  type="button"
  disabled={disabled}
  style={{ touchAction: 'none' }}
  aria-label={translateUI("Mover proyecto")}
>
  <LineIcon name="drag" />
</button>
    </div>
  )
}



