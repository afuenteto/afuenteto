const [mostrarResumen, setMostrarResumen] = useState(false)

  const valorTotal = proyectos.reduce(
    (total, p) => {
      const valorProyecto =
        p.presupuestoTotal && Number(p.presupuestoTotal) > 0
          ? Number(p.presupuestoTotal)
          : Number(p.honorariosDiseno || 0) +
            Number(p.honorariosGestion || 0) +
            Number(p.otrosImportes || 0)

      return total + valorProyecto
    },
    0
  )

  const cobradoTotal = proyectos.reduce(
    (total, p) =>
      total +
      (p.cobros || []).reduce(
        (suma, c) => suma + Number(c.importe || 0),
        0
      ),
    0
  )

  const pendienteTotal = valorTotal - cobradoTotal

  return (
    <div className="studio-dashboard">

     <h3
  className="serif dashboard-toggle"
  onClick={() => setMostrarResumen(!mostrarResumen)}
  style={{ cursor: 'pointer' }}
>
  Resumen del estudio
  <span style={{ float: 'right' }}>
    {mostrarResumen ? '−' : '+'}
  </span>
</h3>


      {mostrarResumen && (
        <>

          <div className="field-row">

            <div className="field">
              <label>Valor contratado</label>
              <input
                type="text"
                readOnly
                value={`${valorTotal.toLocaleString('es-ES')} €`}
              />
            </div>


            <div className="field">
              <label>Total cobrado</label>
              <input
                type="text"
                readOnly
                value={`${cobradoTotal.toLocaleString('es-ES')} €`}
              />
            </div>

          </div>


          <div className="field">
            <label>Pendiente de cobro</label>
            <input
              type="text"
              readOnly
              value={`${pendienteTotal.toLocaleString('es-ES')} €`}
            />
          </div>


          <div className="field">
            <label>Proyectos activos</label>
            <input
              type="text"
              readOnly
              value={proyectos.length}
            />
          </div>

        </>
      )}

    </div>
  )
}
