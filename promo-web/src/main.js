import './style.css'
import './brand.css'
import { BRAND, LANGUAGES, getContent, getDefaultLocale, isRtlLocale } from './content.js'

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
  document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
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
        <span class="faq-toggle" aria-hidden="true">+</span>
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
        <div class="lang-switch">
          <label class="sr-only" for="locale-select">Idioma</label>
          <select id="locale-select" class="locale-select" aria-label="Selector de idioma">
            ${LANGUAGES.map(language => `<option value="${language.code}" ${language.code === locale ? 'selected' : ''}>${language.label}</option>`).join('')}
          </select>
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
          <div class="hero-preview-wrap">
          <div class="app-preview" aria-label="Vista ilustrativa de la aplicación">
            <div class="preview-top">
              <div class="preview-brand">
                <img class="preview-icon" src="${logoSrc}" alt="" aria-hidden="true" />
                <span class="preview-copy"><strong>${BRAND.name}</strong><small>${BRAND.tagline}</small></span>
              </div>
              <div class="preview-actions" aria-label="Acciones de la aplicación">
                <span>+ Nuevo proyecto</span>
                <span>Clientes</span>
                <span>Módulos</span>
              </div>
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
                <div class="room room-one">
                  <svg class="kitchen-illustration" viewBox="0 0 120 76" role="img" aria-label="Cocina moderna junto al mar">
                    <path d="M14 17h29v24H14zM18 21h21v16H18z" fill="none" stroke="#171717" stroke-width="1.5" stroke-linejoin="round" />
                    <path d="M21 35c4-5 8-5 12 0M23 31c3 2 6 2 10 0" fill="none" stroke="#f2cc32" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M72 18h30v26H72zM77 23c3-3 6-3 9 0s6 3 9 0" fill="none" stroke="#171717" stroke-width="1.5" stroke-linejoin="round" />
                    <path d="M75 40h24M80 44v12M94 44v12" fill="none" stroke="#171717" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M39 42h48l9 8c-12 6-38 7-61 1l-9-6c2-2 7-3 13-3Z" fill="none" stroke="#171717" stroke-width="1.6" stroke-linejoin="round" />
                    <path d="M39 50l-3 17M82 51l5 16M55 53l-1 14" fill="none" stroke="#171717" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M46 48c3-3 7-3 10 0M69 48c3-3 7-3 10 0" fill="none" stroke="#f2cc32" stroke-width="1.8" stroke-linecap="round" />
                    <path d="M19 43c7 4 14 5 22 4M96 48c5 2 8 3 11 2" fill="none" stroke="#171717" stroke-width="1.3" stroke-linecap="round" />
                  </svg>
                </div>
                <strong>Casa junto al mar</strong>
                <span><i aria-hidden="true"></i> En diseño</span>
              </div>
              <div>
                <div class="room room-two">
                  <svg class="chair-illustration" viewBox="0 0 120 76" role="img" aria-label="Silla de diseño moderna">
                    <path d="M45 14c8-3 16 1 19 8l5 24-19 4-8-27c-1-4 0-7 3-9Z" fill="none" stroke="#171717" stroke-width="1.6" stroke-linejoin="round" />
                    <path d="M39 43c10-4 28-5 43-2l10 7c-12 5-32 8-52 5l-9-5c1-2 4-4 8-5Z" fill="none" stroke="#171717" stroke-width="1.6" stroke-linejoin="round" />
                    <path d="M31 48l-8 20M83 49l11 18M47 52l-3 18M80 51l-7 18" fill="none" stroke="#171717" stroke-width="1.6" stroke-linecap="round" />
                    <path d="M37 42l-8-17M68 43l8-17" fill="none" stroke="#171717" stroke-width="1.4" stroke-linecap="round" />
                    <path d="M30 25c4-2 8-2 12-1M74 26c3-1 6-1 9 1" fill="none" stroke="#f2cc32" stroke-width="2" stroke-linecap="round" />
                    <path d="M55 12c2-2 5-2 7-1" fill="none" stroke="#f2cc32" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </div>
                <strong>Asiento para Lambrusco</strong>
                <span><i aria-hidden="true"></i> En ejecución</span>
              </div>
            </div>
            <div class="preview-footer"><span>Todo en su sitio.</span><span>${BRAND.name}</span></div>
          </div>
          <div class="floating-note"><span aria-hidden="true">✓</span><div>Un poco más de orden.<br><strong>Mucho más de calma.</strong></div></div>
          </div>
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
      <div class="footer-info">
        <nav class="footer-app-links" aria-label="Apartados legales">
          ${content.footer.appSections.map((label, index) => `${index > 0 ? '<span class="footer-separator" aria-hidden="true">|</span>' : ''}<a href="#inicio" data-info="${label}">${label}</a>`).join('')}
        </nav>
        <p class="footer-copy">${content.footer.copyright} <a href="https://www.beusual.com/" target="_blank" rel="noreferrer">Beusual</a> ${content.footer.version}</p>
      </div>
    </footer>

    <dialog class="info-dialog" aria-labelledby="info-dialog-title">
      <button class="dialog-close" type="button" aria-label="Cerrar">×</button>
      <div class="info-dialog-content"></div>
    </dialog>
  `

  const menu = document.querySelector('.menu-toggle')
  const nav = document.querySelector('#navigation')
  const localeSelect = document.querySelector('#locale-select')
  const featureButtons = document.querySelectorAll('[data-feature]')
  const infoDialog = document.querySelector('.info-dialog')
  const infoDialogContent = document.querySelector('.info-dialog-content')
  const infoLinks = document.querySelectorAll('[data-info]')

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

  localeSelect?.addEventListener('change', event => setLocale(event.target.value))

  infoLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault()
      const key = link.dataset.info
      if (key === 'Contacto' || key === 'Contact') {
        const contact = content.footer.contact
        infoDialogContent.innerHTML = `
          <h2 id="info-dialog-title">${contact.title}</h2>
          <p class="dialog-intro">${contact.intro}</p>
          <form class="contact-form" data-contact-form>
            <label>${contact.name}<input name="name" autocomplete="name" required /></label>
            <label>${contact.email}<input name="email" type="email" autocomplete="email" required /></label>
            <label>${contact.subject}<input name="subject" required /></label>
            <label>${contact.message}<textarea name="message" rows="5" required></textarea></label>
            <button class="button button-dark" type="submit">${contact.submit}</button>
            <p class="form-status" hidden>${contact.success}</p>
          </form>
        `
      } else {
        const legal = content.footer.legalContent[key]
        infoDialogContent.innerHTML = `
          <h2 id="info-dialog-title">${legal.title}</h2>
          <div class="legal-copy">${legal.paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('')}</div>
        `
      }

      infoDialog.showModal()
    })
  })

  infoDialog?.addEventListener('click', event => {
    if (event.target === infoDialog || event.target.closest('.dialog-close')) infoDialog.close()
  })
  infoDialog?.addEventListener('submit', event => {
    if (!event.target.matches('[data-contact-form]')) return
    event.preventDefault()
    event.target.querySelector('.form-status').hidden = false
    event.target.reset()
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
