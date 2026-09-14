import { useEffect, useRef, useState } from 'react'
import { t, getLocale } from '../i18n.js'
import { fechaLocal } from '../projectUtils.js'
import { formatearFecha } from '../storage.js'
import { retryJwtRead } from '../retryJwt.js'
import { debtBalance, loadDebts, createDebt, addDebtPayment, deleteDebtPayment, deleteDebt } from '../debts.js'

import { useLiveData } from '../useLiveData.js'

export default function DebtsPanel({ usuarioId }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [draft, setDraft] = useState({ concepto: '', acreedor: '', importe: '' })
  const [payment, setPayment] = useState({ debtId: '', importe: '', fecha: fechaLocal() })
  useLiveData({
    userId: usuarioId, tables: 'deudas,pagos_deuda', enabled: !loading && !busy,
    refresh: async isCurrent => {
      if (lock.current) return
      const data = await retryJwtRead(() => loadDebts(usuarioId), { isActive: isCurrent })
      if (isCurrent() && !lock.current && data) setDebts(data)
    },
  })
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    retryJwtRead(() => loadDebts(usuarioId), { isActive: () => active })
      .then(data => { if (active) setDebts(data) })
      .catch(e => { if (active) setError(e.code === 'PGRST205' || e.code === '42P01' ? t('Deudas necesita activar su tabla en Supabase.') : e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [usuarioId, retry])
  async function run(action) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try { await action() } catch (e) { setError(e.message) }
    finally { lock.current = false; setBusy(false) }
  }
  const money = amount => (amount / 100).toLocaleString(getLocale(), { style: 'currency', currency: 'EUR' })
  const totals = debts.reduce((sum, debt) => { const b = debtBalance(debt); return { total: sum.total + b.total, paid: sum.paid + b.paid, remaining: sum.remaining + b.remaining } }, { total: 0, paid: 0, remaining: 0 })
  if (loading) return <progress aria-label={t('Deudas')} />
  return <div className="debts-panel">
    {error && <div role="alert"><p>{error}</p><button type="button" className="chip" disabled={busy} onClick={() => setRetry(n => n + 1)}>{t('Reintentar')}</button></div>}
    <div className="daily-stats">
      {[[ 'Importe inicial', totals.total ], [ 'Pagado', totals.paid ], [ 'Saldo pendiente', totals.remaining ]].map(([label, amount]) => <div className="daily-stat" key={label}><span>{t(label)}</span><strong>{money(amount)}</strong></div>)}
    </div>
    <form className="debt-form" onSubmit={e => { e.preventDefault(); run(async () => { const saved = await createDebt(usuarioId, draft); setDebts(prev => [saved, ...prev]); setDraft({ concepto: '', acreedor: '', importe: '' }) }) }}>
      <fieldset disabled={busy} className="modal-fields debt-form-grid">
        <label>{t('Concepto')}<input required maxLength={200} value={draft.concepto} onChange={e => setDraft({ ...draft, concepto: e.target.value })} /></label>
        <label>{t('Acreedor')}<input maxLength={200} value={draft.acreedor} onChange={e => setDraft({ ...draft, acreedor: e.target.value })} /></label>
        <label>{t('Importe inicial')} (€)<input type="number" min="0.01" step="0.01" required value={draft.importe} onChange={e => setDraft({ ...draft, importe: e.target.value })} /></label>
        <button className="btn" type="submit">{t('Añadir deuda')}</button>
      </fieldset>
    </form>
    {debts.length === 0 && !error && <p>{t('No hay deudas registradas.')}</p>}
    {debts.map(debt => {
      const balance = debtBalance(debt)
      return <article className="debt-card" key={debt.id}>
        <header><div><h3>{debt.concepto}</h3><p>{debt.acreedor}</p></div><strong>{money(balance.remaining)} · {t('Saldo pendiente')}</strong></header>
        <progress max={balance.total} value={balance.paid} aria-label={t('Pagado')} />
        <p>{t('Importe inicial')}: {money(balance.total)} · {t('Pagado')}: {money(balance.paid)}</p>
        <button type="button" className="chip" disabled={busy} onClick={() => {
          if (window.confirm(t('Esta acción no se puede deshacer.') + '\n' + debt.concepto)) run(async () => {
            await deleteDebt(debt.id, usuarioId)
            setDebts(prev => prev.filter(d => d.id !== debt.id))
          })
        }}>{t('Eliminar')}</button>{' '}
        {balance.remaining === 0 ? <p>{t('Deuda saldada')}</p> : <button type="button" className="chip" disabled={busy} onClick={() => setPayment({ debtId: debt.id, importe: '', fecha: fechaLocal() })}>{t('Registrar pago')}</button>}
        {payment.debtId === debt.id && <form onSubmit={e => { e.preventDefault(); run(async () => {
          const saved = await addDebtPayment(debt, payment)
          setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, pagos_deuda: [...d.pagos_deuda, saved] } : d))
          setPayment({ debtId: '', importe: '', fecha: fechaLocal() })
        }) }}><fieldset disabled={busy} className="modal-fields debt-form-grid">
          <label>{t('Importe')} (€)<input type="number" required min="0.01" max={balance.remaining / 100} step="0.01" value={payment.importe} onChange={e => setPayment({ ...payment, importe: e.target.value })} /></label>
          <label>{t('Fecha')}<input type="date" required value={payment.fecha} onChange={e => setPayment({ ...payment, fecha: e.target.value })} /></label>
          <button type="submit" className="btn">{t('Guardar')}</button><button type="button" className="chip" onClick={() => setPayment({ ...payment, debtId: '' })}>{t('Cancelar')}</button>
        </fieldset></form>}
        {debt.pagos_deuda.length > 0 && <details><summary>{t('Historial de pagos')} ({debt.pagos_deuda.length})</summary>
          {[...debt.pagos_deuda].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(p => <div className="debt-payment" key={p.id}>
            <span>{formatearFecha(p.fecha)} · {money(Math.round(Number(p.importe) * 100))}</span>
            <button type="button" className="chip" disabled={busy} onClick={() => { if (window.confirm(t('¿Eliminar este pago? Se actualizará el saldo pendiente.'))) run(async () => {
              await deleteDebtPayment(p.id, debt.id)
              setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, pagos_deuda: d.pagos_deuda.filter(item => item.id !== p.id) } : d))
            }) }}>{t('Eliminar')}</button>
          </div>)}
        </details>}
      </article>
    })}
  </div>
}

