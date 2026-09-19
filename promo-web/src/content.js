import { contentES } from './content.es.js'
import { contentEN } from './content.en.js'

export const BRAND = {
  name: 'ATRIA GESTIÓN DE MOMENTO',
  short: 'A',
  tagline: 'Gestión creativa',
  appLabel: 'Acceder a la app',
}

export const CONTENT = {
  es: contentES,
  en: contentEN,
}

export function getDefaultLocale() {
  const requested = new URLSearchParams(window.location.search).get('lang')
  if (requested && CONTENT[requested]) return requested

  const browserLocale = window.navigator.language || 'es'
  return browserLocale.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function getContent(locale = getDefaultLocale()) {
  return CONTENT[locale] || CONTENT.es
}
