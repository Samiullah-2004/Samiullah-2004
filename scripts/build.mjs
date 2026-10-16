#!/usr/bin/env node
// Generates every animated SVG in assets/svg from scripts/content.mjs.
//
//   node scripts/build.mjs
//
// No dependencies (Node 18+). Anton, the portfolio's display font, is fetched from Google Fonts,
// subset to the characters each SVG uses and embedded, so headings render the same everywhere.
// Downloads are cached in scripts/.cache; without network the SVGs fall back to system fonts.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as content from './content.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'assets/svg')
const CACHE = path.join(ROOT, 'scripts/.cache')
const LUCIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/lucide.json'), 'utf8'))

// ─── Theme (same tokens as the portfolio) ──────────────────────────────────
const C = {
  neon: '#2ef06a',
  neonDark: '#12a148', // neon for light backgrounds
  ink: '#0a0a0b',
  surface: '#141416',
  white: '#ededed',
  muted: '#9a9a9a',
  soft: '#cfcfcf',
}
const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`
const DISPLAY = `'Anton', Impact, 'Arial Narrow Bold', sans-serif`
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const r2 = (n) => Math.round(n * 100) / 100
const s2 = (n) => `${r2(n)}s`

// ─── Fonts ─────────────────────────────────────────────────────────────────
const UA_WOFF2 =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function cached(key, fetcher) {
  const file = path.join(CACHE, key)
  if (fs.existsSync(file)) return fs.readFileSync(file)
  try {
    const buf = await fetcher()
    fs.mkdirSync(CACHE, { recursive: true })
    fs.writeFileSync(file, buf)
    return buf
  } catch (err) {
    console.warn(`  ! ${key}: ${err.message} (using fallback fonts)`)
    return null
  }
}

async function fetchFontFile(cssUrl, userAgent) {
  const css = await (await fetch(cssUrl, { headers: userAgent ? { 'User-Agent': userAgent } : {} })).text()
  const url = css.match(/url\((https:[^)]+)\)/)?.[1]
  if (!url) throw new Error('no font url in Google Fonts response')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// Reads advance widths and cap height from a TrueType file, enough to lay out Anton by hand.
function parseTTF(buf) {
  const u16 = (o) => buf.readUInt16BE(o)
  const i16 = (o) => buf.readInt16BE(o)
  const u32 = (o) => buf.readUInt32BE(o)
  const tables = {}
  for (let i = 0; i < u16(4); i++) {
    const o = 12 + i * 16
    tables[buf.toString('ascii', o, o + 4)] = u32(o + 8)
  }
  const upm = u16(tables.head + 18)
  const numH = u16(tables.hhea + 34)
  const adv = Array.from({ length: numH }, (_, i) => u16(tables.hmtx + i * 4))
  const os2 = tables['OS/2']
  const capHeight = os2 && u16(os2) >= 2 ? i16(os2 + 88) : upm * 0.72

  let sub = 0
  for (let i = 0; i < u16(tables.cmap + 2); i++) {
    const rec = tables.cmap + 4 + i * 8
    const off = tables.cmap + u32(rec + 4)
    if (u16(rec) === 3 && u16(rec + 2) === 1 && u16(off) === 4) sub = off
  }
  const segX2 = u16(sub + 6)
  const endO = sub + 14
  const startO = endO + segX2 + 2
  const deltaO = startO + segX2
  const rangeO = deltaO + segX2
  const glyph = (cp) => {
    for (let i = 0; i < segX2 / 2; i++) {
      if (cp > u16(endO + i * 2)) continue
      const start = u16(startO + i * 2)
      if (cp < start) return 0
      const delta = i16(deltaO + i * 2)
      const ro = u16(rangeO + i * 2)
      if (!ro) return (cp + delta) & 0xffff
      const g = u16(rangeO + i * 2 + ro + (cp - start) * 2)
      return g ? (g + delta) & 0xffff : 0
    }
    return 0
  }
  return { upm, capHeight, advance: (ch) => adv[Math.min(glyph(ch.codePointAt(0)), numH - 1)] }
}

let anton = { upm: 1000, capHeight: 720, advance: () => 470 }

async function loadAntonMetrics() {
  const ttf = await cached('anton.ttf', () => fetchFontFile('https://fonts.googleapis.com/css2?family=Anton'))
  if (ttf) anton = parseTTF(ttf)
}

async function antonFace(text) {
  const chars = [...new Set(text)].filter((c) => c !== '\n').sort().join('')
  if (!chars.trim()) return ''
  const key = `anton-${crypto.createHash('sha1').update(chars).digest('hex').slice(0, 12)}.woff2`
  const buf = await cached(key, () =>
    fetchFontFile(`https://fonts.googleapis.com/css2?family=Anton&text=${encodeURIComponent(chars)}`, UA_WOFF2)
  )
  return buf ? `@font-face{font-family:'Anton';src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}` : ''
}

const antonW = (str, size, track = 0) =>
  [...str].reduce((w, ch) => w + (anton.advance(ch) * size) / anton.upm + track, 0) - (str.length ? track : 0)
const capH = (size) => (anton.capHeight * size) / anton.upm

// Sans text is drawn with the viewer's system font, so widths are estimated from Helvetica metrics
// (a touch wider than Segoe UI / SF, which keeps pills from clipping).
const HELV = {
  400: '278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584',
  700: '278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584',
}
const HELV_W = Object.fromEntries(Object.entries(HELV).map(([k, v]) => [k, v.split(',').map(Number)]))
const EXTRA_W = { '·': 278, '—': 1000, '–': 556, '’': 222, '→': 1000 }
function sansW(str, size, weight = 400, track = 0) {
  const t = Math.min(Math.max((weight - 400) / 300, 0), 1)
  let w = 0
  for (const ch of str) {
    const code = ch.charCodeAt(0)
    const a = code >= 32 && code <= 126 ? HELV_W[400][code - 32] : EXTRA_W[ch] ?? 556
    const b = code >= 32 && code <= 126 ? HELV_W[700][code - 32] : EXTRA_W[ch] ?? 556
    w += ((a + (b - a) * t) * size) / 1000 + track
  }
  return w * 1.02
}

function wrap(text, maxW, size, weight = 400) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && sansW(next, size, weight) > maxW) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

// Wraps styled segments ({ text, strong }) into lines of segments.
function wrapRich(segments, maxW, size) {
  const words = segments.flatMap((seg) =>
    seg.text.split(/(?<=\s)/).filter(Boolean).map((w) => ({ ...seg, text: w }))
  )
  const lines = [[]]
  let width = 0
  for (const w of words) {
    const ww = sansW(w.text, size)
    if (width + sansW(w.text.trimEnd(), size) > maxW && lines.at(-1).length) {
      lines.push([])
      width = 0
    }
    lines.at(-1).push(w)
    width += ww
  }
  return lines.map((ws) => {
    const merged = []
    for (const w of ws) {
      if (merged.length && merged.at(-1).strong === w.strong) merged.at(-1).text += w.text
      else merged.push({ ...w })
    }
    return merged
  })
}

const richTspans = (segs, strongClass) =>
  segs.map((s) => (s.strong ? `<tspan class="${strongClass}">${esc(s.text)}</tspan>` : esc(s.text))).join('')

// ─── Icons ─────────────────────────────────────────────────────────────────
let uid = 0
const nextId = (p = 'i') => `${p}${(uid++).toString(36)}`

function prefixIds(svg, p) {
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  for (const id of ids) {
    const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    svg = svg
      .replace(new RegExp(`(\\sid=")${e}(")`, 'g'), `$1${p}-${id}$2`)
      .replace(new RegExp(`url\\((['"]?)#${e}\\1\\)`, 'g'), `url(#${p}-${id})`)
      .replace(new RegExp(`((?:xlink:)?href=")#${e}(")`, 'g'), `$1#${p}-${id}$2`)
  }
  return svg
}

const iconSources = new Map()
function readIconSource(spec) {
  if (iconSources.has(spec)) return iconSources.get(spec)
  const file = path.join(ROOT, 'Icons', spec)
  let out
  if (file.endsWith('.png')) {
    const png = fs.readFileSync(file)
    const w = png.readUInt32BE(16)
    const h = png.readUInt32BE(20)
    out = {
      viewBox: `0 0 ${w} ${h}`,
      attrs: '',
      inner: `<image width="${w}" height="${h}" href="data:image/png;base64,${png.toString('base64')}"/>`,
    }
  } else {
    let src = fs
      .readFileSync(file, 'utf8')
      .replace(/<\?xml[\s\S]*?\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<title>[\s\S]*?<\/title>/g, '')
      .replace(/<desc>[\s\S]*?<\/desc>/g, '')
    const open = src.match(/<svg\b([^>]*)>/)
    const attr = (name) => open[1].match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
    const viewBox = attr('viewBox') || `0 0 ${parseFloat(attr('width'))} ${parseFloat(attr('height'))}`
    const attrs = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule']
      .filter((a) => attr(a) != null)
      .map((a) => `${a}="${attr(a)}"`)
      .join(' ')
    const inner = src
      .slice(open.index + open[0].length, src.lastIndexOf('</svg>'))
      // the original icons carry their own flip animation; the cards animate them instead
      .replace(/<style>[\s\S]*?<\/style>/g, '')
      .replace(/<defs>\s*<\/defs>/g, '')
      .replace(/\sclass="a-flip"/g, '')
      .replace(/>\s+</g, '><')
      .trim()
    out = { viewBox, attrs, inner }
  }
  iconSources.set(spec, out)
  return out
}

function lucide(name, x, y, size, { stroke = C.neon, width = 1.75 } = {}) {
  const nodes = LUCIDE[name]
  if (!nodes) throw new Error(`unknown lucide icon: ${name}`)
  const body = nodes
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')
  const strokeAttr = stroke ? ` stroke="${stroke}"` : ''
  return `<svg x="${r2(x)}" y="${r2(y)}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"${strokeAttr} stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}

function icon(spec, x, y, size, { mono = false, recolor, color, lucideStroke, lucideWidth } = {}) {
  if (spec.startsWith('lucide:'))
    return lucide(spec.slice(7), x, y, size, { stroke: lucideStroke ?? C.neon, width: lucideWidth ?? 1.6 })
  const src = readIconSource(spec)
  let inner = prefixIds(src.inner, nextId('g'))
  for (const [from, to] of Object.entries(recolor || {})) inner = inner.replaceAll(new RegExp(from, 'gi'), to)
  const svg = `<svg x="${r2(x)}" y="${r2(y)}" width="${size}" height="${size}" viewBox="${src.viewBox}" ${src.attrs} overflow="visible">${inner}</svg>`
  if (color) return `<g color="${color}">${svg}</g>`
  return mono ? `<g filter="url(#mono)">${svg}</g>` : svg
}

const MONO_FILTER = `<filter id="mono" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.93 0 0 0 0 0.93 0 0 0 0 0.93 0 0 0 1 0"/></filter>`

// ─── Shared pieces ─────────────────────────────────────────────────────────
const BASE_CSS = `
.sans{font-family:${SANS}}
.display{font-family:${DISPLAY}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes rise{from{transform:translateY(112%)}to{transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ping{0%{transform:scale(1);opacity:.6}70%,100%{transform:scale(3.4);opacity:0}}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
.fu{animation:fadeUp .9s ${EASE} both}
.fi{animation:fadeIn 1.2s ${EASE} both}
.rv{transform-box:fill-box;animation:rise 1s ${EASE} both}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2s cubic-bezier(0,0,.2,1) infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

function doc({ w, h, title, desc, css = '', defs = '', body, font = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
<defs><style>${font}${BASE_CSS}${css}</style>${defs}</defs>
${body}
</svg>
`
}

// The six-petal spinner from the portfolio's section headings.
function spinner(cx, cy, box, color, duration = 6) {
  const L = box * 0.42
  const w = box * 0.16
  const petals = [0, 60, 120, 180, 240, 300]
    .map(
      (a) =>
        `<rect x="${r2(cx - w / 2)}" y="${r2(cy - L)}" width="${r2(w)}" height="${r2(L)}" rx="${r2(w / 2)}" fill="${color}" opacity="${r2(0.4 + (a / 300) * 0.6)}" transform="rotate(${a} ${r2(cx)} ${r2(cy)})"/>`
    )
    .join('')
  return `<g style="transform-origin:${r2(cx)}px ${r2(cy)}px;animation:spin ${duration}s linear infinite">${petals}</g>`
}

// Anton text with a per-character rise reveal (like the portfolio's SplitText headings).
function revealText(str, { x, y, size, fill, delay = 0, stagger = 0.035, track = 0, cls = '' }) {
  const id = nextId('clip')
  let cx = x
  const chars = []
  for (const ch of str) {
    if (ch !== ' ') {
      chars.push(
        `<text class="display rv ${cls}" x="${r2(cx)}" y="${r2(y)}" font-size="${size}" fill="${fill}" style="animation-delay:${s2(delay + chars.length * stagger)}">${esc(ch)}</text>`
      )
    }
    cx += (anton.advance(ch) * size) / anton.upm + track
  }
  const width = cx - x - track
  return {
    width,
    end: delay + chars.length * stagger,
    defs: `<clipPath id="${id}"><rect x="${r2(x - size * 0.1)}" y="${r2(y - size * 1.05)}" width="${r2(width + size * 0.2)}" height="${r2(size * 1.2)}"/></clipPath>`,
    svg: `<g clip-path="url(#${id})">${chars.join('')}</g>`,
  }
}

// Coin-flip keyframes: scaleX follows cos(θ) while θ eases 0→360°, then the icon rests.
function flipKeyframes(name, fraction) {
  let frames = ''
  for (let k = 0; k <= 24; k++) {
    const t = k / 24
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    frames += `${r2(fraction * 100 * t)}%{transform:scaleX(${r2(Math.cos(2 * Math.PI * e))})}`
  }
  return `@keyframes ${name}{${frames}100%{transform:scaleX(1)}}`
}

function cardFrame(w, h, { radius = 22, grid = true } = {}) {
  return {
    defs: `<clipPath id="card"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>
<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#ffffff" stroke-opacity=".035"/></pattern>
<radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${C.ink}" stop-opacity="0"/><stop offset=".65" stop-color="${C.ink}" stop-opacity=".45"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".9"/></radialGradient>`,
    open: `<g clip-path="url(#card)"><rect width="${w}" height="${h}" fill="${C.ink}"/>${grid ? `<rect width="${w}" height="${h}" fill="url(#grid)"/><rect width="${w}" height="${h}" fill="url(#vignette)"/>` : ''}`,
    close: `</g><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${radius}" fill="none" stroke="#ffffff" stroke-opacity=".09"/>`,
  }
}

const eyebrowCss = (cls, fill, size = 12) =>
  `.${cls}{font:600 ${size}px ${SANS};letter-spacing:.22em;fill:${fill};text-transform:uppercase}`

// ─── Hero ──────────────────────────────────────────────────────────────────
async function buildHero() {
  const { site } = content
  const W = 1200
  const P = 64
  const frame = cardFrame(W, 0) // replaced once the height is known

  const L1 = 'FULL STACK'
  const L2 = 'DEVELOPER'
  const size = 178
  const pillY = 104
  const y1 = pillY + 38 + 40 + capH(size)
  const y2 = y1 + size * 0.9
  const h1 = revealText(L1, { x: P - 5, y: y1, size, fill: C.neon, delay: 0.25, track: -2 })
  const h2 = revealText(L2, { x: P - 5 + size * 0.35, y: y2, size, fill: C.white, delay: 0.55, track: -2 })

  // Intro paragraph + "Now" line (left), stats (right)
  const blockTop = y2 + 56
  const paraLines = wrapRich(site.intro, 560, 18)
  const para = paraLines
    .map(
      (segs, i) =>
        `<text class="sans fu para" x="${P}" y="${r2(blockTop + 18 + i * 29)}" style="animation-delay:${s2(1 + i * 0.07)}">${richTspans(segs, 'strong')}</text>`
    )
    .join('')
  const nowY = blockTop + 18 + paraLines.length * 29 + 26
  const nowText = [
    { text: `${site.now.role} at ` },
    { text: site.now.company, strong: true },
    { text: `, building ${site.now.product}` },
  ]
  const nowLabelW = sansW('NOW', 11, 600, 11 * 0.22)
  const nowTextW = sansW(nowText.map((s) => s.text).join(''), 15)
  const now = `<g class="fu" style="animation-delay:1.35s">
<text class="now-label" x="${P}" y="${r2(nowY)}">NOW</text>
<text class="sans now" x="${r2(P + nowLabelW + 14)}" y="${r2(nowY)}">${richTspans(nowText, 'strong')}</text>
${lucide('arrow-right', P + nowLabelW + 14 + nowTextW + 8, nowY - 12, 15, { stroke: C.muted, width: 2 })}
</g>`

  const statTop = blockTop
  const colW = 140
  const statsX = W - P
  let statsSvg = ''
  let statsDefs = ''
  let statsCss = ''
  site.stats.forEach((s, i) => {
    const right = statsX - (site.stats.length - 1 - i) * colW
    const nSize = 66
    const base = statTop + 6 + capH(nSize)
    const full = s.value + (s.suffix || '')
    let x = right - antonW(full, nSize)
    const delay = 1.05 + i * 0.15
    for (const ch of s.value) {
      const adv = (anton.advance(ch) * nSize) / anton.upm
      const d = Number(ch)
      const lh = nSize * 1.08
      const id = nextId('odo')
      statsDefs += `<clipPath id="${id}"><rect x="${r2(x - 4)}" y="${r2(base - nSize * 0.98)}" width="${r2(adv + 8)}" height="${r2(nSize * 1.18)}"/></clipPath>`
      statsCss += `@keyframes ${id}{from{transform:translateY(${r2((10 + d) * lh)}px)}to{transform:none}}`
      const strip = Array.from({ length: 20 }, (_, k) => k % 10)
        .map((k, idx) => `<text x="${r2(x + adv / 2)}" y="${r2(base + (idx - (10 + d)) * lh)}">${k}</text>`)
        .join('')
      statsSvg += `<g clip-path="url(#${id})"><g class="display stat-num" text-anchor="middle" font-size="${nSize}" style="animation:${id} 2s ${EASE} ${s2(delay)} both">${strip}</g></g>`
      x += adv
    }
    if (s.suffix)
      statsSvg += `<text class="display stat-num fi" x="${r2(x)}" y="${r2(base)}" font-size="${nSize}" style="animation-delay:${s2(delay + 0.6)}">${esc(s.suffix)}</text>`
    s.label.forEach((line, li) => {
      statsSvg += `<text class="sans stat-label fu" x="${r2(right)}" y="${r2(base + 30 + li * 19)}" style="animation-delay:${s2(delay + 0.1)}">${esc(line)}</text>`
    })
  })
  const statsBottom = statTop + 6 + capH(66) + 30 + 19
  const dividerX = statsX - (site.stats.length - 1) * colW - 100
  const divider = `<line class="fi" x1="${r2(dividerX)}" y1="${r2(statTop - 6)}" x2="${r2(dividerX)}" y2="${r2(statsBottom + 8)}" stroke="#ffffff" stroke-opacity=".1" style="animation-delay:1s"/>`

  const H = Math.round(Math.max(nowY, statsBottom) + 58)
  const card = cardFrame(W, H, { radius: 28, grid: false })

  // Tunnel grid (the portfolio's GridScan background, flattened into 2D)
  const vx = W / 2
  const vy = H * 0.46
  const depth = Array.from({ length: 11 }, (_, k) => 1 / (1 + k * 0.55))
  const rectAt = (s) =>
    `<rect x="${r2(vx - vx * s)}" y="${r2(vy - vy * s)}" width="${r2(W * s)}" height="${r2(H * s)}"/>`
  const inner = depth.at(-1)
  const edge = [
    ...Array.from({ length: 13 }, (_, i) => [(i * W) / 12, 0]),
    ...Array.from({ length: 13 }, (_, i) => [(i * W) / 12, H]),
    ...Array.from({ length: 7 }, (_, i) => [0, ((i + 1) * H) / 8]),
    ...Array.from({ length: 7 }, (_, i) => [W, ((i + 1) * H) / 8]),
  ]
  const rays = edge
    .map(
      ([ex, ey]) =>
        `<line x1="${r2(vx + (ex - vx) * inner)}" y1="${r2(vy + (ey - vy) * inner)}" x2="${r2(ex)}" y2="${r2(ey)}"/>`
    )
    .join('')
  const tunnel = `<g mask="url(#tunnelMask)" stroke="#2a2b2f" stroke-width="1" fill="none">${depth.map(rectAt).join('')}${rays}</g>`
  const scan = [0, 2.6]
    .map(
      (d) =>
        `<g class="scan" style="animation-delay:${d}s"><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#a0a0a0" stroke-opacity=".22" stroke-width="6" filter="url(#glow)" vector-effect="non-scaling-stroke"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#a0a0a0" stroke-opacity=".3" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`
    )
    .join('')

  const pillText = site.availability
  const pillW = 36 + sansW(pillText, 14) + 18
  const pill = `<g class="fu" style="animation-delay:.1s">
<rect x="${P}" y="${pillY}" width="${r2(pillW)}" height="38" rx="19" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>
<circle class="ping" cx="${P + 20}" cy="${pillY + 19}" r="4" fill="${C.neon}"/>
<circle cx="${P + 20}" cy="${pillY + 19}" r="4" fill="${C.neon}"/>
<text class="sans pill" x="${P + 36}" y="${pillY + 24}">${esc(pillText)}</text>
</g>`

  const nameText = content.site.name.toUpperCase()
  const top = `<g class="fi" style="animation-delay:.05s">
${spinner(P + 11, 62, 24, C.neon)}
<text class="display" x="${P + 32}" y="70" font-size="22" letter-spacing="1.2" fill="${C.white}">${esc(nameText)}</text>
<text class="top-right" x="${W - P}" y="68" text-anchor="end">${esc(site.location)}</text>
</g>`

  const css = `
${eyebrowCss('top-right', C.muted, 12)}
${eyebrowCss('now-label', C.neon, 11)}
.para{font-size:18px;fill:#b4b4b4}
.strong{fill:${C.white}}
.now{font-size:15px;fill:${C.muted}}
.pill{font-size:14px;fill:${C.soft}}
.stat-num{fill:${C.neon}}
.stat-label{font-size:13.5px;fill:${C.muted};text-anchor:end}
@keyframes scan{0%{transform:scale(.06);opacity:0}12%{opacity:1}80%{opacity:.7}100%{transform:scale(1.08);opacity:0}}
.scan{transform-origin:${r2(vx)}px ${r2(vy)}px;animation:scan 5.2s cubic-bezier(.55,.05,.85,.4) infinite both}
.blob{animation:breathe 6s ease-in-out infinite}
`
  const defs = `${card.defs}${h1.defs}${h2.defs}${statsDefs}
<radialGradient id="tunnelFade" cx="${r2((vx / W) * 100)}%" cy="${r2((vy / H) * 100)}%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></radialGradient>
<mask id="tunnelMask"><rect width="${W}" height="${H}" fill="url(#tunnelFade)"/></mask>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<radialGradient id="neonBlob"><stop offset="0" stop-color="${C.neon}" stop-opacity=".16"/><stop offset="1" stop-color="${C.neon}" stop-opacity="0"/></radialGradient>`

  const body = `${card.open}
<g class="fi">${tunnel}</g>
${scan}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
<circle class="blob" cx="${W - 90}" cy="40" r="300" fill="url(#neonBlob)"/>
${top}
${pill}
${h1.svg}
${h2.svg}
${para}
${now}
${divider}
${statsSvg}
${card.close}`

  const font = await antonFace(L1 + L2 + nameText + '0123456789+')
  return doc({
    w: W,
    h: H,
    title: `${site.name}, Full Stack Developer`,
    desc: `${site.availability}. ${site.intro.map((s) => s.text).join('')} Now: ${site.now.role} at ${site.now.company}, building ${site.now.product}.`,
    css: css + statsCss,
    defs,
    body,
    font,
  })
}

// ─── Section headings (light + dark variants, transparent background) ──────
async function buildHeading(h, theme, skillCount) {
  const dark = theme === 'dark'
  const fg = dark ? C.white : C.ink
  const accent = dark ? C.neon : C.neonDark
  const muted = dark ? C.muted : '#59636e'
  const W = 1000
  const x = 4
  const title = h.title.toUpperCase()
  const size = 64
  const spinBox = 42
  const titleX = x + spinBox + 18
  const base = 54 + spinBox / 2 + capH(size) / 2
  const t = revealText(title, { x: titleX, y: base, size, fill: fg, delay: 0.15, stagger: 0.03 })
  const aside = h.aside?.replace('{skillCount}', skillCount)
  let asideSvg = ''
  let H = Math.round(base + 22)
  if (aside) {
    const maxW = 350
    const lines = wrap(aside, maxW, 15)
    const blockW = Math.max(...lines.map((l) => sansW(l, 15)))
    const besideTitle = titleX + t.width + 48 < W - blockW
    const lx = besideTitle ? W - 4 - blockW : x
    const firstY = besideTitle ? base - (lines.length - 1) * 23 : base + 42
    asideSvg = lines
      .map(
        (l, i) =>
          `<text class="sans aside fu" x="${r2(lx)}" y="${r2(firstY + i * 23)}" style="animation-delay:${s2(0.5 + i * 0.06)}">${esc(l)}</text>`
      )
      .join('')
    if (!besideTitle) H = Math.round(firstY + (lines.length - 1) * 23 + 14)
  }
  const kickerX = x + sansW(h.index, 12, 600, 12 * 0.22) + 12
  const css = `
${eyebrowCss('eb', muted)}
${eyebrowCss('eb-i', accent)}
.aside{font-size:15px;fill:${muted}}
@keyframes grow{from{transform:scaleX(0)}to{transform:none}}
.grow{transform-origin:${r2(kickerX)}px 0;animation:grow .8s ${EASE} .15s both}
`
  const body = `<g class="fi">
<text class="eb-i" x="${x}" y="22">${esc(h.index)}</text>
<line class="grow" x1="${r2(kickerX)}" y1="18" x2="${r2(kickerX + 32)}" y2="18" stroke="${fg}" stroke-opacity=".22"/>
<text class="eb" x="${r2(kickerX + 44)}" y="22">${esc(h.kicker)}</text>
</g>
<g class="fi" style="animation-delay:.1s">${spinner(x + spinBox / 2, 54 + spinBox / 2, spinBox, accent)}</g>
${t.svg}
${asideSvg}`
  return doc({
    w: W,
    h: H,
    title: `${h.index} ${h.kicker}: ${h.title}`,
    desc: aside || h.title,
    css,
    defs: t.defs,
    body,
    font: await antonFace(title),
  })
}

// ─── Stack panels ──────────────────────────────────────────────────────────
async function buildPanel(cat, index, half) {
  const W = half ? 500 : 1000
  const PAD = 26
  const GAP = 12
  const TH = 112
  const HEAD = 76
  const n = cat.items.length
  const rows = Math.ceil(n / (half ? 4 : 8))
  const cols = Math.ceil(n / rows)
  const tw = Math.min((W - PAD * 2 - GAP * (cols - 1)) / cols, 150)
  const H = HEAD + rows * TH + (rows - 1) * GAP + PAD
  const card = cardFrame(W, H, { radius: 22 })

  const CYCLE = 8
  const SWEEP = 2.4
  const START = 1.3
  const BEAM = 170

  const tiles = cat.items
    .map((item, i) => {
      const r = Math.floor(i / cols)
      const c = i % cols
      const inRow = r === rows - 1 ? n - r * cols : cols
      const rowW = inRow * tw + (inRow - 1) * GAP
      const x = (W - rowW) / 2 + c * (tw + GAP)
      const y = HEAD + r * (TH + GAP)
      const cx = x + tw / 2
      const iconSize = 40
      const iy = y + 18
      const flipDelay = START + (SWEEP * (cx + BEAM / 2)) / (W + BEAM)
      const lines = sansW(item.name, 13, 500) > tw - 14 ? wrap(item.name, tw - 14, 13, 500) : [item.name]
      const label = lines
        .map((l, li) => `<text class="sans lb" x="${r2(cx)}" y="${r2(y + (lines.length > 1 ? 82 : 89) + li * 16)}">${esc(l)}</text>`)
        .join('')
      return `<g class="tile" style="animation-delay:${s2(0.12 + i * 0.045)}">
<rect class="tb" x="${r2(x)}" y="${r2(y)}" width="${r2(tw)}" height="${TH}" rx="16" style="animation-delay:${s2(flipDelay)}"/>
<g class="flip" style="transform-origin:${r2(cx)}px ${r2(iy + iconSize / 2)}px;animation-delay:${s2(flipDelay)}">${icon(item.icon, cx - iconSize / 2, iy, iconSize, item)}</g>
${label}
</g>`
    })
    .join('\n')

  const title = cat.label.toUpperCase()
  const idx = String(index).padStart(2, '0')
  const idxW = sansW(idx, 12, 600, 12 * 0.22)
  const css = `
${eyebrowCss('idx', C.neon)}
${eyebrowCss('count', C.muted, 11)}
.lb{font-size:13px;font-weight:500;fill:${C.soft};text-anchor:middle}
.tile{animation:fadeUp .8s ${EASE} both}
.tb{fill:#ffffff;fill-opacity:.025;stroke:#ffffff;stroke-opacity:.08;animation:glow ${CYCLE}s linear infinite both}
.flip{animation:flip ${CYCLE}s linear infinite both}
.beam{animation:beam ${CYCLE}s linear ${START}s infinite both}
${flipKeyframes('flip', 0.09)}
@keyframes glow{0%,18%,100%{stroke:#ffffff;stroke-opacity:.08;fill:#ffffff;fill-opacity:.025}3%{stroke:${C.neon};stroke-opacity:.9;fill:${C.neon};fill-opacity:.07}}
@keyframes beam{0%{transform:translateX(0)}30%,100%{transform:translateX(${W + BEAM}px)}}
`
  const defs = `${card.defs}${MONO_FILTER}
<linearGradient id="beamGrad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${C.neon}" stop-opacity="0"/><stop offset=".5" stop-color="${C.neon}" stop-opacity=".11"/><stop offset="1" stop-color="${C.neon}" stop-opacity="0"/></linearGradient>`
  const body = `${card.open}
<g class="fu" style="animation-delay:.05s">
<text class="idx" x="${PAD}" y="45">${idx}</text>
<line x1="${r2(PAD + idxW + 10)}" y1="41" x2="${r2(PAD + idxW + 34)}" y2="41" stroke="#ffffff" stroke-opacity=".2"/>
<text class="display" x="${r2(PAD + idxW + 46)}" y="50" font-size="28" fill="${C.white}">${esc(title)}</text>
<text class="count" x="${W - PAD}" y="45" text-anchor="end">${n} ${n === 1 ? 'skill' : 'skills'}</text>
</g>
${tiles}
<g class="beam"><rect x="${-BEAM}" y="0" width="${BEAM}" height="${H}" fill="url(#beamGrad)"/><rect x="${-BEAM / 2 - 0.5}" y="0" width="1" height="${H}" fill="${C.neon}" opacity=".28"/></g>
${card.close}`
  return doc({
    w: W,
    h: H,
    title: `${cat.label} skills`,
    desc: cat.items.map((i) => i.name).join(', '),
    css,
    defs,
    body,
    font: await antonFace(title),
  })
}

// ─── Strengths (About) ─────────────────────────────────────────────────────
async function buildStrengths() {
  const W = 1000
  const PAD = 20
  const GAP = 16
  const cw = (W - PAD * 2 - GAP) / 2
  const descLines = content.strengths.map((s) => wrap(s.desc, cw - 48, 14.5))
  const ch = 24 + 44 + 30 + 10 + Math.max(...descLines.map((l) => l.length)) * 22 + 20
  const H = PAD * 2 + ch * 2 + GAP
  const card = cardFrame(W, H, { radius: 26 })
  const CYCLE = 8
  const cards = content.strengths
    .map((s, i) => {
      const x = PAD + (i % 2) * (cw + GAP)
      const y = PAD + Math.floor(i / 2) * (ch + GAP)
      const d = s2(1 + i * 2)
      const desc = descLines[i]
        .map((l, li) => `<text class="sans sd" x="${r2(x + 24)}" y="${r2(y + 24 + 44 + 30 + 28 + li * 22)}">${esc(l)}</text>`)
        .join('')
      return `<g class="fu" style="animation-delay:${s2(0.1 + i * 0.1)}">
<rect class="sc" x="${r2(x)}" y="${r2(y)}" width="${r2(cw)}" height="${r2(ch)}" rx="22" style="animation-delay:${d}"/>
<rect class="st" x="${r2(x + 24)}" y="${r2(y + 24)}" width="44" height="44" rx="14" style="animation-delay:${d}"/>
<g class="si" style="animation-delay:${d}">${lucide(s.icon, x + 24 + 12, y + 24 + 12, 20, { stroke: null, width: 2 })}</g>
<text class="sans stt" x="${r2(x + 24)}" y="${r2(y + 24 + 44 + 32)}">${esc(s.title)}</text>
${desc}
</g>`
    })
    .join('\n')
  const css = `
.stt{font-size:17.5px;font-weight:600;fill:${C.white}}
.sd{font-size:14.5px;fill:${C.muted}}
.sc{fill:#ffffff;fill-opacity:.03;stroke:#ffffff;stroke-opacity:.08;animation:actCard ${CYCLE}s ease-in-out infinite both}
.st{fill:#ffffff;fill-opacity:.06;animation:actTile ${CYCLE}s ease-in-out infinite both}
.si{stroke:${C.white};animation:actIcon ${CYCLE}s ease-in-out infinite both}
@keyframes actCard{0%,32%,100%{stroke:#ffffff;stroke-opacity:.08}6%,26%{stroke:${C.neon};stroke-opacity:.45}}
@keyframes actTile{0%,32%,100%{fill:#ffffff;fill-opacity:.06}6%,26%{fill:${C.neon};fill-opacity:1}}
@keyframes actIcon{0%,32%,100%{stroke:${C.white}}6%,26%{stroke:${C.ink}}}
`
  return doc({
    w: W,
    h: H,
    title: 'What I do best',
    desc: content.strengths.map((s) => `${s.title}: ${s.desc}`).join(' '),
    css,
    defs: card.defs,
    body: `${card.open}${cards}${card.close}`,
  })
}

// ─── Project covers ────────────────────────────────────────────────────────
const skillIndex = new Map(content.skillCategories.flatMap((c) => c.items.map((i) => [i.name, i])))
function tagIcon(tag) {
  const alias = content.tagAliases[tag]
  if (alias?.startsWith('lucide:')) return { icon: alias }
  return skillIndex.get(alias || tag)
}

// Cards are drawn at the size they show on GitHub (720 wide in the two-column grid, 1200 for the
// full-width feature card) and `k` scales the type so labels stay readable once GitHub shrinks them.
async function buildCover(p) {
  const W = p.wide ? 1200 : 720
  const k = p.wide ? 1.3 : 1.45
  const PAD = Math.round(20 * k)
  const BAR = Math.round(40 * k)
  const IMG = Math.round((W * 9) / 16)
  const shot = fs.readFileSync(path.join(ROOT, 'assets/screens', `${p.slug}.webp`)).toString('base64')

  // Footer pills, flowed into rows (two rows are always reserved on grid cards so pairs line up)
  const tagSize = 13 * k
  const pillH = Math.round(30 * k)
  const iconSize = Math.round(16 * k)
  const gap = Math.round(7 * k)
  const rows = [[]]
  let rowW = 0
  for (const tag of p.tags) {
    const ic = tagIcon(tag)
    const w = (ic ? 16 * k + iconSize : 14 * k) + sansW(tag, tagSize) + 13 * k
    if (rowW + w > W - PAD * 2 && rows.at(-1).length) {
      rows.push([])
      rowW = 0
    }
    rows.at(-1).push({ tag, ic, w })
    rowW += w + gap
  }
  const rowCount = p.wide ? rows.length : Math.max(rows.length, 2)
  const FOOT = Math.round(PAD * 1.5 + rowCount * pillH + (rowCount - 1) * gap)
  const H = BAR + IMG + FOOT
  const card = cardFrame(W, H, { radius: Math.round(16 * k), grid: false })

  // Browser bar
  const urlSize = 12 * k
  const urlH = Math.round(24 * k)
  const urlW = Math.min(sansW(p.url, urlSize) + 34 * k, W * 0.56)
  const live = p.status.includes('LIVE')
  const stSize = 10.5 * k
  const stH = Math.round(22 * k)
  const statusW = sansW(p.status, stSize, 600, stSize * 0.18) + (live ? 30 : 20) * k
  const sx = W - PAD * 0.8 - statusW
  const dotR = 5 * k
  const bar = `<rect width="${W}" height="${BAR}" fill="${C.surface}"/>
<line x1="0" y1="${BAR - 0.5}" x2="${W}" y2="${BAR - 0.5}" stroke="#ffffff" stroke-opacity=".07"/>
${[0, 1, 2].map((i) => `<circle cx="${r2(PAD + i * dotR * 3.4)}" cy="${BAR / 2}" r="${r2(dotR)}" fill="#ffffff" fill-opacity="${i === 0 ? 0.22 : 0.13}"/>`).join('')}
<rect x="${r2((W - urlW) / 2)}" y="${r2(BAR / 2 - urlH / 2)}" width="${r2(urlW)}" height="${urlH}" rx="${urlH / 2}" fill="#ffffff" fill-opacity=".05" stroke="#ffffff" stroke-opacity=".06"/>
<text class="sans url" x="${W / 2}" y="${r2(BAR / 2 + urlSize * 0.36)}" text-anchor="middle">${esc(p.url)}</text>
<rect x="${r2(sx)}" y="${r2(BAR / 2 - stH / 2)}" width="${r2(statusW)}" height="${stH}" rx="${stH / 2}" fill="${live ? C.neon : '#ffffff'}" fill-opacity="${live ? 0.1 : 0.05}" stroke="${live ? C.neon : '#ffffff'}" stroke-opacity="${live ? 0.35 : 0.12}"/>
${live ? `<circle class="ping" cx="${r2(sx + 13 * k)}" cy="${BAR / 2}" r="${r2(3.2 * k)}" fill="${C.neon}"/><circle cx="${r2(sx + 13 * k)}" cy="${BAR / 2}" r="${r2(3.2 * k)}" fill="${C.neon}"/>` : ''}
<text class="status" x="${r2(sx + (live ? 23 : 10) * k)}" y="${r2(BAR / 2 + stSize * 0.36)}" fill="${live ? C.neon : C.muted}">${esc(p.status)}</text>`

  // Screenshot with the title overlaid on a bottom shade
  const subSize = 15 * k
  const titleSize = Math.round((p.wide ? 62 : 46) * k)
  const ebSize = 11 * k
  const subY = BAR + IMG - PAD
  const tBase = subY - subSize * 1.55
  const t = revealText(p.title.toUpperCase(), { x: PAD - 2, y: tBase, size: titleSize, fill: C.white, delay: 0.45, stagger: 0.035 })
  let stats = ''
  if (p.stats) {
    const vSize = 34 * k
    const lSize = 12 * k
    let right = W - PAD
    ;[...p.stats].reverse().forEach((s, ri) => {
      const i = p.stats.length - 1 - ri
      stats += `<g class="fu" style="animation-delay:${s2(0.9 + i * 0.1)}">
<text class="display" x="${r2(right)}" y="${r2(subY - lSize * 1.6)}" font-size="${r2(vSize)}" fill="${C.neon}" text-anchor="end">${esc(s.value)}</text>
<text class="sans stat" x="${r2(right)}" y="${r2(subY)}" text-anchor="end">${esc(s.label)}</text>
</g>`
      right -= Math.max(antonW(s.value, vSize), sansW(s.label, lSize)) + 40 * k
    })
  }
  const overlay = `<g clip-path="url(#shotClip)">
<image class="shot" x="0" y="${BAR}" width="${W}" height="${IMG}" preserveAspectRatio="xMidYMid slice" href="data:image/webp;base64,${shot}"/>
<rect x="0" y="${BAR}" width="${W}" height="${IMG}" fill="url(#shade)"/>
<g class="sheen"><rect x="-260" y="${BAR - 40}" width="190" height="${IMG + 80}" fill="url(#sheenGrad)"/></g>
</g>
<text class="eyebrow fu" x="${PAD}" y="${r2(tBase - capH(titleSize) - ebSize * 1.4)}" style="animation-delay:.35s">${esc(p.eyebrow)}</text>
${t.svg}
<text class="sans sub fu" x="${PAD}" y="${r2(subY)}" style="animation-delay:.8s">${esc(p.subtitle)}</text>
${stats}`

  const pills = []
  let n = 0
  rows.forEach((row, ri) => {
    let px = PAD
    const py = BAR + IMG + PAD * 0.75 + ri * (pillH + gap)
    for (const { tag, ic, w } of row) {
      pills.push(`<g class="fu" style="animation-delay:${s2(0.6 + n++ * 0.06)}">
<rect x="${r2(px)}" y="${r2(py)}" width="${r2(w)}" height="${pillH}" rx="${pillH / 2}" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>
${ic ? icon(ic.icon, px + 10 * k, py + (pillH - iconSize) / 2, iconSize, { ...ic, lucideWidth: 2 }) : ''}
<text class="sans tag" x="${r2(px + (ic ? 16 * k + iconSize : 14 * k))}" y="${r2(py + pillH / 2 + tagSize * 0.36)}">${esc(tag)}</text>
</g>`)
      px += w + gap
    }
  })

  const css = `
.url{font-size:${r2(urlSize)}px;fill:${C.muted}}
.status{font:600 ${r2(stSize)}px ${SANS};letter-spacing:.18em}
${eyebrowCss('eyebrow', C.neon, r2(ebSize))}
.sub{font-size:${r2(subSize)}px;fill:${C.soft}}
.stat{font-size:${r2(12 * k)}px;fill:${C.soft}}
.tag{font-size:${r2(tagSize)}px;fill:${C.soft}}
@keyframes settle{from{transform:scale(1.06);opacity:0}to{transform:none;opacity:1}}
.shot{transform-origin:${W / 2}px ${BAR + IMG / 2}px;animation:settle 1.6s ${EASE} both}
@keyframes sheen{0%{transform:translateX(0) skewX(-18deg)}28%,100%{transform:translateX(${W + 520}px) skewX(-18deg)}}
.sheen{animation:sheen 7s cubic-bezier(.45,0,.25,1) 1.4s infinite both}
`
  const defs = `${card.defs}${MONO_FILTER}${t.defs}
<clipPath id="shotClip"><rect x="0" y="${BAR}" width="${W}" height="${IMG}"/></clipPath>
<linearGradient id="shade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.ink}" stop-opacity="0"/><stop offset=".4" stop-color="${C.ink}" stop-opacity=".05"/><stop offset=".74" stop-color="${C.ink}" stop-opacity=".8"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".97"/></linearGradient>
<linearGradient id="sheenGrad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  const body = `${card.open}
${bar}
${overlay}
<rect x="0" y="${BAR + IMG}" width="${W}" height="${FOOT}" fill="#0e0e0f"/>
<line x1="0" y1="${BAR + IMG + 0.5}" x2="${W}" y2="${BAR + IMG + 0.5}" stroke="#ffffff" stroke-opacity=".07"/>
${pills.join('\n')}
${card.close}`
  return doc({
    w: W,
    h: H,
    title: `${p.title}: ${p.subtitle}`,
    desc: `${p.eyebrow}. Built with ${p.tags.join(', ')}.`,
    css,
    defs,
    body,
    font: await antonFace(p.title.toUpperCase() + (p.stats ? p.stats.map((s) => s.value).join('') : '')),
  })
}

// ─── Contact ───────────────────────────────────────────────────────────────
async function buildContact() {
  const { contact, site } = content
  const W = 1000
  const P = 52
  const size = 104
  const y1 = 72 + 30 + capH(size)
  const lineYs = contact.lines.map((_, i) => y1 + i * size * 0.92)
  let delay = 0.2
  const lines = []
  const lineDefs = []
  let antonText = ''
  contact.lines.forEach((segs, li) => {
    let x = P - 3
    for (const seg of segs) {
      const text = seg.text.toUpperCase()
      antonText += text
      const r = revealText(text, { x, y: lineYs[li], size, fill: seg.neon ? C.neon : C.white, delay, stagger: 0.03, track: -1 })
      lines.push(r.svg)
      lineDefs.push(r.defs)
      x += r.width // the segment text carries its own trailing space
      delay = r.end + 0.02
    }
  })
  const emailSize = 40
  const emailY = lineYs.at(-1) + 84
  const emailW = antonW(site.email, emailSize)
  antonText += site.email
  const ruleY = emailY + 50
  const noteLines = wrap(contact.note, 400, 15.5)
  const factX = [P + 520, P + 720]
  const H = Math.round(ruleY + 40 + Math.max(noteLines.length * 24, 50) + 44)
  const card = cardFrame(W, H, { radius: 28 })
  const css = `
${eyebrowCss('eb', C.muted)}
.mail{fill:${C.soft}}
.note{font-size:15.5px;fill:${C.muted}}
.fact{font-size:15px;fill:${C.soft}}
@keyframes underline{from{transform:scaleX(0)}to{transform:none}}
.ul{transform-origin:${P}px 0;animation:underline 1.2s ${EASE} 1.3s both}
@keyframes nudge{0%,70%,100%{transform:none}80%{transform:translate(4px,-4px)}}
.nudge{animation:nudge 3.2s ease-in-out 2s infinite}
.blob{animation:breathe 7s ease-in-out infinite}
`
  const body = `${card.open}
<circle class="blob" cx="${W - 60}" cy="${H - 20}" r="320" fill="url(#neonBlob)"/>
<g class="fi">
<circle class="ping" cx="${P + 4}" cy="66" r="4" fill="${C.neon}"/><circle cx="${P + 4}" cy="66" r="4" fill="${C.neon}"/>
<text class="eb" x="${P + 20}" y="70">${esc(contact.eyebrow)}</text>
</g>
${lines.join('\n')}
<g class="fu" style="animation-delay:1.1s">
<text class="display mail" x="${P}" y="${r2(emailY)}" font-size="${emailSize}">${esc(site.email)}</text>
<g class="nudge">${lucide('arrow-up-right', P + emailW + 10, emailY - 32, 34, { stroke: C.neon, width: 2 })}</g>
</g>
<rect class="ul" x="${P}" y="${r2(emailY + 12)}" width="${r2(emailW)}" height="2" fill="${C.neon}"/>
<line x1="${P}" y1="${r2(ruleY)}" x2="${W - P}" y2="${r2(ruleY)}" stroke="#ffffff" stroke-opacity=".1"/>
<g class="fu" style="animation-delay:1.4s">
${noteLines.map((l, i) => `<text class="sans note" x="${P}" y="${r2(ruleY + 40 + i * 24)}">${esc(l)}</text>`).join('')}
${contact.facts
  .map(
    (f, i) =>
      `<text class="eb" x="${factX[i]}" y="${r2(ruleY + 36)}">${esc(f.label)}</text><text class="sans fact" x="${factX[i]}" y="${r2(ruleY + 64)}">${esc(f.value)}</text>`
  )
  .join('')}
</g>
${card.close}`
  return doc({
    w: W,
    h: H,
    title: "Let's build something great",
    desc: `${contact.note} Email: ${site.email}`,
    css,
    defs: `${card.defs}${lineDefs.join('')}<radialGradient id="neonBlob"><stop offset="0" stop-color="${C.neon}" stop-opacity=".14"/><stop offset="1" stop-color="${C.neon}" stop-opacity="0"/></radialGradient>`,
    body,
    font: await antonFace(antonText),
  })
}

// ─── Buttons ───────────────────────────────────────────────────────────────
function buildButton(b, i) {
  const H = 48
  const textW = sansW(b.label, 15, 600)
  const arrow = !b.primary
  const W = Math.round(22 + 18 + 10 + textW + (arrow ? 8 + 14 : 0) + 22)
  const fg = b.primary ? C.ink : C.white
  const iconSvg = b.icon.startsWith('lucide:')
    ? lucide(b.icon.slice(7), 22, 15, 18, { stroke: fg, width: 2 })
    : icon(b.icon, 22, 15, 18, { color: fg })
  const css = `
.label{font:600 15px ${SANS};fill:${fg}}
@keyframes shine{0%{transform:translateX(0) skewX(-20deg)}35%,100%{transform:translateX(${W + 140}px) skewX(-20deg)}}
.shine{animation:shine 4s cubic-bezier(.45,0,.25,1) ${s2(1 + i * 0.4)} infinite both}
@keyframes edge{0%,100%{stroke:#ffffff;stroke-opacity:.16}50%{stroke:${C.neon};stroke-opacity:.55}}
.edge{animation:edge 4s ease-in-out ${s2(i * 0.6)} infinite}
@keyframes nudge{0%,70%,100%{transform:none}80%{transform:translate(2px,-2px)}}
.nudge{animation:nudge 3s ease-in-out ${s2(1.5 + i * 0.3)} infinite}
`
  const shape = b.primary
    ? `<rect width="${W}" height="${H}" rx="${H / 2}" fill="${C.neon}"/>
<g clip-path="url(#pill)"><g class="shine"><rect x="-90" y="-10" width="60" height="${H + 20}" fill="url(#shineGrad)"/></g></g>`
    : `<rect class="edge" x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${(H - 1.5) / 2}" fill="${C.surface}" stroke="#ffffff" stroke-opacity=".16" stroke-width="1.5"/>`
  const body = `${shape}
${iconSvg}
<text class="label" x="50" y="${H / 2 + 5.5}">${esc(b.label)}</text>
${arrow ? `<g class="nudge">${lucide('arrow-up-right', 50 + textW + 8, H / 2 - 7, 14, { stroke: C.muted, width: 2 })}</g>` : ''}`
  return doc({
    w: W,
    h: H,
    title: b.label,
    desc: b.label,
    css,
    defs: `<clipPath id="pill"><rect width="${W}" height="${H}" rx="${H / 2}"/></clipPath><linearGradient id="shineGrad" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    body,
  })
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  await loadAntonMetrics()
  fs.rmSync(OUT, { recursive: true, force: true })
  for (const dir of ['', 'headings', 'stack', 'projects', 'buttons']) fs.mkdirSync(path.join(OUT, dir), { recursive: true })

  const written = []
  const write = (rel, svg) => {
    fs.writeFileSync(path.join(OUT, rel), svg)
    written.push([rel, Buffer.byteLength(svg)])
  }

  const skillCount = content.skillCategories.reduce((n, c) => n + c.items.length, 0)
  write('hero.svg', await buildHero())
  for (const h of content.headings) {
    write(`headings/${h.slug}-dark.svg`, await buildHeading(h, 'dark', skillCount))
    write(`headings/${h.slug}-light.svg`, await buildHeading(h, 'light', skillCount))
  }
  write('strengths.svg', await buildStrengths())

  const byLabel = new Map(content.skillCategories.map((c) => [c.label, c]))
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let index = 1
  for (const row of content.stackLayout) {
    for (const label of row) {
      const cat = byLabel.get(label)
      if (!cat) throw new Error(`stackLayout: unknown category "${label}"`)
      write(`stack/${slug(label)}.svg`, await buildPanel(cat, index++, row.length > 1))
    }
  }
  const placed = content.stackLayout.flat()
  for (const c of content.skillCategories) if (!placed.includes(c.label)) console.warn(`  ! "${c.label}" is not in stackLayout`)

  for (const p of content.projects) write(`projects/${p.slug}.svg`, await buildCover(p))
  write('contact.svg', await buildContact())
  content.buttons.forEach((b, i) => write(`buttons/${b.slug}.svg`, buildButton(b, i)))

  const total = written.reduce((n, [, b]) => n + b, 0)
  for (const [rel, bytes] of written) console.log(`  ${rel.padEnd(34)} ${(bytes / 1024).toFixed(1).padStart(6)} KB`)
  console.log(`\n  ${written.length} SVGs, ${(total / 1024).toFixed(0)} KB, ${skillCount} skills`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
