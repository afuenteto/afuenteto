import { useId, useSyncExternalStore } from 'react'
import { getLanguage, languages, setLanguage, subscribeLanguage, t as translateUI } from '../i18n.js'

export default function LanguageSelector() {
  const id = useId()
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage)
  return (
    <div className="language-settings">
      <label htmlFor={id} dir="auto"><span aria-hidden="true">◎</span> {translateUI('Idioma')} / Language</label>
      <select id={id} value={language} onChange={event => setLanguage(event.target.value)} dir="ltr">
        {languages.map(item => <option key={item.code} value={item.code} lang={item.code}>{item.name}</option>)}
      </select>
    </div>
  )
}
