import { t } from '../i18n.js'

const colors = { '🔴': '#c43d32', '🟡': '#ffd400', '🟢': '#4caf50', '🔵': '#2196f3', '⚪': '#a2a29c' }
export const statusLabel = key => t(key).replace(/[🔴🟡🟢🔵⚪]/gu, '').trim()

export default function FlatStatus({ label }) {
  const color = colors[Array.from(label)[0]]
  return <span className="flat-status"><span className="flat-status-dot" style={{ backgroundColor: color }} aria-hidden="true" />{statusLabel(label)}</span>
}

export function StatusSelect({ children, ...props }) {
  const colorsByValue = { urgente: '#c43d32', alta: '#c43d32', en_curso: '#ffd400', normal: '#ffd400', estable: '#4caf50', bloqueado: '#2196f3', baja: '#a2a29c' }
  return <span className="flat-status-select"><span className="flat-status-dot" style={{ backgroundColor: colorsByValue[props.value] }} aria-hidden="true" /><select {...props}>{children}</select></span>
}
