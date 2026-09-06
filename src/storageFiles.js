import { supabase } from './supabase.js'

export function esRutaStorage(valor) {
  return Boolean(valor) && !/^https?:\/\//i.test(valor)
}

export async function urlFirmada(bucket, valor, duracion = 3600) {
  if (!valor || !esRutaStorage(valor)) return valor || ''

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(valor, duracion)

  if (error) throw error
  return data?.signedUrl || ''
}
