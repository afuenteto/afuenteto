import { useState } from 'react'

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

  const [mostrarGrafico, setMostrarGrafico] = useState(false)


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

  const datosComisiones = [
    {
      nombre: 'Generadas',
      importe: comisiones.total
    },
    {
      nombre: 'Cobradas',
      importe: comisiones.cobradas
    },
    {
      nombre: 'Pendientes',
      importe: comisiones.pendientes
    }
  ]


  return (
    <div className="chart-box">

      <h3
        className="serif dashboard-toggle"
        onClick={() => setMostrarGrafico(!mostrarGrafico)}
        style={{ cursor: 'pointer' }}
      >
        Economía general

        <span style={{ float: 'right' }}>
          {mostrarGrafico ? '−' : '+'}
        </span>

      </h3>


      {mostrarGrafico && (

        <>
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
                        ? '#ffd400'
                        : entrada.nombre === 'Cobrado'
                        ? '#e8c000'
                        : entrada.nombre === 'Previsto'
                        ? '#fff3a6'
                        : '#E59A00'
                    }
                  />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

          <div className="section-label dashboard-section-heading economy-commissions-title">
            Comisiones de colaboradores
          </div>

          <div className="dashboard-grid economy-commissions-grid">
            <div className="field">
              <label>Generadas</label>
              <input
                readOnly
                value={`${comisiones.total.toLocaleString('es-ES')} €`}
              />
            </div>

            <div className="field">
              <label>Cobradas</label>
              <input
                readOnly
                value={`${comisiones.cobradas.toLocaleString('es-ES')} €`}
              />
            </div>

            <div className="field">
              <label>Pendientes</label>
              <input
                readOnly
                value={`${comisiones.pendientes.toLocaleString('es-ES')} €`}
              />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={datosComisiones}>
              <XAxis dataKey="nombre" />

              <YAxis />

              <Tooltip
                formatter={(valor) =>
                  `${valor.toLocaleString('es-ES')} €`
                }
              />

              <Bar dataKey="importe">
                {datosComisiones.map((entrada, index) => (
                  <Cell
                    key={`comision-cell-${index}`}
                    fill={
                      entrada.nombre === 'Generadas'
                        ? '#B23A48'
                        : entrada.nombre === 'Cobradas'
                        ? '#D8574E'
                        : '#F08A7E'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>

      )}

    </div>
  )
}
