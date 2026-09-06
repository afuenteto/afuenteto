import es from './locales/es.json' with { type: 'json' }
import en from './locales/en.json' with { type: 'json' }
import fr from './locales/fr.json' with { type: 'json' }
import de from './locales/de.json' with { type: 'json' }
import it from './locales/it.json' with { type: 'json' }
import pt from './locales/pt.json' with { type: 'json' }
import zhCN from './locales/zh-CN.json' with { type: 'json' }
import zhTW from './locales/zh-TW.json' with { type: 'json' }
import ja from './locales/ja.json' with { type: 'json' }
import ko from './locales/ko.json' with { type: 'json' }
import ar from './locales/ar.json' with { type: 'json' }
import hi from './locales/hi.json' with { type: 'json' }
import bn from './locales/bn.json' with { type: 'json' }
import ur from './locales/ur.json' with { type: 'json' }
import ru from './locales/ru.json' with { type: 'json' }
import id from './locales/id.json' with { type: 'json' }
import tr from './locales/tr.json' with { type: 'json' }
import vi from './locales/vi.json' with { type: 'json' }
import pl from './locales/pl.json' with { type: 'json' }
import nl from './locales/nl.json' with { type: 'json' }

export const languages = [
  { code: 'es', name: 'Español', locale: 'es-ES' },
  { code: 'en', name: 'English', locale: 'en-GB' },
  { code: 'fr', name: 'Français', locale: 'fr-FR' },
  { code: 'de', name: 'Deutsch', locale: 'de-DE' },
  { code: 'it', name: 'Italiano', locale: 'it-IT' },
  { code: 'pt', name: 'Português', locale: 'pt-PT' },
  { code: 'zh-CN', name: '简体中文', locale: 'zh-CN' },
  { code: 'zh-TW', name: '繁體中文', locale: 'zh-TW' },
  { code: 'ja', name: '日本語', locale: 'ja-JP' },
  { code: 'ko', name: '한국어', locale: 'ko-KR' },
  { code: 'ar', name: 'العربية', locale: 'ar', dir: 'rtl' },
  { code: 'hi', name: 'हिन्दी', locale: 'hi-IN' },
  { code: 'bn', name: 'বাংলা', locale: 'bn-BD' },
  { code: 'ur', name: 'اردو', locale: 'ur-PK', dir: 'rtl' },
  { code: 'ru', name: 'Русский', locale: 'ru-RU' },
  { code: 'id', name: 'Bahasa Indonesia', locale: 'id-ID' },
  { code: 'tr', name: 'Türkçe', locale: 'tr-TR' },
  { code: 'vi', name: 'Tiếng Việt', locale: 'vi-VN' },
  { code: 'pl', name: 'Polski', locale: 'pl-PL' },
  { code: 'nl', name: 'Nederlands', locale: 'nl-NL' },
]
export const catalogues = { es, en, fr, de, it, pt, 'zh-CN': zhCN, 'zh-TW': zhTW, ja, ko, ar, hi, bn, ur, ru, id, tr, vi, pl, nl }
export const LANGUAGE_KEY = 'fuente-studio.language'
const listeners = new Set()

export function resolveLanguage(code) {
  if (typeof code !== 'string') return 'es'
  const normalized = code.replaceAll('_', '-').toLowerCase()
  const exact = languages.find(language => language.code.toLowerCase() === normalized)
  if (exact) return exact.code
  if (normalized.startsWith('zh')) return /(?:tw|hk|mo|hant)/.test(normalized) ? 'zh-TW' : 'zh-CN'
  return languages.find(language => language.code === normalized.split('-')[0])?.code || 'es'
}

function initialLanguage() {
  // Keep Spanish as the initial language for the existing app.
  try { return resolveLanguage(globalThis.localStorage?.getItem(LANGUAGE_KEY)) } catch { return 'es' }
}
let language = initialLanguage()
export const getLanguage = () => language
export const getLocale = () => languages.find(item => item.code === language).locale
export const subscribeLanguage = listener => { listeners.add(listener); return () => listeners.delete(listener) }

function updateDocument() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language
  document.documentElement.dir = languages.find(item => item.code === language).dir || 'ltr'
}
export function setLanguage(code, persist = true) {
  const next = resolveLanguage(code)
  if (persist) {
    try { globalThis.localStorage?.setItem(LANGUAGE_KEY, next) } catch { /* Private browsing still allows switching for this session. */ }
  }
  if (next === language) { updateDocument(); return }
  language = next
  updateDocument()
  listeners.forEach(listener => listener())
}

export function translate(code, key, values = {}) {
  if (typeof key !== 'string') return key
  const catalogue = catalogues[resolveLanguage(code)]
  const template = Object.hasOwn(catalogue, key) ? catalogue[key] : Object.hasOwn(es, key) ? es[key] : key
  return template.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match)
}
export const t = (key, values) => translate(language, key, values)
export function formatRelativeDays(days) {
  if (days === null || !Number.isFinite(days)) return '—'
  return new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' }).format(days, 'day')
}
updateDocument()
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === LANGUAGE_KEY || event.key === null) setLanguage(event.newValue, false)
  })
}
