import { useMemo, useState } from 'react'
import { incomeEntries, incomePeriods, incomeTotals } from '../incomeModel.js'
import { t, getLocale } from '../i18n.js'

export default function IncomeReport({ proyectos }) {
  const [mode, setMode] = useState('months')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const entries = useMemo(() => incomeEntries(proyectos), [proyectos])
  const years = [...new Set([year, String(new Date().getFullYear()), ...entries.filter(item => item.date).map(item => item.date.slice(0, 4))])].sort().reverse()
  const rows = incomePeriods(entries, mode, year)
  const totals = rows.reduce((sum, row) => ({ general: sum.general + row.general, commission: sum.commission + row.commission, total: sum.total + row.total }), { general: 0, commission: 0, total: 0 })
  const undated = entries.filter(item => !item.date)
  const withoutDate = incomeTotals(undated)
  const money = amount => (amount / 100).toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })
  const cells = row => <><td>{money(row.general)}</td><td>{money(row.commission)}</td><td>{money(row.total)}</td></>
  return <section className="income-report" aria-label={t('Cobros y balance anual')}>
    <h3 className="serif">{t('Cobros y balance anual')}</h3>
    <div className="daily-actions">
      <button className="chip" aria-pressed={mode === 'months'} onClick={() => setMode('months')}>{t('Por meses')}</button>
      <button className="chip" aria-pressed={mode === 'years'} onClick={() => setMode('years')}>{t('Por años')}</button>
      {mode === 'months' && <label>{t('Año')}<select value={year} onChange={e => setYear(e.target.value)}>{years.map(value => <option key={value}>{value}</option>)}</select></label>}
    </div>
    <div className="income-table-wrap"><table>
      <thead><tr><th scope="col">{t(mode === 'months' ? 'Mes' : 'Año')}</th><th scope="col">{t('Cobros generales')}</th><th scope="col">{t('Cobros de comisiones')}</th><th scope="col">{t('Total cobrado')}</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.key}><th scope="row">{mode === 'months' ? new Date(`${row.key}-15T12:00:00`).toLocaleDateString(getLocale(), { month: 'long' }) : row.key}</th>{cells(row)}</tr>)}</tbody>
      <tfoot><tr><th scope="row">{t('Total')}</th>{cells(totals)}</tr></tfoot>
    </table></div>
    <p>{t('Ingresos cobrados, incluidos los proyectos finalizados. No incluye cobros previstos ni descuenta gastos.')}</p>
    {undated.length > 0 && <p>{t('Cobros sin fecha, fuera del balance por periodos')}: {t('Cobros generales')} {money(withoutDate.general)} · {t('Comisiones')} {money(withoutDate.commission)}</p>}
  </section>
}
