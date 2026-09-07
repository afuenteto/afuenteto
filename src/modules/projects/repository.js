import { supabase } from '../../supabase.js'
import { proyectoDesdeBD } from '../../projectModel.js'
import { urlFirmada } from '../../storageFiles.js'

// El módulo entrega proyectos listos para mostrar; la pantalla no conoce
// el formato de Supabase ni cómo resolver los archivos privados.
export async function cargarProyectosDeUsuario(
  usuarioId,
  { cliente = supabase, firmarUrl = urlFirmada } = {},
) {
  if (!usuarioId) throw new Error('Se necesita un usuario para cargar sus proyectos.')

  const { data, error } = await cliente
    .from('proyectos')
    .select('*')
    .eq('user_id', usuarioId)

  if (error) throw error

  return Promise.all((data || []).map(async (fila) => {
    const proyecto = proyectoDesdeBD(fila)
    const comisiones = await Promise.all((proyecto.comisiones || []).map(async (comision) => ({
      ...comision,
      presupuestoPdf: comision.presupuestoPdfPath
        ? await firmarUrl('presupuestos', comision.presupuestoPdfPath)
        : comision.presupuestoPdf,
    })))

    return {
      ...proyecto,
      imagenProyecto: proyecto.imagenProyectoPath
        ? await firmarUrl('imagenes-proyectos', proyecto.imagenProyectoPath)
        : proyecto.imagenProyecto,
      presupuestoPdf: proyecto.presupuestoPdfPath
        ? await firmarUrl('presupuestos', proyecto.presupuestoPdfPath)
        : proyecto.presupuestoPdf,
      comisiones,
    }
  }))
}
