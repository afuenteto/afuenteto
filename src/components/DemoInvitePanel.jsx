import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function DemoInvitePanel({ onClose }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setStatus('')
    const { error } = await supabase.functions.invoke('create-demo-invite', {
      body: { nombre, email },
    })
    setBusy(false)
    if (error) {
      setStatus(error.message || 'No se pudo crear la invitación.')
      return
    }
    setStatus('Invitación creada. El profesional recibirá un email para acceder.')
    setNombre('')
    setEmail('')
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal demo-invite-modal" role="dialog" aria-modal="true" aria-labelledby="demo-invite-title">
        <div className="modal-head">
          <h2 id="demo-invite-title" className="serif">Invitar profesional</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <p>Crear una cuenta individual con datos de prueba y seguimiento de uso.</p>
        <form className="demo-invite-form" onSubmit={submit}>
          <label>Nombre<input required value={nombre} onChange={event => setNombre(event.target.value)} /></label>
          <label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear invitación'}</button>
          </div>
          {status && <p className="demo-invite-status" role="status">{status}</p>}
        </form>
      </section>
    </div>
  )
}
