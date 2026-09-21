import { useState } from 'react'
import LineIcon from './LineIcon.jsx'

function label(item) {
  if (item.days < 0) return `Vencido hace ${Math.abs(item.days)} días`
  if (item.days === 0) return 'Hoy'
  if (item.days === 1) return 'Mañana'
  return `En ${item.days} días`
}

export default function DueNotifications({ items, onSelect }) {
  const [open, setOpen] = useState(false)
  return <div className="due-notifications">
    <button type="button" className={`btn due-notifications-trigger${items.length ? ' has-items' : ''}`} aria-expanded={open} aria-label={`Vencimientos: ${items.length}`} title="Vencimientos" onClick={() => setOpen(value => !value)}>
      <LineIcon name="📅" /><span>{items.length}</span>
    </button>
    {open && <div className="due-notifications-popover" role="dialog" aria-label="Vencimientos próximos">
      <strong>Próximos vencimientos</strong>
      {items.length ? items.slice(0, 8).map(item => <button type="button" className="due-notification" key={item.id} onClick={() => { setOpen(false); onSelect(item) }}>
        <span>{item.title}</span><small>{label(item)} · {item.kind}</small>
      </button>) : <p>No hay vencimientos próximos.</p>}
    </div>}
  </div>
}
