import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('No hay sesión administrativa.')
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const authClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authorization } } })
    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) throw new Error('La sesión no es válida.')
    const administrators = (Deno.env.get('DEMO_ADMIN_EMAILS') ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
    if (!administrators.includes((user.email ?? '').toLowerCase())) throw new Error('No tienes permisos para revocar invitaciones.')
    const { id } = await request.json()
    if (!id) throw new Error('Falta la invitación.')
    const { data: invitation, error: readError } = await adminClient.from('invitaciones_demo').select('id,user_id').eq('id', id).single()
    if (readError) throw readError
    const { error: updateError } = await adminClient.from('invitaciones_demo').update({ estado: 'revocada' }).eq('id', id)
    if (updateError) throw updateError
    if (invitation.user_id) await adminClient.auth.admin.updateUserById(invitation.user_id, { ban_duration: '876000h' })
    return json({ ok: true })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo revocar la invitación.' }, 400)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}