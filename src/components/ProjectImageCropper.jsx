import { useEffect, useRef, useState } from 'react'

const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 240

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

async function crearBannerOptimizado(src, posicionX, posicionY) {
  const imagen = new Image()

  await new Promise((resolve, reject) => {
    imagen.onload = resolve
    imagen.onerror = reject
    imagen.src = src
  })

  const origenW = imagen.naturalWidth
  const origenH = imagen.naturalHeight
  const destinoRatio = TARGET_WIDTH / TARGET_HEIGHT
  const origenRatio = origenW / origenH

  let sx = 0
  let sy = 0
  let sw = origenW
  let sh = origenH

  if (origenRatio > destinoRatio) {
    sw = origenH * destinoRatio
    sx = (origenW - sw) * (posicionX / 100)
  } else if (origenRatio < destinoRatio) {
    sh = origenW / destinoRatio
    sy = (origenH - sh) * (posicionY / 100)
  }

  const canvas = document.createElement('canvas')
  canvas.width = TARGET_WIDTH
  canvas.height = TARGET_HEIGHT

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    imagen,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    TARGET_WIDTH,
    TARGET_HEIGHT
  )

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.8)
  })

  if (!blob) {
    throw new Error('No se pudo optimizar la imagen.')
  }

  return blob
}

export default function ProjectImageCropper({ src, onCancel, onConfirm }) {
  const marcoRef = useRef(null)
  const arrastreRef = useRef(null)
  const [posicion, setPosicion] = useState({ x: 50, y: 50 })
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    setPosicion({ x: 50, y: 50 })
  }, [src])

  function iniciarArrastre(e) {
    if (!marcoRef.current) return

    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)

    arrastreRef.current = {
      x: e.clientX,
      y: e.clientY,
      posicionX: posicion.x,
      posicionY: posicion.y,
    }
  }

  function moverImagen(e) {
    if (!arrastreRef.current || !marcoRef.current) return

    const rect = marcoRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dx = e.clientX - arrastreRef.current.x
    const dy = e.clientY - arrastreRef.current.y

    setPosicion({
      x: clamp(
        arrastreRef.current.posicionX - (dx / rect.width) * 100,
        0,
        100
      ),
      y: clamp(
        arrastreRef.current.posicionY - (dy / rect.height) * 100,
        0,
        100
      ),
    })
  }

  function terminarArrastre(e) {
    arrastreRef.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  async function confirmar() {
    try {
      setProcesando(true)
      const blob = await crearBannerOptimizado(src, posicion.x, posicion.y)
      onConfirm(blob)
    } catch (error) {
      console.error(error)
      alert(error.message || 'No se pudo preparar la imagen.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="project-image-crop-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="project-image-crop-dialog">
        <div className="project-image-crop-head">
          <div>
            <h3 className="serif">Colocar imagen del proyecto</h3>
            <p>Arrastra la imagen hasta dejar encuadrada la zona que quieres ver en la ficha.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div
          ref={marcoRef}
          className="project-image-crop-frame"
          onPointerDown={iniciarArrastre}
          onPointerMove={moverImagen}
          onPointerUp={terminarArrastre}
          onPointerCancel={terminarArrastre}
        >
          <img
            src={src}
            alt="Vista previa del proyecto"
            draggable="false"
            style={{ objectPosition: `${posicion.x}% ${posicion.y}%` }}
          />
          <div className="project-image-crop-guide">Arrastra para recolocar</div>
        </div>

        <div className="project-image-crop-info">
          La app guardará una versión optimizada de 1200 × 240 px en WebP, sin deformar la imagen.
        </div>

        <div className="project-image-crop-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={procesando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={confirmar} disabled={procesando}>
            {procesando ? 'Preparando…' : 'Usar esta imagen'}
          </button>
        </div>
      </div>
    </div>
  )
}
