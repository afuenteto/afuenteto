import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || 'https://flwggxfpdtxhfkunimyj.supabase.co'
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const users = [
  { name: 'principal', email: process.env.SECURITY_PRIMARY_EMAIL, password: process.env.SECURITY_PRIMARY_PASSWORD },
  { name: 'invitado', email: process.env.SECURITY_INVITED_EMAIL, password: process.env.SECURITY_INVITED_PASSWORD },
]

if (!key || users.some(user => !user.email || !user.password)) {
  console.error('Faltan SUPABASE_PUBLISHABLE_KEY, SECURITY_PRIMARY_EMAIL, SECURITY_PRIMARY_PASSWORD, SECURITY_INVITED_EMAIL o SECURITY_INVITED_PASSWORD.')
  process.exit(2)
}

async function signIn(user) {
  const client = createClient(url, key)
  const { data, error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`${user.name}: ${error.message}`)
  return { ...user, client, id: data.user.id }
}

const signedIn = await Promise.all(users.map(signIn))
try {
  for (const owner of signedIn) {
    for (const other of signedIn) {
      const { data, error } = await owner.client.from('proyectos').select('id').eq('user_id', other.id)
      if (error) throw new Error(`${owner.name} no pudo consultar proyectos: ${error.message}`)
      if (owner.id !== other.id && data.length) throw new Error(`${owner.name} puede leer proyectos de ${other.name}`)
      console.log(`${owner.name} -> proyectos de ${other.name}: ${data.length} visibles`)
    }
  }
  console.log('Prueba de aislamiento superada.')
} finally {
  await Promise.all(signedIn.map(user => user.client.auth.signOut()))
}
