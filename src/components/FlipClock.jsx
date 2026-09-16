import { Fragment, useEffect, useState } from 'react'

function FlipCard({ value }) {
  const [previous, setPrevious] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setPrevious(value), 600)
    return () => clearTimeout(timer)
  }, [value])
  return <span className="flip-card" aria-hidden="true">
    <span className="flip-half flip-top"><span>{value}</span></span>
    <span className="flip-half flip-bottom"><span>{previous}</span></span>
    {previous !== value && <span className="flip-motion" key={value}>
      <span className="flip-half flip-top flip-out"><span>{previous}</span></span>
      <span className="flip-half flip-bottom flip-in"><span>{value}</span></span>
    </span>}
  </span>
}

export default function FlipClock({ now }) {
  const parts = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, '0'))
  return <time className="daily-clock flip-clock" dateTime={now.toISOString()} aria-label={parts.join(' : ')}>
    {parts.map((value, index) => <Fragment key={index}>
      {index > 0 && <span className="flip-separator" aria-hidden="true">:</span>}
      <FlipCard value={value} />
    </Fragment>)}
  </time>
}
