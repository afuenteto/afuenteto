import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { APPEARANCE_KEY, normalizeAppearance, paletteColors, resolvePalette, imageIcons } from './appearance.js'

export default function useAppearance(usuario) {
  const settings = normalizeAppearance(usuario?.user_metadata?.[APPEARANCE_KEY])
  const [logo, setLogo] = useState(null)
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
    setLogo(null)
    if (usuario?.id && settings.logoPath.startsWith(`${usuario.id}/`)) {
      supabase.storage.from('imagenes-proyectos').createSignedUrl(settings.logoPath, 3600)
        .then(async ({ data, error }) => {
          if (error) throw error
          const icons = await imageIcons(data.signedUrl)
          if (active) setLogo({ userId: usuario.id, path: settings.logoPath, icons })
        }).catch(error => console.error('No se pudo cargar la imagen del perfil:', error))
    }
    return () => { active = false }
  }, [usuario?.id, settings.logoPath])
  const icons = logo?.userId === usuario?.id && logo?.path === settings.logoPath ? logo.icons : null
  useEffect(() => {
    const links = [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')]
    const previous = links.map(link => link.getAttribute('href'))
    links.forEach(link => {
      const size = Number.parseInt(link.getAttribute('sizes'), 10)
      if (icons) link.href = icons[size] || icons[link.rel === 'apple-touch-icon' ? 180 : 32]
    })
    const manifestLink = document.querySelector('link[rel="manifest"]')
    const original = manifestLink?.getAttribute('href')
    const appUrl = new URL(base, location.href).href
    const manifest = { id: appUrl, name: 'Proyectos de Interiorismo', short_name: 'Proyectos',
      start_url: appUrl, scope: appUrl, display: 'standalone', background_color: colors.background,
      theme_color: colors.accent,
      icons: [180, 192, 512].map(size => ({ src: icons?.[size] || new URL(`icon-${size}.png`, appUrl).href, sizes: `${size}x${size}`, type: 'image/png' })) }
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }))
    if (manifestLink) manifestLink.href = url
    return () => {
      links.forEach((link, i) => link.setAttribute('href', previous[i]))
      if (manifestLink) manifestLink.setAttribute('href', original)
      URL.revokeObjectURL(url)
    }
  }, [icons, colors, base])
  return { settings, logoUrl: icons?.[180] || base + 'icon-180.png' }
}
