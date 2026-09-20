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
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
    if (!administrators.includes((user.email ?? '').toLowerCase())) {
      throw new Error('No tienes permisos para crear invitaciones.')
    }

    const { email, nombre = '' } = await request.json()
    const normalizedEmail = String(email ?? '').trim().toLowerCase()
    const normalizedName = String(nombre ?? '').trim().slice(0, 120)
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('El email no es válido.')

    const token = crypto.randomUUID()
    const tokenHash = await sha256(token)
    const { data: invitation, error: invitationError } = await adminClient
      .from('invitaciones_demo')
      .insert({ email: normalizedEmail, nombre: normalizedName, token_hash: tokenHash })
      .select('id, email, nombre, estado')
      .single()
    if (invitationError) throw invitationError

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { demo_invitation_id: invitation.id, demo_name: normalizedName },
    })
    if (inviteError) {
      await adminClient.from('invitaciones_demo').delete().eq('id', invitation.id)
      throw inviteError
    }

    const { error: linkError } = await adminClient
      .from('invitaciones_demo')
      .update({ user_id: invited.user.id })
      .eq('id', invitation.id)
    if (linkError) throw linkError

    return json({ invitation: { ...invitation, user_id: invited.user.id } })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo crear la invitación.' }, 400)
  }
})

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
