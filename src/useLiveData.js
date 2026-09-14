import { useEffect, useRef } from 'react'
import { supabase } from './supabase.js'

// Los eventos son avisos: los datos siempre se vuelven a consultar con RLS.
export function useLiveData({ userId, tables, enabled = true, refresh }) {
  const latest = useRef(refresh)
  latest.current = refresh
  useEffect(() => {
    if (!userId || !enabled) return
    let active = true
    let running = false
    let pending = false
    let timer
    const isCurrent = () => active
    async function reload() {
      if (!active || document.visibilityState === 'hidden' || !navigator.onLine) return
      if (running) { pending = true; return }
      running = true
      try { await latest.current(isCurrent) }
      catch { /* Mantener los datos y reintentar al recuperar conexión o en el siguiente ciclo. */ }
      finally {
        running = false
        if (active && pending) { pending = false; schedule() }
      }
    }
    function schedule() {
      clearTimeout(timer)
      timer = setTimeout(reload, 350)
    }
    const channel = supabase.channel(`live-${userId}-${tables}-${crypto.randomUUID()}`)
    for (const table of tables.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
    }
    channel.subscribe(status => { if (status === 'SUBSCRIBED') schedule() })
    // Respaldo si Realtime aún no está habilitado o se pierde algún evento.
    const interval = setInterval(schedule, 30000)
    window.addEventListener('focus', schedule)
    window.addEventListener('online', schedule)
    document.addEventListener('visibilitychange', schedule)
    schedule()
    return () => {
      active = false
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('focus', schedule)
      window.removeEventListener('online', schedule)
      document.removeEventListener('visibilitychange', schedule)
      void supabase.removeChannel(channel)
    }
  }, [userId, tables, enabled])
}
