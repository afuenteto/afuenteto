import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('No hay una sesión autenticada.')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('La sesión no es válida.')

    const { nombre, email, asunto, mensaje } = await request.json()
    if (!nombre || !email || !asunto || !mensaje) {
      throw new Error('Faltan campos obligatorios.')
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    const destination = Deno.env.get('CONTACT_TO_EMAIL')
    if (!destination) throw new Error('Falta configurar CONTACT_TO_EMAIL.')

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: destination,
      replyTo: email,
      subject: asunto,
      html: `
        <h2>${escapeHtml(asunto)}</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p>${escapeHtml(mensaje).replaceAll('\n', '<br>')}</p>
        <hr>
        <p>Usuario autenticado: ${escapeHtml(user.email ?? user.id)}</p>
      `
    })

    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
