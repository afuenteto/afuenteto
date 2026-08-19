import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function EconomicChart({ proyectos }) {

  const total = proyectos.reduce(
    (s, p) =>
      s +
      Number(p.honorariosDiseno || 0) +
      Number(p.honorariosGestion || 0) +
      Number(p.otrosImportes || 0),
    0
  )

  const cobrado = proyectos.reduce(
    (s, p) =>
      s +
      (p.cobros || [])
        .filter(c => c.estado !== 'previsto')
        .reduce(
          (a, c) => a + Number(c.importe || 0),
          0
        ),
    0
  )

  const previsto = proyectos.reduce(
    (s, p) =>
      s +
      (p.cobros || [])
        .filter(c => c.estado === 'previsto')
        .reduce(
          (a, c) => a + Number(c.importe || 0),
          0
        ),
    0
  )

  const datos = [
    {
      nombre: 'Total',
      importe: total
    },
    {
      nombre: 'Cobrado',
      importe: cobrado
    },
    {
      nombre: 'Previsto',
      importe: previsto
    },
    {
      nombre: 'Pendiente',
      importe: total - cobrado
    }
  ]

  return (
    <div className="chart-box">

      <h3 className="serif">
        Economía general
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={datos}>
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip
            formatter={(valor) =>
              `${valor.toLocaleString('es-ES')} €`
            }
          />

          <Bar
            dataKey="importe"
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  )
}
