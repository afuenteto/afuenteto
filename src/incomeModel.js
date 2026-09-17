import { commissionAmount } from './commissions.js'
import { diasEntreFechas } from './projectUtils.js'

const cents = value => Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : 0
const validDate = value => typeof value === 'string' && diasEntreFechas(value, '2000-01-01') !== null

export function incomeEntries(projects) {
  return projects.flatMap(project => [
    ...(project.cobros || []).filter(item => item.estado !== 'previsto').map(item => ({
      kind: 'general', cents: cents(item.importe), date: validDate(item.fecha) ? item.fecha : '',
    })),
    ...(project.comisiones || []).filter(item => item.estado === 'cobrada').map(item => ({
      kind: 'commission', cents: cents(commissionAmount(item)),
      date: validDate(item.fechaCobro) ? item.fechaCobro : '',
    })),
  ])
}

export function incomeTotals(entries) {
  const general = entries.filter(item => item.kind === 'general').reduce((sum, item) => sum + item.cents, 0)
  const commission = entries.filter(item => item.kind === 'commission').reduce((sum, item) => sum + item.cents, 0)
  return { general, commission, total: general + commission }
}

export function incomePeriods(entries, mode, year) {
  const keys = mode === 'months' ? Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
    : [...new Set(entries.filter(item => item.date).map(item => item.date.slice(0, 4)))].sort().reverse()
  return keys.map(key => ({ key, ...incomeTotals(entries.filter(item => item.date && item.date.startsWith(key))) }))
}
