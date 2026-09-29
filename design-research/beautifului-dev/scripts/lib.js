const { chromium } = require('playwright')

const SITE = 'https://www.beautifului.dev/'
const OUT = '/Users/macbookpro-1/Documents/VM-Repo/petrodata/design-research/beautifului-dev'

const VIEWPORTS = [
  { w: 375, h: 812, name: '375' },
  { w: 768, h: 1024, name: '768' },
  { w: 1280, h: 900, name: '1280' },
  { w: 1920, h: 1080, name: '1920' },
]

async function abrir({ width = 1280, height = 900, theme = 'dark', reducedMotion = 'no-preference', url = SITE } = {}) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion,
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  await ponerTema(page, theme)
  await page.waitForTimeout(700)
  return { browser, ctx, page }
}

/** Fuerza el tema. Primero prueba el toggle real del sitio; si no, la clase. */
async function ponerTema(page, theme) {
  const yaEsta = await page.evaluate((t) => document.documentElement.classList.contains('dark') === (t === 'dark'), theme)
  if (yaEsta) return 'ya-estaba'
  const btn = page.locator('button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i], button[title*="theme" i]').first()
  if (await btn.count()) {
    try {
      await btn.click({ timeout: 3000 })
      await page.waitForTimeout(400)
      const ok = await page.evaluate((t) => document.documentElement.classList.contains('dark') === (t === 'dark'), theme)
      if (ok) return 'toggle'
    } catch {}
  }
  await page.evaluate((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark')
  }, theme)
  return 'clase'
}

module.exports = { chromium, SITE, OUT, VIEWPORTS, abrir, ponerTema }
