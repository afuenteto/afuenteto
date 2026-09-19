import { contentES } from './content.es.js'
import { contentEN } from './content.en.js'

export const BRAND = {
  name: '·A·T·R·I·A·',
  short: 'A',
  tagline: 'Gestión creativa',
  appLabel: 'Acceder a la app',
}

export const CONTENT = {
  es: contentES,
  en: contentEN,
}

export const LANGUAGES = [
  ['es', 'Español'], ['en', 'English'], ['fr', 'Français'], ['de', 'Deutsch'],
  ['it', 'Italiano'], ['pt', 'Português'], ['zh-CN', '简体中文'], ['zh-TW', '繁體中文'],
  ['ja', '日本語'], ['ko', '한국어'], ['ar', 'العربية'], ['hi', 'हिन्दी'],
  ['bn', 'বাংলা'], ['ur', 'اردو'], ['ru', 'Русский'], ['id', 'Bahasa Indonesia'],
  ['tr', 'Türkçe'], ['vi', 'Tiếng Việt'], ['pl', 'Polski'], ['nl', 'Nederlands'],
].map(([code, label]) => ({ code, label }))

const RTL_LANGUAGES = new Set(['ar', 'ur'])

export function resolveLocale(value) {
  const normalized = String(value || '').replaceAll('_', '-').toLowerCase()
  const exact = LANGUAGES.find(language => language.code.toLowerCase() === normalized)
  if (exact) return exact.code
  if (normalized.startsWith('zh')) return normalized.includes('tw') ? 'zh-TW' : 'zh-CN'
  return LANGUAGES.find(language => language.code === normalized.split('-')[0])?.code || 'es'
}

export function getDefaultLocale() {
  const requested = new URLSearchParams(window.location.search).get('lang')
  if (requested) return resolveLocale(requested)

  return resolveLocale(window.navigator.language || 'es')
}

export function getContent(locale = getDefaultLocale()) {
  return CONTENT[locale] || CONTENT.es
}

export function isRtlLocale(locale) {
  return RTL_LANGUAGES.has(locale)
}
