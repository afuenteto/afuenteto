import { supabase } from './supabase.js'

export async function recordDemoAccess(userId, event, route = window.location.pathname) {
  if (!userId || !event) return
  try {
    await supabase.from('demo_access_events').insert({
      user_id: userId,
      event,
      route,
      user_agent: navigator.userAgent.slice(0, 500),
    })
  } catch {
    // La analítica nunca debe bloquear el acceso a la app.
  }
}