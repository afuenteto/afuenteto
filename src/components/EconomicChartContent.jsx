import { valorContratado } from '../projectFinance.js'
import IncomeReport from './IncomeReport.jsx'
import { t as translateUI, getLocale } from '../i18n.js'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function EconomicChartContent({ proyectos }) {
  const total = proyectos.reduce((suma, p) => suma + valorContratado(p), 0)

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

  const comisiones = proyectos.reduce(
    (acc, p) => {
      const lista = Array.isArray(p.comisiones) ? p.comisiones : []

      lista.forEach((comision) => {
        const importe =
          Number(comision.presupuesto || 0) *
          Number(comision.porcentaje || 0) / 100

        acc.total += importe

        if (comision.estado === 'cobrada') {
          acc.cobradas += importe
        } else {
          acc.pendientes += importe
        }
      })

      return acc
    },
    { total: 0, cobradas: 0, pendientes: 0 }
  )

  const datos = [
    {
      nombre: "Cobrado",
      importe: cobrado
    },
    {
      nombre: "Previsto",
      importe: previsto
    },
    {
      nombre: "Pendiente",
      importe: total - cobrado
    },
    {
      nombre: "Total",
      importe: total
    }
  ]

  const datosComisiones = [
    {
      nombre: "Generadas",
      importe: comisiones.total
    },
    {
      nombre: "Cobradas",
      importe: comisiones.cobradas
    },
    {
      nombre: "Pendientes",
      importe: comisiones.pendientes
    }
  ]

  return (
        <>
          <IncomeReport proyectos={proyectos} />
          <ResponsiveContainer width="100%" height={250}>

            <BarChart data={datos}>

              <XAxis dataKey="nombre" tickFormatter={translateUI} />

              <YAxis />

              <Tooltip labelFormatter={translateUI}
                formatter={(valor) =>
                  `${valor.toLocaleString(getLocale())} €`
                }
              />


              <Bar dataKey="importe" name={translateUI("Importe")}>

                {datos.map((entrada, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entrada.nombre === 'Total'
                        ? 'var(--accent)'
                        : entrada.nombre === 'Cobrado'
                        ? 'var(--accent-hover)'
                        : entrada.nombre === 'Previsto'
                        ? 'var(--accent-soft)'
                        : 'var(--brand-heading)'
                    }
                  />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

          <div className="section-label dashboard-section-heading economy-commissions-title">{translateUI("Comisiones de colaboradores")}</div>

          <div className="dashboard-grid economy-commissions-grid">
            <div className="field">
              <label>{translateUI("Generadas")}</label>
              <input
                readOnly
                value={`${comisiones.total.toLocaleString(getLocale())} €`}
              />
            </div>

            <div className="field">
              <label>{translateUI("Cobradas")}</label>
              <input
                readOnly
                value={`${comisiones.cobradas.toLocaleString(getLocale())} €`}
              />
            </div>

            <div className="field">
              <label>{translateUI("Pendientes")}</label>
              <input
                readOnly
                value={`${comisiones.pendientes.toLocaleString(getLocale())} €`}
              />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={datosComisiones}>
              <XAxis dataKey="nombre" tickFormatter={translateUI} />

              <YAxis />

              <Tooltip labelFormatter={translateUI}
                formatter={(valor) =>
                  `${valor.toLocaleString(getLocale())} €`
                }
              />

              <Bar dataKey="importe" name={translateUI("Importe")}>
                {datosComisiones.map((entrada, index) => (
                  <Cell
                    key={`comision-cell-${index}`}
                    fill={
                      entrada.nombre === 'Generadas'
                        ? 'var(--brand-heading)'
                        : entrada.nombre === 'Cobradas'
                        ? 'var(--accent)'
                        : 'var(--accent-soft)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
  )
}
