// El presupuesto total, cuando existe, es la referencia común de todas las
// pantallas. En proyectos antiguos se obtiene de las partidas de honorarios.
export function valorContratado(proyecto) {
  const presupuesto = Number(proyecto.presupuestoTotal)
  return presupuesto > 0 ? presupuesto :
    Number(proyecto.honorariosDiseno || 0) + Number(proyecto.honorariosGestion || 0) +
    Number(proyecto.otrosImportes || 0)
}
