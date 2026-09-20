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

    await seedDemoData(adminClient, invited.user.id)

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

async function seedDemoData(client: ReturnType<typeof createClient>, userId: string) {
  const { count, error: countError } = await client
    .from('proyectos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (countError) throw countError
  if ((count ?? 0) > 0) return

  const today = new Date()
  today.setDate(today.getDate() + 2)
  const date = today.toISOString().slice(0, 10)
  const baseUrl = 'https://afuenteto.github.io/afuento/'
  const firstProject = crypto.randomUUID()
  const secondProject = crypto.randomUUID()

  const clients = [
    { user_id: userId, nombre: 'Jaime Martín', telefono: '+34 600 111 222', email: 'jaime.demo@example.com', direccion: 'Calle del Mar 12', notas: 'Cliente de demostración' },
    { user_id: userId, nombre: 'Ana y Luis', telefono: '+34 600 333 444', email: 'ana.luis.demo@example.com', direccion: 'Avenida del Puerto 8', notas: 'Cliente de demostración' },
  ]
  const providers = [
    { user_id: userId, nombre: 'Luz Mediterránea', contacto: 'Marta Soler', telefono: '+34 600 555 666', email: 'hola@luz-demo.example.com', direccion: 'Calle Taller 4', notas: 'Proveedor demo' },
    { user_id: userId, nombre: 'Maderas Norte', contacto: 'Pablo Ríos', telefono: '+34 600 777 888', email: 'info@maderas-demo.example.com', direccion: 'Polígono Norte 2', notas: 'Proveedor demo' },
  ]
  const projects = [
    {
      id: firstProject, user_id: userId, nombre: 'Casa junto al mar', cliente: 'Jaime Martín', estado: 'activo', prioridad: 'en_curso', orden: 0,
      fase: 'Diseño', fecha_inicio: date, fecha_entrega: '', importancia: 8, presupuesto_total: 42000, presupuesto_gastado: 12500,
      tipo_proyecto: 'Vivienda unifamiliar', imagen_proyecto: `${baseUrl}cocina.png`, notas: 'Proyecto de demostración', tareas: [], proveedores: [], cobros: [
        { id: crypto.randomUUID(), concepto: 'Primer pago', importe: 8500, estado: 'previsto', fecha: date },
      ], comisiones: [{ id: crypto.randomUUID(), colaborador: 'Luz Mediterránea', concepto: 'Iluminación', importe: 840, porcentaje: 2, estado: 'pendiente', fecha: date }], historial: [],
    },
    {
      id: secondProject, user_id: userId, nombre: 'Asiento para Lambrusco', cliente: 'Ana y Luis', estado: 'activo', prioridad: 'en_curso', orden: 1,
      fase: 'Ejecución', fecha_inicio: date, fecha_entrega: '', importancia: 7, presupuesto_total: 18500, presupuesto_gastado: 5200,
      tipo_proyecto: 'Interiorismo', imagen_proyecto: `${baseUrl}silla.png`, notas: 'Proyecto de demostración', tareas: [], proveedores: [], cobros: [
        { id: crypto.randomUUID(), concepto: 'Pago de materiales', importe: 3200, estado: 'previsto', fecha: date },
      ], comisiones: [{ id: crypto.randomUUID(), colaborador: 'Maderas Norte', concepto: 'Carpintería', importe: 370, porcentaje: 2, estado: 'pendiente', fecha: date }], historial: [],
    },
  ]
  const debts = [
    { user_id: userId, concepto: 'Materiales de muestra', acreedor: 'Maderas Norte', importe: 460 },
    { user_id: userId, concepto: 'Transporte pendiente', acreedor: 'Logística Demo', importe: 180 },
  ]
  const appointments = [
    { id: crypto.randomUUID(), user_id: userId, texto: 'Visita de obra', fecha: date, hora: '10:00', tipoCita: 'generic' },
    { id: crypto.randomUUID(), user_id: userId, texto: 'Reunión con cliente', fecha: date, hora: '16:30', tipoCita: 'personal' },
  ]

  for (const [table, rows] of [['clientes', clients], ['proveedores', providers], ['proyectos', projects], ['deudas', debts], ['citas_genericas', appointments]] as const) {
    const { error } = await client.from(table).insert(rows)
    if (error) throw error
  }
}
