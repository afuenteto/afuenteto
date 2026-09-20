import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('No hay sesión administrativa.')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } },
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) throw new Error('La sesión no es válida.')

    const administrators = (Deno.env.get('DEMO_ADMIN_EMAILS') ?? '')
      .split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
    if (!administrators.includes((user.email ?? '').toLowerCase())) {
      throw new Error('No tienes permisos para consultar la analítica.')
    }

    const [{ data: invitations, error: invitationsError }, { data: access, error: accessError }, { data: usage, error: usageError }, { data: sessions, error: sessionsError }] = await Promise.all([
      adminClient.from('invitaciones_demo').select('id,email,nombre,estado,user_id,created_at,accepted_at').order('created_at', { ascending: false }),
      adminClient.from('demo_access_events').select('user_id,event,route,created_at').order('created_at', { ascending: false }).limit(500),
      adminClient.from('demo_usage_events').select('user_id,session_id,event,module,metadata,created_at').order('created_at', { ascending: false }).limit(500),
      adminClient.from('demo_sessions').select('id,user_id,started_at,ended_at,duration_seconds').order('started_at', { ascending: false }).limit(500),
    ])
    if (invitationsError) throw invitationsError
    if (accessError) throw accessError
    if (usageError && !isMissingAnalyticsColumn(usageError)) throw usageError
    if (sessionsError && !isMissingAnalyticsTable(sessionsError)) throw sessionsError

    let usageRowsSource = usage ?? []
    if (usageError && isMissingAnalyticsColumn(usageError)) {
      const fallback = await adminClient.from('demo_usage_events').select('user_id,event,module,metadata,created_at').order('created_at', { ascending: false }).limit(500)
      if (fallback.error) throw fallback.error
      usageRowsSource = fallback.data ?? []
    }

    const accessByUser = new Map<string, { total: number; lastAccess: string | null }>()
    for (const event of access ?? []) {
      const current = accessByUser.get(event.user_id) ?? { total: 0, lastAccess: null }
      current.total++
      current.lastAccess ||= event.created_at
      accessByUser.set(event.user_id, current)
    }

    const sessionRows = sessionsError && isMissingAnalyticsTable(sessionsError)
      ? deriveSessions(access ?? [])
      : (sessions ?? [])
    const usageRows = usageRowsSource.map(event => ({
      ...event,
      session_id: event.session_id || sessionRows.find(session => session.user_id === event.user_id && isWithinSession(event.created_at, session))?.id || null,
    }))

    return json({
      invitations: (invitations ?? []).map(invitation => ({
        ...invitation,
        accessCount: accessByUser.get(invitation.user_id)?.total ?? 0,
        lastAccess: accessByUser.get(invitation.user_id)?.lastAccess ?? null,
      })),
      access: access ?? [],
      usage: usageRows,
      sessions: sessionRows,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo cargar la analítica.' }, 400)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isMissingAnalyticsTable(error: { code?: string; message?: string }) {
  return error?.code === '42P01' || /demo_sessions.*does not exist/i.test(error?.message || '')
}

function isMissingAnalyticsColumn(error: { code?: string; message?: string }) {
  return error?.code === '42703' || /session_id.*does not exist/i.test(error?.message || '')
}

function deriveSessions(access: Array<{ user_id: string; event: string; created_at: string }>) {
  const sessions = []
  const active = new Map<string, any>()
  for (const event of [...access].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (event.event === 'login' || event.event === 'session_start') {
      const session = { id: `derived-${event.user_id}-${event.created_at}`, user_id: event.user_id, started_at: event.created_at, ended_at: null, duration_seconds: 0 }
      sessions.push(session)
      active.set(event.user_id, session)
    } else if (event.event === 'logout') {
      const session = active.get(event.user_id)
      if (session) {
        session.ended_at = event.created_at
        session.duration_seconds = Math.max(0, Math.round((new Date(event.created_at).getTime() - new Date(session.started_at).getTime()) / 1000))
        active.delete(event.user_id)
      }
    }
  }
  return sessions.reverse()
}

function isWithinSession(createdAt: string, session: { started_at: string; ended_at?: string | null }) {
  const time = new Date(createdAt).getTime()
  const start = new Date(session.started_at).getTime()
  const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
  return time >= start && time <= end
}
