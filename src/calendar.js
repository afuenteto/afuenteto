import { diasEntreFechas as daysFrom } from './projectUtils.js'

const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')

export function calendarDates(date, time = '') {
  if (daysFrom(date, date) !== 0) throw new Error('Fecha inválida')
  if (time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Hora inválida')
    const start = new Date(`${date}T${time}:00`)
    return { start: stamp(start), end: stamp(new Date(start.getTime() + 3600000)), timed: true }
  }
  const end = new Date(date + 'T00:00:00Z')
  end.setUTCDate(end.getUTCDate() + 1)
  return { start: date.replaceAll('-', ''), end: end.toISOString().slice(0, 10).replaceAll('-', ''), timed: false }
}

// RFC 5545: las líneas no deben superar 75 octetos (sin dividir caracteres UTF-8).
function foldLine(line) {
  const encoder = new TextEncoder()
  let result = '', size = 0
  for (const char of line) {
    const length = encoder.encode(char).length
    if (size + length > 75) { result += '\r\n '; size = 1 }
    result += char
    size += length
  }
  return result
}

export function createCalendarFile(event, now = new Date()) {
  const { start, end, timed } = calendarDates(event.date, event.time)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AFUENTETO//Studio Agenda//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${encodeURIComponent(event.id)}@afuenteto.app`, `DTSTAMP:${stamp(now)}`,
    `DTSTART${timed ? '' : ';VALUE=DATE'}:${start}`, `DTEND${timed ? '' : ';VALUE=DATE'}:${end}`,
    `SUMMARY:${escapeText(event.title)}`, `DESCRIPTION:${escapeText(event.description)}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].map(foldLine).join('\r\n')
}

export function googleCalendarUrl(event) {
  const { start, end } = calendarDates(event.date, event.time)
  const query = new URLSearchParams({ action: 'TEMPLATE', text: event.title,
    dates: `${start}/${end}`, details: event.description || '' })
  return `https://calendar.google.com/calendar/render?${query}`
}

export function downloadCalendarEvent(event) {
  const url = URL.createObjectURL(new Blob([createCalendarFile(event)], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'agenda.ics'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
