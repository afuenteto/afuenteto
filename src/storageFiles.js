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

// Agrupa y deduplica por bucket; limita cada petición sin crear una ráfaga
// de solicitudes por cada imagen y PDF del estudio.
export async function urlsFirmadas(bucket, rutas, duracion = 3600, cliente = supabase) {
  const unicas = [...new Set(rutas.filter(esRutaStorage))]
  const urls = new Map()
  for (let inicio = 0; inicio < unicas.length; inicio += 100) {
    const lote = unicas.slice(inicio, inicio + 100)
    const { data, error } = await cliente.storage.from(bucket).createSignedUrls(lote, duracion)
    if (error) throw error
    for (const archivo of data || []) {
      if (archivo.error) throw new Error(archivo.error)
      if (archivo.path && archivo.signedUrl) urls.set(archivo.path, archivo.signedUrl)
    }
    if (lote.some(ruta => !urls.has(ruta))) throw new Error('No se pudo obtener el enlace de un archivo privado.')
  }
  return urls
}
