import './style.css'
import './brand.css'
import { BRAND, getContent, getDefaultLocale } from './content.js'

const app = document.querySelector('#app')
const defaultLocale = getDefaultLocale()
const logoSrc = `${import.meta.env.BASE_URL}header-photo.png`
const APP_URL = 'https://afuenteto.github.io/afuenteto/'

const appleGlyph = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.9c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.5-.4 6.1 1 8.1.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.9-2.3-3.2Z" fill="currentColor"/><path d="M14.2 6.3c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.7-.9 2.6.9.1 1.9-.5 2.5-1.2Z" fill="currentColor"/></svg>'
const playGlyph = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.6c0-.5.5-.8 1-.6l12.4 8.4c.4.3.4.9 0 1.2L6 20.9c-.5.2-1-.1-1-.6Z" fill="currentColor"/></svg>'

function setLocale(nextLocale) {
  const url = new URL(window.location.href)
  url.searchParams.set('lang', nextLocale)
  window.history.replaceState({}, '', url)
  render(nextLocale)
}

function homeHref(href, locale) {
  return href.startsWith('#') ? `index.html${href}` : `${href}?lang=${locale}`
}

function render(locale = defaultLocale) {
  const content = getContent(locale)
  const d = content.download
  document.documentElement.lang = locale
  document.title = `${d.title} — ${BRAND.name}`

  const navItems = content.nav.map(item => `
    <a href="${item.href === 'descarga.html' ? `${item.href}?lang=${locale}` : homeHref(item.href, locale)}"${item.href === 'descarga.html' ? ' aria-current="page"' : ''}>${item.label}</a>
  `).join('')

  const storeBadges = d.stores.map(store => `
    <div class="store-badge">
      <span class="store-icon" aria-hidden="true">${store.name === 'App Store' ? appleGlyph : playGlyph}</span>
      <span class="store-copy"><strong>${store.name}</strong><small>${store.caption}</small></span>
    </div>
  `).join('')

  const formatCards = d.formats.items.map((item, index) => `
    <article class="value-card">
      <span class="index">0${index + 1}</span>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
      <span class="format-tag${item.tag === d.formats.items[2].tag ? ' is-soon' : ''}">${item.tag}</span>
    </article>
  `).join('')

  const pricingCards = d.pricing.plans.map(plan => `
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
    <div class="site-header-bar">
    <header class="site-header wrap">
      <a class="wordmark" href="index.html?lang=${locale}" aria-label="${BRAND.name}, inicio">
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
      </nav>
    </header>
    </div>

    <main id="contenido">
      <section class="intro-section wrap">
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> ${d.eyebrow}</p>
        <div class="section-intro">
          <h2>${d.title}</h2>
          <p>${d.text}</p>
        </div>
        <div class="download-actions">
          <a class="button button-dark" href="${APP_URL}">${d.openApp}<span aria-hidden="true">↗</span></a>
        </div>
        <div class="store-grid">
          ${storeBadges}
        </div>
        <p class="small-note">${d.storesNote}</p>
      </section>

      <section class="modules-section">
        <div class="wrap">
          <div class="section-intro">
            <p class="eyebrow">${d.formats.eyebrow}</p>
            <h2>${d.formats.title}</h2>
          </div>
          <div class="value-grid">
            ${formatCards}
          </div>
        </div>
      </section>

      <section class="reasons-section wrap">
        <p class="eyebrow">${d.pricing.eyebrow}</p>
        <div class="section-intro">
          <h2>${d.pricing.title}</h2>
          <p>${d.pricing.text}</p>
        </div>
        <div class="pricing-grid">
          ${pricingCards}
        </div>
      </section>
    </main>

    <footer class="site-footer wrap">
      <div class="footer-brand">
        <a class="wordmark footer-wordmark" href="index.html?lang=${locale}">
          <img class="brand-mark" src="${logoSrc}" alt="" aria-hidden="true" />
          <span class="brand-name">${BRAND.name}</span>
        </a>
      </div>
      <p>${content.footer.text}</p>
      <div class="footer-links">
        <a href="index.html?lang=${locale}">${content.nav[0].label}</a>
      </div>
      <div class="footer-legal">
        ${content.footer.legal.map(item => `<a href="#">${item}</a>`).join('')}
      </div>
    </footer>
  `

  const menu = document.querySelector('.menu-toggle')
  const nav = document.querySelector('#navigation')
  const localeButtons = document.querySelectorAll('[data-locale]')

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
}

render(defaultLocale)
