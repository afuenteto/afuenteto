import { useId, useSyncExternalStore } from 'react'
import { getLanguage, languages, setLanguage, subscribeLanguage, t as translateUI } from '../i18n.js'

export default function LanguageSelector() {
  const id = useId()
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage)
  return (
    <div className="language-settings">
      <label htmlFor={id} title={`${translateUI('Idioma')} / Language`}>
        <img src={import.meta.env.BASE_URL + 'icons/translate.png'} width="20" height="20" alt={`${translateUI('Idioma')} / Language`} draggable={false} />
      </label>
      <select id={id} value={language} onChange={event => setLanguage(event.target.value)} dir="ltr">
        {languages.map(item => <option key={item.code} value={item.code} lang={item.code}>{item.name}</option>)}
      </select>
    </div>
  )
}
