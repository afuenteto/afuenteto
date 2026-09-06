import { t as translateUI } from '../i18n.js'
import { FASES } from '../storage.js'

export default function PhaseRail({ fase }) {
  const idx = Math.max(0, FASES.indexOf(fase))
  const fillPct = FASES.length > 1 ? (idx / (FASES.length - 1)) * 100 : 0

  return (
    <div className="phase-rail">
      <div className="phase-rail-track">
        <div className="phase-rail-line" />
        <div className="phase-rail-fill" style={{ width: `${fillPct}%` }} />
        <div className="phase-ticks">
          {FASES.map((f, i) => (
            <span
              key={f}
              className={
                'phase-tick' +
                (i < idx ? ' done' : '') +
                (i === idx ? ' current' : '')
              }
              title={translateUI(f)}
            />
          ))}
        </div>
      </div>
      <div className="phase-labels">
        {FASES.map((f, i) => (
          <span key={f} className={i === idx ? 'active' : ''}>
            {translateUI(f)}
          </span>
        ))}
      </div>
    </div>
  )
}
