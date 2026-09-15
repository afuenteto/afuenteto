import { useState } from 'react'

export default function ProjectName({ proyecto, enabled = true, children }) {
  const [failed, setFailed] = useState(null)
  const src = enabled && proyecto?.imagenProyecto
  return <span className="project-name-with-photo">
    {src && src !== failed && <img src={src} alt="" width="28" height="28" loading="lazy" decoding="async" onError={() => setFailed(src)} />}
    <span>{children ?? proyecto?.nombre}</span>
  </span>
}
