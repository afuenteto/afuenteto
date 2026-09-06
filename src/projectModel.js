export const FASES = ['Diseño', 'Presupuesto', 'Ejecución', 'Entrega'];
function numeroOpcional(valor) {
  if (valor == null || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) throw new Error('Hay un importe o número de horas inválido.');
  return numero;
}
export function proyectoDesdeBD(row) {
  return {
    id: row.id,
    prioridad: row.prioridad || 'en_curso',
    estado: row.estado || 'activo',
    orden: row.orden ?? 0,
    nombre: row.nombre || '',
    cliente: row.cliente || '',
    telefono: row.telefono || '',
    email: row.email || '',
    direccion: row.direccion || '',
    fechaInicio: row.fecha_inicio || '',
    fechaEntrega: row.fecha_entrega || '',
    fase: row.fase || FASES[0],
    importancia: row.importancia ?? 5,
    presupuestoTotal: row.presupuesto_total ?? '',
    presupuestoGastado: row.presupuesto_gastado ?? '',
    presupuestoPdf: /^https?:\/\//i.test(row.presupuesto_pdf || '') ? row.presupuesto_pdf : '',
    presupuestoPdfPath: /^https?:\/\//i.test(row.presupuesto_pdf || '') ? '' : row.presupuesto_pdf || '',
    imagenProyecto: /^https?:\/\//i.test(row.imagen_proyecto || '') ? row.imagen_proyecto : '',
    imagenProyectoPath: /^https?:\/\//i.test(row.imagen_proyecto || '') ? '' : row.imagen_proyecto || '',
    notas: row.notas || '',
    tareas: Array.isArray(row.tareas) ? row.tareas : [],
    proveedores: Array.isArray(row.proveedores) ? row.proveedores : [],
    tipoProyecto: row.tipo_proyecto || 'Vivienda unifamiliar',
    honorariosDiseno: row.honorarios_diseno ?? '',
    honorariosGestion: row.honorarios_gestion ?? '',
    otrosImportes: row.otros_importes ?? '',
    cobros: Array.isArray(row.cobros) ? row.cobros : [],
    comisiones: Array.isArray(row.comisiones) ? row.comisiones : [],
    historial: Array.isArray(row.historial) ? row.historial : [],
    horasEstimadas: row.horas_estimadas ?? '',
    horasReales: row.horas_reales ?? ''
  };
}
export function proyectoParaBD(proyecto, userId) {
  return {
    id: proyecto.id,
    prioridad: proyecto.prioridad || 'en_curso',
    estado: proyecto.estado || 'activo',
    orden: proyecto.orden ?? 0,
    user_id: userId,
    nombre: proyecto.nombre || '',
    cliente: proyecto.cliente || '',
    telefono: proyecto.telefono || '',
    email: proyecto.email || '',
    direccion: proyecto.direccion || '',
    fecha_inicio: proyecto.fechaInicio || null,
    fecha_entrega: proyecto.fechaEntrega || null,
    fase: proyecto.fase || FASES[0],
    importancia: Math.min(10, Math.max(1, Number(proyecto.importancia) || 5)),
    presupuesto_total: numeroOpcional(proyecto.presupuestoTotal),
    presupuesto_gastado: numeroOpcional(proyecto.presupuestoGastado),
    tipo_proyecto: proyecto.tipoProyecto || 'Vivienda unifamiliar',
    honorarios_diseno: numeroOpcional(proyecto.honorariosDiseno),
    honorarios_gestion: numeroOpcional(proyecto.honorariosGestion),
    otros_importes: numeroOpcional(proyecto.otrosImportes),
    cobros: proyecto.cobros || [],
    comisiones: Array.isArray(proyecto.comisiones) ? proyecto.comisiones : [],
    horas_estimadas: numeroOpcional(proyecto.horasEstimadas),
    horas_reales: numeroOpcional(proyecto.horasReales),
    historial: Array.isArray(proyecto.historial) ? proyecto.historial : [],
    presupuesto_pdf: proyecto.presupuestoPdfPath || proyecto.presupuestoPdf || null,
    imagen_proyecto: proyecto.imagenProyectoPath || proyecto.imagenProyecto || null,
    notas: proyecto.notas || '',
    tareas: Array.isArray(proyecto.tareas) ? proyecto.tareas : [],
    proveedores: Array.isArray(proyecto.proveedores) ? proyecto.proveedores : []
  };
}
