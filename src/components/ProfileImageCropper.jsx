import { useEffect, useRef, useState } from 'react'
import { squareCrop } from '../appearance.js'
import { t } from '../i18n.js'

export default function ProfileImageCropper({ src, onCancel, onConfirm }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [error, setError] = useState(false)
  const drag = useRef(null)
  useEffect(() => {
    let active = true
    const img = new Image()
    img.onload = () => { if (active) setImage(img) }
    img.onerror = () => { if (active) setError(true) }
    img.src = src
    return () => { active = false }
  }, [src])
  const crop = image && squareCrop(image.naturalWidth, image.naturalHeight, zoom, position.x, position.y)
  function confirm() {
    if (!crop) return
    try {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 512
      const context = canvas.getContext('2d')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, crop.sx, crop.sy, crop.size, crop.size, 0, 0, 512, 512)
      onConfirm(canvas.toDataURL('image/png'))
    } catch { setError(true) }
  }
  return <section className="profile-image-crop" aria-label={t('Recortar imagen')}>
    <h4>{t('Recortar imagen')}</h4>
    <p>{t('Arrastra la imagen para encuadrarla en el cuadrado.')}</p>
    <div className="profile-square-frame" onPointerDown={event => {
      if (!crop) return
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { clientX: event.clientX, clientY: event.clientY, ...position }
    }} onPointerMove={event => {
      if (!drag.current || !crop) return
      const width = event.currentTarget.getBoundingClientRect().width
      const overflowX = width * (image.naturalWidth / crop.size - 1)
      const overflowY = width * (image.naturalHeight / crop.size - 1)
      const clamp = value => Math.max(0, Math.min(100, value))
      setPosition({ x: overflowX ? clamp(drag.current.x - (event.clientX - drag.current.clientX) / overflowX * 100) : 50,
        y: overflowY ? clamp(drag.current.y - (event.clientY - drag.current.clientY) / overflowY * 100) : 50 })
    }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
      {crop && <img src={src} alt={t('Vista previa')} draggable={false} style={{ width: `${image.naturalWidth / crop.size * 100}%`, height: `${image.naturalHeight / crop.size * 100}%`, left: `${-crop.sx / crop.size * 100}%`, top: `${-crop.sy / crop.size * 100}%` }} />}
    </div>
    <label>{t('Zoom')}<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
    <label>{t('Horizontal')}<input type="range" min="0" max="100" value={position.x} onChange={e => setPosition({ ...position, x: Number(e.target.value) })} /></label>
    <label>{t('Vertical')}<input type="range" min="0" max="100" value={position.y} onChange={e => setPosition({ ...position, y: Number(e.target.value) })} /></label>
    <p>{t('Imagen cuadrada de 512 × 512 píxeles.')}</p>
    {error && <p role="alert">{t('No se pudo preparar la imagen.')}</p>}
    <div className="profile-crop-actions"><button type="button" className="btn" onClick={onCancel}>{t('Cancelar')}</button><button type="button" className="btn btn-primary" disabled={!crop || error} onClick={confirm}>{t('Usar esta imagen')}</button></div>
  </section>
}
