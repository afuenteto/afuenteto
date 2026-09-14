import { t } from '../i18n.js'
import { downloadCalendarEvent, googleCalendarUrl } from '../calendar.js'

export default function CalendarAction({ event }) {
  return <details className="calendar-options">
    <summary>{t('Añadir al calendario')}</summary>
    <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Google Calendar</a>
    <button type="button" className="chip" onClick={() => downloadCalendarEvent(event)}>{t('Descargar para Apple / Outlook (.ics)')}</button>
    <p>{t('Guarda una copia. Los cambios posteriores no se sincronizan.')}</p>
    <p>{t('En iPhone puedes importar el archivo desde Mail. En Google, abre el enlace y guarda el evento.')}</p>
    {event.time && <p>{t('Duración: 1 hora. Puedes ajustarla en tu calendario.')}</p>}
  </details>
}
