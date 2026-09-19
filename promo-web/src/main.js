import './style.css'
import './brand.css'
import { BRAND, getContent, getDefaultLocale } from './content.js'

const app = document.querySelector('#app')
const defaultLocale = getDefaultLocale()

function setLocale(nextLocale) {
  const url = new URL(window.location.href)
  url.searchParams.set('lang', nextLocale)
  window.history.replaceState({}, '', url)
  render(nextLocale)
}

const logoSrc = `${import.meta.env.BASE_URL}header-photo.png`
const APP_URL = 'https://afuenteto.github.io/afuenteto/'
const appleGlyph = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.9c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.5-.4 6.1 1 8.1.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.9-2.3-3.2Z" fill="currentColor"/><path d="M14.2 6.3c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.7-.9 2.6.9.1 1.9-.5 2.5-1.2Z" fill="currentColor"/></svg>'
const playGlyph = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.6c0-.5.5-.8 1-.6l12.4 8.4c.4.3.4.9 0 1.2L6 20.9c-.5.2-1-.1-1-.6Z" fill="currentColor"/></svg>'

function render(locale = defaultLocale) {
  const content = getContent(locale)
  document.documentElement.lang = locale
  document.title = `${BRAND.name} — Gestión creativa`

  const navItems = content.nav.map(item => `
    <a href="${item.href}">${item.label}</a>
  `).join('')

  const featureTabs = content.functions.tabs.map((tab, index) => `
    <button
      id="tab-${tab.id}"
      type="button"
      role="tab"
      aria-selected="${index === 0}"
      aria-controls="panel-${tab.id}"
      class="feature-tab ${index === 0 ? 'is-active' : ''}"
      data-feature="${tab.id}"
      tabindex="${index === 0 ? 0 : -1}"
    >
      <span class="tab-index">${tab.short}</span>
      <span>${tab.label}</span>
      <span class="tab-arrow" aria-hidden="true">↗</span>
    </button>
  `).join('')

  const featurePanels = Object.entries(content.functions.panels).map(([key, panel]) => `
    <div
      id="panel-${key}"
      class="feature-panel ${key === 'projects' ? 'is-visible' : ''}"
      role="tabpanel"
      aria-labelledby="tab-${key}"
      data-feature-panel="${key}"
    >
      <span class="panel-tag">${panel.tag}</span>
      <h3>${panel.title}</h3>
      <p>${panel.text}</p>
      <div class="panel-example">
        ${panel.example.map(item => `<span>${item}</span>`).join('<i aria-hidden="true"></i>')}
      </div>
    </div>
  `).join('')

  const faqItems = content.faq.items.map((item, index) => `
    <details ${index === 0 ? 'open' : ''}>
      <summary>
        <span>${item.q}</span>
        <span aria-hidden="true">+</span>
      </summary>
      <p>${item.a}</p>
    </details>
  `).join('')

  const reasons = content.why.points.map((point, index) => `
    <article class="reason-card">
      <span class="index">0${index + 1}</span>
      <h3>${point.title}</h3>
      <p>${point.text}</p>
    </article>
  `).join('')

  const workflow = content.workflow.steps.map(step => `
    <li>
      <span class="step-number">${step.number}</span>
      <h3>${step.title}</h3>
      <p>${step.text}</p>
      <span class="step-meta">${step.meta}</span>
    </li>
  `).join('')

  const appPoints = content.app.points.map((point, index) => `
    <article class="value-card">
      <span class="index">0${index + 1}</span>
      <h3>${point.title}</h3>
      <p>${point.text}</p>
    </article>
  `).join('')

  const platformImages = ['escritorio.png', 'tablet.png', 'movil.png']
  const platformCards = content.platforms.cards.map((card, index) => `
    <article class="platform-card">
      <img class="platform-illustration" src="${import.meta.env.BASE_URL}${platformImages[index]}" alt="" aria-hidden="true" />
      <h3>${card.title}</h3>
      <p>${card.text}</p>
    </article>
  `).join('')

  const storeBadges = content.download.stores.map(store => `
    <div class="store-badge">
      <span class="store-icon" aria-hidden="true">${store.name === 'App Store' ? appleGlyph : playGlyph}</span>
      <span class="store-copy"><strong>${store.name}</strong><small>${store.caption}</small></span>
    </div>
  `).join('')

  const formatCards = content.download.formats.items.map((item, index) => `
    <article class="value-card">
      <span class="index">0${index + 1}</span>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
      <span class="format-tag${index === content.download.formats.items.length - 1 ? ' is-soon' : ''}">${item.tag}</span>
    </article>
  `).join('')

  const pricingCards = content.download.pricing.plans.map(plan => `
    <article class="price-card${plan.highlighted ? ' is-highlighted' : ''}">
      <h3>${plan.name}</h3>
      <p class="price-value">${plan.price}<span>${plan.period}</span></p>
      <ul class="price-features">
        ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
      </ul>
      <a class="button ${plan.highlighted ? 'button-dark' : 'button-light'}" href="${APP_URL}">${plan.cta}</a>
    </article>
  `).join('')

  app.innerHTML = `
    <a class="skip-link" href="#contenido">Ir al contenido</a>
    <span id="inicio" class="top-anchor" aria-hidden="true"></span>
    <div class="site-header-bar">
    <header class="site-header wrap">
      <a class="wordmark" href="#inicio" aria-label="${BRAND.name}, inicio">
        <img class="brand-mark" src="${logoSrc}" alt="" aria-hidden="true" />
        <span class="brand-copy"><span class="brand-name">${BRAND.name}</span><span class="brand-tag">${BRAND.tagline}</span></span>
      </a>

      <button class="menu-toggle" aria-controls="navigation" aria-expanded="false" type="button">
        Menú <span aria-hidden="true">+</span>
      </button>

      <nav id="navigation" aria-label="Navegación principal">
        ${navItems}
        <div class="lang-switch" aria-label="Selector de idioma">
          <button class="locale-button ${locale === 'es' ? 'is-active' : ''}" type="button" data-locale="es">ES</button>
          <button class="locale-button ${locale === 'en' ? 'is-active' : ''}" type="button" data-locale="en">EN</button>
        </div>
        <a class="nav-cta" href="#descarga">${content.header.cta}<span aria-hidden="true">↗</span></a>
      </nav>
    </header>
    </div>

    <main id="contenido">
      <section class="hero wrap" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> ${content.hero.eyebrow}</p>
          <h1 id="hero-title">
            ${content.hero.title.map(line => `<span>${line}</span>`).join('')}
          </h1>
          <p class="hero-subtitle">${content.hero.text}</p>
          <div class="hero-actions">
            <a class="button button-dark" href="#descarga">${content.hero.primary}<span aria-hidden="true">↗</span></a>
            <a class="text-link" href="#funciones">${content.hero.secondary}<span aria-hidden="true">↓</span></a>
          </div>
          <p class="small-note">${content.hero.note}</p>
        </div>

        <div class="hero-visual">
          <div class="visual-badge"><span>${content.hero.badge}</span><span aria-hidden="true">↙</span></div>
          <div class="app-preview" aria-label="Vista ilustrativa de la aplicación">
            <div class="preview-top">
              <div class="preview-brand">
                <img class="preview-icon" src="${logoSrc}" alt="" aria-hidden="true" />
                <span class="preview-copy"><strong>${BRAND.name}</strong><small>${BRAND.tagline}</small></span>
              </div>
              <span class="preview-avatar" aria-hidden="true">M</span>
            </div>
            <div class="preview-heading"><span>HOY EN EL ESTUDIO</span><span aria-hidden="true">↗</span></div>
            <div class="preview-date">Jueves, 17 de septiembre <span>|</span> 09 : 30 <span class="preview-plus" aria-hidden="true">+</span></div>
            <div class="preview-stats">
              <span><strong>02</strong> Para hoy</span>
              <span><strong>05</strong> Esta semana</span>
              <span><strong>03</strong> Proyectos</span>
            </div>
            <div class="preview-event">
              <span class="event-time">10:00<small>HOY</small></span>
              <span><small>VISITA DE OBRA</small><strong>Una nueva vida en el centro</strong><span>Vivienda · Calle del Sol</span></span>
              <span class="event-dot" aria-hidden="true"></span>
            </div>
            <div class="preview-event event-blue">
              <span class="event-time">16:30<small>HOY</small></span>
              <span><small>REUNIÓN CON CLIENTE</small><strong>Elegimos los materiales</strong><span>Proyecto · Casa junto al mar</span></span>
              <span class="event-dot" aria-hidden="true"></span>
            </div>
            <div class="preview-project-title">PROYECTOS <span>Ver todos ↗</span></div>
            <div class="mini-projects">
              <div>
                <div class="room room-one"><span class="room-window"></span><span class="room-sofa"></span><span class="room-table"></span></div>
                <strong>Casa junto al mar</strong>
                <span><i aria-hidden="true"></i> En diseño</span>
              </div>
              <div>
                <div class="room room-two"><span class="room-window"></span><span class="room-sofa"></span><span class="room-table"></span></div>
                <strong>Vivienda Calle del Sol</strong>
                <span><i aria-hidden="true"></i> En obra</span>
              </div>
            </div>
            <div class="preview-footer"><span>Todo en su sitio.</span><span>${BRAND.name}</span></div>
          </div>
          <div class="floating-note"><span aria-hidden="true">✓</span><div>Un poco más de orden.<br><strong>Mucho más de calma.</strong></div></div>
          <p class="mockup-caption">Vista ilustrativa · Datos de ejemplo</p>
        </div>
      </section>

      <div class="discipline-strip">
        <div class="wrap strip-inner">
          <span>Del primer boceto a la última entrega.</span>
          <span>${content.strip.items.join(' <b>·</b> ')}</span>
        </div>
      </div>

      <section id="la-app" class="intro-section wrap">
        <p class="eyebrow">${content.app.eyebrow}</p>
        <div class="section-intro">
          <h2>${content.app.title}</h2>
          <p>${content.app.text}</p>
        </div>
        <div class="value-grid">
          ${appPoints}
        </div>
      </section>

      <section id="funciones" class="modules-section">
        <div class="wrap">
          <div class="section-intro section-intro-row">
            <div>
              <p class="eyebrow">${content.functions.eyebrow}</p>
              <h2>${content.functions.title}</h2>
            </div>
            <p>${content.functions.text}</p>
          </div>

          <div class="feature-layout">
            <div class="feature-tabs" role="tablist" aria-label="Funciones principales">
              ${featureTabs}
            </div>
            <div class="feature-panels">
              ${featurePanels}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" class="workflow-section wrap" aria-labelledby="workflow-title">
        <div class="section-intro section-intro-row">
          <div>
            <p class="eyebrow">${content.workflow.eyebrow}</p>
            <h2 id="workflow-title">${content.workflow.title}</h2>
          </div>
          <p>${content.workflow.text}</p>
        </div>

        <ol class="workflow-steps">
          ${workflow}
        </ol>
      </section>

      <section id="origen" class="origin-section wrap">
        <div class="origin-grid">
          <div class="origin-visual">
            <img class="origin-image" src="${import.meta.env.BASE_URL}profesional creativo.png" alt="Profesional creativo trabajando sobre los planos de un proyecto" />
          </div>
          <div class="origin-content">
            <p class="eyebrow">${content.origin.eyebrow}</p>
            <h2>${content.origin.title}</h2>
            <div class="origin-copy">
              <p>${content.origin.text}</p>
              <p>${content.origin.secondary}</p>
            </div>
            <ul class="origin-list">
              ${content.origin.points.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>

      <section class="reasons-section wrap">
        <p class="eyebrow">${content.why.eyebrow}</p>
        <div class="section-intro">
          <h2>${content.why.title}</h2>
          <p>${content.why.text}</p>
        </div>
        <div class="reason-grid">
          ${reasons}
        </div>
      </section>

      <section class="video-section wrap" aria-labelledby="video-title">
        <div class="section-intro section-intro-row">
          <div>
            <p class="eyebrow">${content.video.eyebrow}</p>
            <h2 id="video-title">${content.video.title}</h2>
          </div>
          <p>${content.video.text}</p>
        </div>
        <div class="video-card" role="img" aria-label="Presentación visual de la aplicación">
          <div class="video-play" aria-hidden="true">▶</div>
          <span>${content.video.label}</span>
        </div>
      </section>

      <section class="platforms-section wrap">
        <div class="section-intro section-intro-row">
          <div>
            <p class="eyebrow">${content.platforms.eyebrow}</p>
            <h2>${content.platforms.title}</h2>
          </div>
          <p>${content.platforms.text}</p>
        </div>
        <div class="platform-grid">
          ${platformCards}
        </div>
        <div class="platform-cta">
          <a class="button button-dark" href="#descarga">${content.platforms.cta}<span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <section id="descarga" class="intro-section wrap">
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> ${content.download.eyebrow}</p>
        <div class="section-intro">
          <h2>${content.download.title}</h2>
          <p>${content.download.text}</p>
        </div>
        <div class="download-actions">
          <a class="button button-dark" href="${APP_URL}">${content.download.openApp}<span aria-hidden="true">↗</span></a>
        </div>
        <div class="store-grid">
          ${storeBadges}
        </div>
        <p class="small-note">${content.download.storesNote}</p>
        <p class="eyebrow download-subhead">${content.download.formats.eyebrow}</p>
        <div class="value-grid download-formats">
          ${formatCards}
        </div>
        <p class="eyebrow download-subhead">${content.download.pricing.eyebrow}</p>
        <div class="pricing-grid">
          ${pricingCards}
        </div>
      </section>

      <section id="faq" class="faq-section wrap">
        <div class="faq-title-block">
          <p class="eyebrow">${content.faq.eyebrow}</p>
          <h2>${content.faq.title}</h2>
        </div>
        <div class="faq-list">
          ${faqItems}
        </div>
      </section>

      <section class="closing wrap">
        <p class="eyebrow">${content.cta.eyebrow}</p>
        <h2>${content.cta.title}</h2>
        <p class="closing-description">${content.cta.text}</p>
        <div class="closing-actions">
          <a class="button button-dark" href="#descarga">${content.cta.primary}<span aria-hidden="true">↗</span></a>
          <a class="button button-light" href="#inicio">${content.cta.secondary}</a>
        </div>
      </section>
    </main>

    <footer class="site-footer wrap">
      <div class="footer-brand">
        <a class="wordmark footer-wordmark" href="#inicio">
          <img class="brand-mark" src="${logoSrc}" alt="" aria-hidden="true" />
          <span class="brand-name">${BRAND.name}</span>
        </a>
      </div>
      <p>${content.footer.text}</p>
    </footer>
  `

  const menu = document.querySelector('.menu-toggle')
  const nav = document.querySelector('#navigation')
  const localeButtons = document.querySelectorAll('[data-locale]')
  const featureButtons = document.querySelectorAll('[data-feature]')

  if (menu && nav) {
    const closeMenu = () => {
      menu.setAttribute('aria-expanded', 'false')
      nav.classList.remove('is-open')
    }

    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true'
      menu.setAttribute('aria-expanded', String(open))
      nav.classList.toggle('is-open', open)
    })

    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu()
    })

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu()
        menu.focus()
      }
    })
  }

  localeButtons.forEach(button => {
    button.addEventListener('click', () => setLocale(button.dataset.locale))
  })

  featureButtons.forEach(button => {
    button.addEventListener('click', () => {
      const feature = button.dataset.feature
      const allFeatureButtons = document.querySelectorAll('[data-feature]')
      const allPanels = document.querySelectorAll('[data-feature-panel]')

      allFeatureButtons.forEach(item => {
        const active = item.dataset.feature === feature
        item.classList.toggle('is-active', active)
        item.setAttribute('aria-selected', String(active))
        item.tabIndex = active ? 0 : -1
      })

      allPanels.forEach(panel => {
        const visible = panel.dataset.featurePanel === feature
        panel.classList.toggle('is-visible', visible)
      })
    })
  })
}

render(defaultLocale)
