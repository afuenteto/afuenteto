import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { useLiveData } from './useLiveData.js'
import { saveGenericAppointment } from './genericAppointments.js'

export default function useGenericAppointments(userId) {
  const [state, setState] = useState({ userId, items: [] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const owner = useRef(userId)
  owner.current = userId
  const lock = useRef(false)
  const revision = useRef(0)
  const read = async isCurrent => {
    const version = revision.current
    const { data, error } = await supabase.from('citas_genericas').select('*').eq('user_id', userId)
    if (error) throw error
    if (isCurrent() && owner.current === userId && version === revision.current) {
      setState({ userId, items: data.map(item => ({ ...item, tipo: 'cita', prioridad: 'normal' })) })
      setError('')
    }
  }
  useEffect(() => {
    let active = true
    setError('')
    if (userId) read(() => active).catch(() => { if (active) setError('No se pudieron cargar las citas genéricas.') })
    return () => { active = false }
  }, [userId])
  useLiveData({ userId, tables: 'citas_genericas', enabled: !busy, refresh: read })
  async function save(task) {
    if (!userId || lock.current) return false
    lock.current = true; setBusy(true)
    revision.current++
    try {
      const data = await saveGenericAppointment(userId, task)
      if (owner.current !== userId) return false
      setState(previous => ({ userId, items: [...(previous.userId === userId ? previous.items : []).filter(item => item.id !== data.id), { ...data, tipo: 'cita', prioridad: 'normal' }] }))
      setError('')
      return true
    } catch { if (owner.current === userId) setError('No se pudo guardar la cita genérica.'); return false }
    finally { lock.current = false; setBusy(false) }
  }
  return { items: state.userId === userId ? state.items : [], error, busy, save }
}
