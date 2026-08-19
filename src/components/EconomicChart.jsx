import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
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
  },
  {
    nombre: 'Total',
    importe: total
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

          <Bar dataKey="importe">
  {datos.map((entrada, index) => (
    <Cell
      key={`cell-${index}`}
      fill={
        entrada.nombre === 'Total'
          ? '#CB8400'
          : entrada.nombre === 'Cobrado'
          ? '#F5D478'
          : entrada.nombre === 'Previsto'
          ? '#F0B937'
          : '#E59A00'
      }
    />
  ))}
</Bar>
        </BarChart>
      </ResponsiveContainer>

    </div>
  )
}
