import LanguageSelector from './LanguageSelector.jsx'
import { t } from '../i18n.js'

export default function FooterActions({ onLogout, disabled = false }) {
  return (
    <div className="app-footer-actions" dir="ltr">
      <LanguageSelector />
      {onLogout && (
        <button type="button" className="btn btn-logout" onClick={onLogout} disabled={disabled} dir="auto">
          {t('Salir')}
        </button>
      )}
    </div>
  )
}
