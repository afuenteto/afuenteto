import { Component, lazy, Suspense, useState } from 'react'
import { t } from '../i18n.js'

const EconomicChartContent = lazy(() => import('./EconomicChartContent.jsx'))

class ChartBoundary extends Component {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) return <div role="alert">
      <p>{t('No se pudieron cargar los datos')}</p>
      <button type="button" className="btn" onClick={() => window.location.reload()}>{t('Reintentar')}</button>
    </div>
    return this.props.children
  }
}

export default function EconomicChart({ proyectos = [], embedded = false }) {
  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  return <div className="chart-box">
    {!embedded && <h3 className="serif">
      <button type="button" className="dashboard-toggle" aria-expanded={mostrarGrafico}
        onClick={() => setMostrarGrafico(value => !value)}>
        {t('Economía general')}<span aria-hidden="true">{mostrarGrafico ? '−' : '+'}</span>
      </button>
    </h3>}
    {(embedded || mostrarGrafico) && <ChartBoundary>
      <Suspense fallback={<progress aria-label={t('Economía general')} />}>
        <EconomicChartContent proyectos={proyectos} />
      </Suspense>
    </ChartBoundary>}
  </div>
}
