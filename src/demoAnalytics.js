import { supabase } from './supabase.js'

let activeSessionId = null
let activeSessionUserId = null
let heartbeatTimer = null

export async function startDemoSession(userId) {
  if (!userId || activeSessionUserId === userId) return activeSessionId
  if (activeSessionId && activeSessionUserId !== userId) await endDemoSession()
  try {
    const { data } = await supabase.from('demo_sessions').insert({ user_id: userId }).select('id').single()
    activeSessionId = data?.id || null
    activeSessionUserId = userId
    heartbeatTimer = setInterval(() => {
      if (activeSessionId) supabase.from('demo_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', activeSessionId)
    }, 30000)
    return activeSessionId
  } catch { activeSessionUserId = null; return null }
}

export async function endDemoSession() {
  if (!activeSessionId) return
  const sessionId = activeSessionId
  activeSessionId = null
  activeSessionUserId = null
  clearInterval(heartbeatTimer)
  heartbeatTimer = null
  try {
    const endedAt = new Date()
    const startedAt = await supabase.from('demo_sessions').select('started_at').eq('id', sessionId).single()
    const duration = startedAt.data?.started_at ? Math.max(0, Math.round((endedAt.getTime() - new Date(startedAt.data.started_at).getTime()) / 1000)) : 0
    await supabase.from('demo_sessions').update({ ended_at: endedAt.toISOString(), duration_seconds: duration }).eq('id', sessionId)
  } catch { /* La analítica nunca debe bloquear el cierre de sesión. */ }
}

export function getDemoSessionId() { return activeSessionId }

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

export async function recordDemoUsage(userId, event, module = '', metadata = {}) {
  if (!userId || !event) return
  try {
    if (!activeSessionId) await startDemoSession(userId)
    await supabase.from('demo_usage_events').insert({ user_id: userId, session_id: activeSessionId, event, module, metadata })
  } catch {
    // La analítica nunca debe bloquear la experiencia del usuario.
  }
}