import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { APPEARANCE_KEY, normalizeAppearance, paletteColors, resolvePalette, imageIcons } from './appearance.js'

const LOGO_CACHE = 'fuente-studio.last-logo'
function readLogo() {
  try {
    const value = JSON.parse(localStorage.getItem(LOGO_CACHE))
    return value?.userId && [32, 180, 192, 512].every(size => value.icons?.[size]?.startsWith('data:image/png;base64,')) ? value : null
  } catch { return null }
}

export default function useAppearance(usuario) {
  const settings = normalizeAppearance(usuario?.user_metadata?.[APPEARANCE_KEY])
  const [logo, setLogo] = useState(readLogo)
  const [palette, setPalette] = useState(() => resolvePalette(settings.palette))
  const base = import.meta.env.BASE_URL
  const colors = paletteColors(palette, settings.paletteVersions)
  useEffect(() => {
    const refresh = () => setPalette(resolvePalette(settings.palette))
    refresh()
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [settings.palette])
  useEffect(() => {
    const root = document.documentElement
    for (const [key, value] of Object.entries({ '--accent': colors.accent, '--accent-soft': colors.soft,
      '--accent-hover': colors.hover, '--brand-heading': colors.heading, '--bg': colors.background })) root.style.setProperty(key, value)
    root.dataset.font = settings.font
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.content = colors.accent
    return () => {
      for (const key of ['--accent', '--accent-soft', '--accent-hover', '--brand-heading', '--bg']) root.style.removeProperty(key)
      delete root.dataset.font
    }
  }, [colors, settings.font])
  useEffect(() => {
    let active = true
    if (!usuario?.id) return
    if (!settings.logoPath) {
      setLogo(null)
      try { localStorage.removeItem(LOGO_CACHE) } catch {}
      return
    }
    if (usuario?.id && settings.logoPath.startsWith(`${usuario.id}/`)) {
      supabase.storage.from('imagenes-proyectos').createSignedUrl(settings.logoPath, 3600)
        .then(async ({ data, error }) => {
          if (error) throw error
          const icons = await imageIcons(data.signedUrl)
          if (active) {
            const next = { userId: usuario.id, path: settings.logoPath, icons }
            setLogo(next)
            try { localStorage.setItem(LOGO_CACHE, JSON.stringify(next)) } catch {}
          }
        }).catch(error => console.error('No se pudo cargar la imagen del perfil:', error))
    }
    return () => { active = false }
  }, [usuario?.id, settings.logoPath])
  const icons = logo && (!usuario?.id || (logo.userId === usuario.id && logo.path === settings.logoPath)) ? logo.icons : null
  const useProfileIcon = usuario?.id ? settings.useProfileIcon : logo?.useProfileIcon !== false
  const installedIcons = useProfileIcon ? icons : null
  useEffect(() => {
    if (!usuario?.id || !icons) return
    setLogo(previous => previous?.useProfileIcon === settings.useProfileIcon ? previous : { ...previous, useProfileIcon: settings.useProfileIcon })
    try { localStorage.setItem(LOGO_CACHE, JSON.stringify({ userId: usuario.id, path: settings.logoPath, icons, useProfileIcon: settings.useProfileIcon })) } catch {}
  }, [usuario?.id, icons, settings.logoPath, settings.useProfileIcon])
  useEffect(() => {
    const links = [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')]
    const previous = links.map(link => link.getAttribute('href'))
    links.forEach(link => {
      const size = Number.parseInt(link.getAttribute('sizes'), 10)
      if (installedIcons) link.href = installedIcons[size] || installedIcons[link.rel === 'apple-touch-icon' ? 180 : 32]
    })
    const manifestLink = document.querySelector('link[rel="manifest"]')
    const original = manifestLink?.getAttribute('href')
    const appUrl = new URL(base, location.href).href
    const manifest = { id: appUrl, name: 'Proyectos de Interiorismo', short_name: 'Proyectos',
      start_url: appUrl, scope: appUrl, display: 'standalone', background_color: colors.background,
      theme_color: colors.accent,
      icons: [180, 192, 512].map(size => ({ src: installedIcons?.[size] || new URL(`icon-${size}.png`, appUrl).href, sizes: `${size}x${size}`, type: 'image/png' })) }
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }))
    if (manifestLink) manifestLink.href = url
    return () => {
      links.forEach((link, i) => link.setAttribute('href', previous[i]))
      if (manifestLink) manifestLink.setAttribute('href', original)
      URL.revokeObjectURL(url)
    }
  }, [installedIcons, colors, base])
  return { settings, logoUrl: icons?.[180] || base + 'icon-180.png', splashUrl: icons?.[512] || base + 'icon-512.png' }
}
