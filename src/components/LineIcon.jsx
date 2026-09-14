import { t } from '../i18n.js'

const paths = {
  '📅': 'M4 5h16v15H4z M4 10h16 M8 3v4 M16 3v4',
  '💰': 'M12 3v18 M17 6H9a3 3 0 000 6h6a3 3 0 010 6H6',
  '📎': 'M8 12l6-6a3 3 0 014 4l-8 8a5 5 0 01-7-7l9-9 M6 14l8-8',
  '📄': 'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6',
  '🗑': 'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  '👤': 'M16 7a4 4 0 11-8 0 4 4 0 018 0 M4 21v-3a8 8 0 0116 0v3',
  '👥': 'M13 7a4 4 0 11-8 0 4 4 0 018 0 M2 21v-3a7 7 0 0114 0v3 M17 3a4 4 0 010 8 M18 14a6 6 0 014 6',
  '💾': 'M4 3h13l3 3v15H4z M8 3v6h8V3 M8 21v-8h8v8',
  '⚠': 'M12 3L2 21h20z M12 9v5 M12 17v1',
  '✅': 'M4 4h16v16H4z M7 12l3 3 7-7',
  '📍': 'M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0114 0 M15 9a3 3 0 11-6 0 3 3 0 016 0',
  '🖼': 'M3 3h18v18H3z M3 17l6-6 5 5 3-3 4 4 M17 7h.01',
  '🔄': 'M20 7a9 9 0 00-16 0 M20 2v5h-5 M4 17a9 9 0 0016 0 M4 22v-5h5',
  '🤝': 'M3 7l4-3 5 2 5-2 4 3-3 10-4 3-7-3z M7 8l5-2 5 5-3 3-4-3-3 2',
  tareas: 'M9 11l2 2 4-4 M9 4H5v16h14V4h-4 M9 3h6v4H9z',
  bloqueados: 'M7 10V7a5 5 0 0110 0v3 M5 10h14v11H5z',
}
const images = {
  '📅': 'calendar', '💰': 'money', '📎': 'attachment', '📄': 'document',
  '🗑': 'trash', '👤': 'person', '👥': 'people', '💾': 'save', '⚠': 'warning',
  '✅': 'check', '✓': 'check', '📍': 'location', '🖼': 'image', '🔄': 'refresh', '⏳': 'pending',
  bloqueados: 'lock', cobros: 'payment', close: 'close', grip: 'grip', move: 'move', color: 'color',
  'import-contact': 'import-contact', payment: 'payment', tareas: 'check', '⌛': 'pending',
}
const aliases = { entregas: '📅', cobros: '💰' }
export default function LineIcon({ name }) {
  if (name === 'unlocked') return <svg className="line-icon" width="18" height="18" viewBox="0 0 100 100" fill="none" stroke="#111" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M29 43V31a21 21 0 0141 0" /><rect x="17" y="43" width="62" height="44" rx="12" /><path d="M48 60v10" /></svg>
  const key = aliases[name] || Array.from(name || '')[0]
  const asset = images[name] || images[key]
  if (['warning', 'money', 'payment'].includes(asset)) {
    const mask = `url("${import.meta.env.BASE_URL}icons/${asset}.png")`
    return <span className={`line-icon custom-icon tinted-icon tinted-icon-${asset}`} style={{ maskImage: mask, WebkitMaskImage: mask }} aria-hidden="true" />
  }
  if (asset) return <img className="line-icon custom-icon" src={import.meta.env.BASE_URL + 'icons/' + asset + '.png'} width="18" height="18" alt="" aria-hidden="true" draggable={false} />
  const path = paths[name] || paths[key]
  if (!path) return <span aria-hidden="true">·</span>
  return <svg className="line-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
}
export const plainIconLabel = key => t(key).replace(/^\s*✓\s*/u, '').replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '')
export function iconText(key, name) {
  return <span className="icon-label"><LineIcon name={name || key.trim()} />{plainIconLabel(key)}</span>
}

