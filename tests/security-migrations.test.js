import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const isolationMigration = await fs.readFile(new URL('../supabase_migration_seguridad_aislamiento.sql', import.meta.url), 'utf8')
const invitationsMigration = await fs.readFile(new URL('../supabase_migration_invitaciones_analitica.sql', import.meta.url), 'utf8')

test('mantiene RLS por propietario en tablas principales', () => {
  for (const table of ['proyectos', 'clientes', 'perfil_estudio', 'citas_genericas', 'proveedores', 'deudas', 'pagos_deuda']) {
    assert.match(isolationMigration, new RegExp(`create policy [^\\n]+ on public\\.${table}`), `falta una política para ${table}`)
    assert.match(isolationMigration, new RegExp(`auth\\.uid\\(\\) = user_id|user_id = auth\\.uid\\(\\)`), `falta aislamiento por usuario en ${table}`)
  }
})

test('mantiene Storage privado y limitado a la carpeta del usuario', () => {
  assert.match(isolationMigration, /set public = false/)
  for (const bucket of ['imagenes-proyectos', 'presupuestos']) {
    assert.match(isolationMigration, new RegExp(`bucket_id = '${bucket}'`), `falta política para ${bucket}`)
    assert.match(isolationMigration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)::text\)/)
  }
})

test('mantiene caducidad y revocación de invitaciones demo', () => {
  assert.match(invitationsMigration, /expires_at timestamptz not null/)
  assert.match(invitationsMigration, /invitation\.estado = 'activa'/)
  assert.match(invitationsMigration, /invitation\.expires_at > now\(\)/)
  assert.match(invitationsMigration, /estado in \('pendiente', 'activa', 'revocada'\)/)
})
