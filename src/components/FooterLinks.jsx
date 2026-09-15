import { useLayoutEffect, useRef } from 'react'
import { getLanguage } from '../i18n.js'

export default function FooterLinks({ children }) {
  const ref = useRef(null)
  const language = getLanguage()
  useLayoutEffect(() => {
    const element = ref.current
    let active = true
    function fit() {
      if (!active) return
      element.dataset.layout = 'single'
      for (const padding of [18, 12, 8, 4]) {
        element.style.setProperty('--footer-padding', `${padding}px`)
        element.style.setProperty('--footer-tracking', padding === 4 ? '-.15px' : '0px')
        const required = [...element.children].reduce((width, child) => width + child.getBoundingClientRect().width, 0)
        if (required <= element.clientWidth + 1) return
      }
      element.dataset.layout = 'double'
      element.style.setProperty('--footer-tracking', '0px')
    }
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    fit()
    document.fonts?.ready.then(fit)
    return () => { active = false; observer.disconnect() }
  }, [language, children])
  return <div className="app-footer-links" ref={ref}>{children}</div>
}
