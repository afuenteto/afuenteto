import { supabase } from '../../supabase.js'
import { proyectoDesdeBD } from '../../projectModel.js'
import { urlsFirmadas } from '../../storageFiles.js'
import { guardarTareasVencidas } from '../../autoCompleteTasks.js'

// El módulo entrega proyectos listos para mostrar; la pantalla no conoce
// el formato de Supabase ni cómo resolver los archivos privados.
export async function cargarProyectosDeUsuario(
  usuarioId,
  { cliente = supabase, firmarUrls = urlsFirmadas } = {},
) {
  if (!usuarioId) throw new Error('Se necesita un usuario para cargar sus proyectos.')

  const { data, error } = await cliente
    .from('proyectos')
    .select('*')
    .eq('user_id', usuarioId)

  if (error) throw error

  const filas = await guardarTareasVencidas(cliente, usuarioId, data || [])
  const proyectos = filas.map(fila => proyectoDesdeBD(fila))
  const imagenes = [...new Set(proyectos.map(p => p.imagenProyectoPath).filter(Boolean))]
  const pdfs = [...new Set(proyectos.flatMap(p => [p.presupuestoPdfPath,
    ...p.comisiones.map(c => c.presupuestoPdfPath)]).filter(Boolean))]
  const [urlsImagenes, urlsPdfs] = await Promise.all([
    imagenes.length ? firmarUrls('imagenes-proyectos', imagenes) : new Map(),
    pdfs.length ? firmarUrls('presupuestos', pdfs) : new Map(),
  ])
  return proyectos.map(proyecto => ({
    ...proyecto,
    imagenProyecto: urlsImagenes.get(proyecto.imagenProyectoPath) || proyecto.imagenProyecto,
    presupuestoPdf: urlsPdfs.get(proyecto.presupuestoPdfPath) || proyecto.presupuestoPdf,
    comisiones: proyecto.comisiones.map(comision => ({
      ...comision,
      presupuestoPdf: urlsPdfs.get(comision.presupuestoPdfPath) || comision.presupuestoPdf,
    })),
  }))
}
