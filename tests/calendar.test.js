import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDates, createCalendarFile, googleCalendarUrl } from '../src/calendar.js'

test('exporta fechas de día completo con fin exclusivo, incluso al cambiar de año', () => {
  assert.deepEqual(calendarDates('2026-12-31'), { start: '20261231', end: '20270101', timed: false })
  assert.deepEqual(calendarDates('2028-02-29'), { start: '20280229', end: '20280301', timed: false })
  assert.throws(() => calendarDates('2026-02-30'))
  assert.throws(() => calendarDates('2026-12-31', '25:00'))
})

test('convierte la hora local a un instante UTC y asigna una hora de duración', () => {
  const dates = calendarDates('2026-09-14', '23:30')
  const expected = new Date('2026-09-14T23:30:00')
  const stamp = date => date.toISOString().replace(/[-:]/g, '').replace('.000', '')
  assert.equal(dates.start, stamp(expected))
  assert.equal(dates.end, stamp(new Date(expected.getTime() + 3600000)))
})

test('genera iCalendar con identificador estable, texto escapado y líneas UTF-8 válidas', () => {
  const event = { id: 'task/p1/1', title: 'Visita, cocina; baños\\obra\nNueva línea ' + 'á🏠'.repeat(50),
    description: 'Proyecto\nBEGIN:VEVENT', date: '2026-09-14' }
  const ics = createCalendarFile(event, new Date('2026-09-01T12:00:00Z'))
  const unfolded = ics.replace(/\r\n /g, '')
  assert.ok(unfolded.includes('UID:task%2Fp1%2F1@afuenteto.app'))
  assert.ok(unfolded.includes('DTSTART;VALUE=DATE:20260914'))
  assert.ok(unfolded.includes('DTEND;VALUE=DATE:20260915'))
  assert.ok(unfolded.includes('SUMMARY:Visita\\, cocina\\; baños\\\\obra\\nNueva línea'))
  assert.equal(ics.split('\r\n').filter(line => line === 'BEGIN:VEVENT').length, 1)
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75)
  const url = new URL(googleCalendarUrl(event))
  assert.equal(url.searchParams.get('text'), event.title)
  assert.equal(url.searchParams.get('dates'), '20260914/20260915')
})
