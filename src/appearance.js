export const APPEARANCE_KEY = 'fuente_studio_appearance'
export const PALETTES = {
  yellow: { accent: '#ffd400', soft: '#fff3a6', hover: '#e8c000', heading: '#7a1f1f', background: '#f6f5f1' },
  blue: { accent: '#75b8eb', soft: '#dceefa', hover: '#579dd3', heading: '#17476b', background: '#f1f6fa' },
  green: { accent: '#8bc99a', soft: '#e0f1e4', hover: '#69af7a', heading: '#245d37', background: '#f2f7f1' },
  red: { accent: '#e89a91', soft: '#fae2de', hover: '#d88076', heading: '#7a1f1f', background: '#faf3f1' },
}
export function normalizeAppearance(value = {}) {
  return {
    palette: Object.hasOwn(PALETTES, value?.palette) || value?.palette === 'seasonal' ? value.palette : 'yellow',
    font: value?.font === 'serif' ? 'serif' : 'default',
    logoPath: typeof value?.logoPath === 'string' ? value.logoPath : '',
  }
}
// Estaciones meteorológicas del hemisferio norte, según el mes local.
export function resolvePalette(palette, date = new Date()) {
  if (palette !== 'seasonal') return Object.hasOwn(PALETTES, palette) ? palette : 'yellow'
  const month = date.getMonth()
  return month >= 2 && month <= 4 ? 'green' : month >= 5 && month <= 7 ? 'yellow' : month >= 8 && month <= 10 ? 'red' : 'blue'
}

export async function imageIcons(source) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = source
  await img.decode()
  const icons = {}
  for (const size of [32, 180, 192, 512]) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight)
    const width = img.naturalWidth * scale, height = img.naturalHeight * scale
    ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height)
    icons[size] = canvas.toDataURL('image/png')
  }
  return icons
}

export function squareCrop(width, height, zoom = 1, x = 50, y = 50) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
  const size = Math.min(width, height) / clamp(zoom, 1, 3)
  return { size, sx: (width - size) * clamp(x, 0, 100) / 100, sy: (height - size) * clamp(y, 0, 100) / 100 }
}
