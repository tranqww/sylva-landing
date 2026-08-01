/**
 * Visual regression harness.
 *
 * Boots the built site on a static server and captures the hero at several
 * points in its intro timeline plus every section below the fold, so the
 * result can be compared against the reference capture frame by frame.
 *
 *   node scripts/shoot.mjs [outDir] [--url http://localhost:4173]
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const out = resolve(args.find((a) => !a.startsWith('--')) ?? 'shots')
const urlFlag = args.indexOf('--url')
const base = urlFlag > -1 ? args[urlFlag + 1] : 'http://localhost:4173'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const SECTIONS = ['#about', '#services', '#how-it-works', '#pricing']

await mkdir(out, { recursive: true })

const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  })

  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(base, { waitUntil: 'networkidle' })

  // intro timeline beats
  for (const [label, wait] of [
    ['00-load', 350],
    ['01-headline', 700],
    ['02-settled', 900],
    ['03-expanded', 1600],
  ]) {
    await page.waitForTimeout(wait)
    await page.screenshot({ path: `${out}/${vp.name}-${label}.png` })
  }

  for (const sel of SECTIONS) {
    await page.evaluate((s) => {
      document.querySelector(s)?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }, sel)
    await page.waitForTimeout(2200)
    await page.screenshot({ path: `${out}/${vp.name}-${sel.replace('#', '')}.png` })
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/${vp.name}-footer.png` })

  if (errors.length) {
    console.error(`\n${vp.name} console errors:`)
    for (const e of new Set(errors)) console.error('  ' + e)
  } else {
    console.log(`${vp.name}: no console errors`)
  }

  await page.close()
}

await browser.close()
console.log('shots written to', out)
