import { supabase, supabaseUrl, supabaseKey } from '../../supabase.js'
import { CLAVE_MODULOS, normalizarModulos } from './model.js'

// Preferencias de la cuenta autenticada. No representa permisos ni planes de pago.
export async function guardarModulosDeUsuario(usuarioId, modulos, {
  cliente = supabase,
  solicitar = globalThis.fetch,
} = {}) {
  if (!usuarioId) throw new Error('Se necesita una sesión para guardar los módulos.')
  const { data: { session } = {}, error: errorSesion } = await cliente.auth.getSession()
  if (errorSesion) throw errorSesion
  if (!session?.access_token || session.user?.id !== usuarioId) throw new Error('La sesión ha cambiado.')
  const token = session.access_token
  const { data: verificacion, error: errorUsuario } = await cliente.auth.getUser(token)
  if (errorUsuario) throw errorUsuario
  if (verificacion?.user?.id !== usuarioId) throw new Error('La sesión ha cambiado.')

  // El JWT capturado vincula esta escritura a su cuenta, aunque otra pestaña
  // cambie de sesión mientras se completa la solicitud. No altera la sesión local.
  const respuesta = await solicitar(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { [CLAVE_MODULOS]: normalizarModulos(modulos) } }),
    signal: AbortSignal.timeout(20000),
  })
  if (!respuesta.ok) throw new Error('No se pudo guardar la configuración de la cuenta.')
  const usuario = await respuesta.json()
  if (usuario?.id !== usuarioId) throw new Error('No se pudo confirmar la configuración de la cuenta.')
  return usuario
}

export const CLAVE_AVISO_MODULOS = 'fuente-studio.modules-updated'
export function notificarCambioModulos(usuarioId) {
  try {
    globalThis.localStorage?.setItem(CLAVE_AVISO_MODULOS, JSON.stringify({ usuarioId, revision: Date.now() }))
  } catch { /* La cuenta se ha guardado aunque el navegador bloquee el almacenamiento local. */ }
}
