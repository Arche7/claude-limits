// Пиксельный персонаж «Токи», темы и карточка лимитов — чистые функции, возвращают SVG-строки.

export type Mood = 'happy' | 'ok' | 'worried' | 'tired'
export type SkinId =
  | 'classic' | 'spider' | 'pumpkin' | 'ghost' | 'crown' | 'beanie' | 'headphones' | 'nightcap'
export type ThemeId = 'classic' | 'halloween' | 'space' | 'ocean' | 'midnight' | 'forest' | 'oled'

export const SKINS: { id: SkinId; name: string }[] = [
  { id: 'classic', name: 'Классика' },
  { id: 'spider', name: 'Паучок' },
  { id: 'pumpkin', name: 'Тыква' },
  { id: 'ghost', name: 'Призрак' },
  { id: 'crown', name: 'Корона' },
  { id: 'beanie', name: 'Шапка' },
  { id: 'headphones', name: 'Наушники' },
  { id: 'nightcap', name: 'Колпак' },
]

export const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'classic', name: 'Классика' },
  { id: 'halloween', name: 'Хэллоуин' },
  { id: 'space', name: 'Космос' },
  { id: 'ocean', name: 'Океан' },
  { id: 'midnight', name: 'Полночь' },
  { id: 'forest', name: 'Лес' },
  { id: 'oled', name: 'OLED' },
]

export const tone = (p: number) => (p >= 85 ? '#ef5b5b' : p >= 60 ? '#f0b13d' : '#3ddc84')

export function moodFor(maxPercent: number): Mood {
  if (maxPercent >= 90) return 'tired'
  if (maxPercent >= 70) return 'worried'
  if (maxPercent >= 35) return 'ok'
  return 'happy'
}

/* ───────────── Персонаж ───────────── */

type Px = [number, number, string]

// 16×13. B — тело, S — нижняя тень, H — ручки, F — ножки, C — румянец
const BODY = [
  '................',
  '................',
  '................',
  '.....BBBBBB.....',
  '...BBBBBBBBBB...',
  '..BBBBBBBBBBBB..',
  '..BBBBBBBBBBBB..',
  '.HBBBBBBBBBBBBH.',
  '.HBCBBBBBBBBCBH.',
  '..BBBBBBBBBBBB..',
  '..SSSSSSSSSSSS..',
  '...SSSSSSSSSS...',
  '....FF....FF....',
]

type Skin = {
  B: string; S: string; H: string | null; F: string | null; C: string | null
  eye: string; mouth: string
  antenna: boolean
  extra: (accent: string) => Px[]
  bottom?: string[] // замена двух нижних строк (для призрака)
  forceTired?: boolean
}

const mirror = (pts: [number, number][], c: string): Px[] =>
  pts.flatMap(([x, y]) => [[x, y, c], [15 - x, y, c]] as Px[])

const SKIN: Record<SkinId, Skin> = {
  classic: {
    B: '#7fd6c2', S: '#5fb8a5', H: '#7fd6c2', F: '#4a9585', C: '#f3a5b5',
    eye: '#203a35', mouth: '#203a35', antenna: true, extra: () => [],
  },
  spider: {
    B: '#3b3752', S: '#2a273c', H: null, F: '#2a273c', C: null,
    eye: '#b98bff', mouth: '#e9e6f5', antenna: false,
    extra: accent => [
      // паутинка сверху
      [8, 0, '#d9d6ea'], [8, 1, '#d9d6ea'], [8, 2, '#d9d6ea'],
      // ещё два маленьких глаза — светятся цветом лимита
      [6, 5, accent], [9, 5, accent],
      // восемь лапок
      ...mirror([[1, 5], [0, 4], [1, 7], [0, 6], [1, 9], [0, 10], [2, 11], [1, 12]], '#625b86'),
    ],
  },
  pumpkin: {
    B: '#f08a2c', S: '#cc6a1c', H: '#f08a2c', F: '#a8531a', C: '#ffb36b',
    eye: '#4a2208', mouth: '#4a2208', antenna: false,
    extra: () => [
      [7, 1, '#4f8a3a'], [8, 1, '#4f8a3a'], [8, 2, '#4f8a3a'], [9, 1, '#6db152'], [10, 1, '#6db152'],
      // рёбра тыквы
      [5, 4, '#dd7724'], [5, 5, '#dd7724'], [10, 4, '#dd7724'], [10, 5, '#dd7724'],
      [5, 9, '#dd7724'], [10, 9, '#dd7724'],
    ],
  },
  ghost: {
    B: '#eef0ff', S: '#d6d9f0', H: '#eef0ff', F: null, C: '#ffc4d6',
    eye: '#3a3a5c', mouth: '#3a3a5c', antenna: false, extra: () => [],
    bottom: ['..SSSSSSSSSSSS..', '..S.SS.SS.SS.S..', '................'],
  },
  crown: {
    B: '#7fd6c2', S: '#5fb8a5', H: '#7fd6c2', F: '#4a9585', C: '#f3a5b5',
    eye: '#203a35', mouth: '#203a35', antenna: false,
    extra: () => [
      [5, 1, '#f7c948'], [7, 1, '#f7c948'], [8, 1, '#f7c948'], [10, 1, '#f7c948'],
      [5, 2, '#f7c948'], [6, 2, '#f7c948'], [7, 2, '#e5484d'], [8, 2, '#e5484d'], [9, 2, '#f7c948'], [10, 2, '#f7c948'],
    ],
  },
  beanie: {
    B: '#7fd6c2', S: '#5fb8a5', H: '#7fd6c2', F: '#4a9585', C: '#f3a5b5',
    eye: '#203a35', mouth: '#203a35', antenna: false,
    extra: () => [
      [7, 0, '#ffffff'], [8, 0, '#ffffff'],
      ...[5, 6, 7, 8, 9, 10].map(x => [x, 1, '#5b8def'] as Px),
      ...[4, 5, 6, 7, 8, 9, 10, 11].map(x => [x, 2, '#5b8def'] as Px),
      ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(x => [x, 3, '#4a78d4'] as Px),
      ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(x => [x, 4, '#f2f4f8'] as Px),
    ],
  },
  headphones: {
    B: '#7fd6c2', S: '#5fb8a5', H: '#7fd6c2', F: '#4a9585', C: '#f3a5b5',
    eye: '#203a35', mouth: '#203a35', antenna: false,
    extra: accent => [
      ...[5, 6, 7, 8, 9, 10].map(x => [x, 1, '#3a3d4a'] as Px),
      [4, 2, '#3a3d4a'], [11, 2, '#3a3d4a'], [3, 3, '#3a3d4a'], [12, 3, '#3a3d4a'],
      ...mirror([[1, 5], [1, 6], [2, 4]], '#3a3d4a'),
      ...mirror([[0, 5], [0, 6]], accent),
    ],
  },
  nightcap: {
    B: '#7fd6c2', S: '#5fb8a5', H: '#7fd6c2', F: '#4a9585', C: '#f3a5b5',
    eye: '#203a35', mouth: '#203a35', antenna: false, forceTired: true,
    extra: () => [
      [13, 0, '#ffffff'], [12, 1, '#6f6ad8'], [11, 1, '#6f6ad8'],
      ...[8, 9, 10, 11].map(x => [x, 2, '#6f6ad8'] as Px),
      ...[4, 5, 6, 7, 8, 9, 10, 11].map(x => [x, 3, '#5a55c4'] as Px),
      ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(x => [x, 4, '#f2f4f8'] as Px),
    ],
  },
}

function faceFor(mood: Mood, eye: string, mouth: string): Px[] {
  const W = '#ffffff'
  const eyes: Px[] =
    mood === 'tired'
      ? [[4, 7, eye], [5, 7, eye], [10, 7, eye], [11, 7, eye]]
      : [
          [4, 6, W], [5, 6, eye], [4, 7, eye], [5, 7, eye],
          [10, 6, W], [11, 6, eye], [10, 7, eye], [11, 7, eye],
        ]
  const mouths: Record<Mood, [number, number][]> = {
    happy: [[6, 8], [9, 8], [7, 9], [8, 9]],
    ok: [[7, 9], [8, 9]],
    worried: [[7, 8], [8, 8], [6, 9], [9, 9]],
    tired: [[7, 9], [8, 9]],
  }
  const extra: Px[] = mood === 'worried' ? [[13, 5, '#8fd3ff'], [13, 6, '#8fd3ff']] : []
  return [...eyes, ...mouths[mood].map(([x, y]) => [x, y, mouth] as Px), ...extra]
}

/** Пиксели персонажа (сетка 16×13). */
export function mascotPixels(skinId: SkinId, mood: Mood, accent: string): Px[] {
  const s = SKIN[skinId]
  const m: Mood = s.forceTired ? 'tired' : mood
  const rows = s.bottom ? [...BODY.slice(0, 10), ...s.bottom] : BODY
  const px: Px[] = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      const c = ch === 'B' ? s.B : ch === 'S' ? s.S : ch === 'H' ? s.H : ch === 'F' ? s.F : ch === 'C' ? s.C : null
      if (c) px.push([x, y, c])
    }
  })
  if (s.antenna) px.push([8, 2, '#4a9585'], [7, 1, accent], [8, 1, accent], [7, 0, accent], [8, 0, accent])
  return [...px, ...s.extra(accent), ...faceFor(m, s.eye, s.mouth)]
}

/** Группа <g> с персонажем; pixel — размер одного «пикселя». */
export function mascotGroup(skinId: SkinId, mood: Mood, accent: string, pixel: number, x: number, y: number, animate: boolean): string {
  const rects = mascotPixels(skinId, mood, accent)
    .map(([px, py, c]) => `<rect x="${px * pixel}" y="${py * pixel}" width="${pixel + 0.02}" height="${pixel + 0.02}" fill="${c}"/>`)
    .join('')
  const isSpider = skinId === 'spider'
  const bob = animate
    ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${isSpider ? -2 * pixel : -pixel};0 0" dur="${isSpider ? 2.6 : 1.8}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`
    : ''
  return `<g transform="translate(${x} ${y})" shape-rendering="crispEdges"><g>${bob}${rects}</g></g>`
}

/** Маленькая иконка персонажа для полоски над вводом. */
export function mascotIcon(skinId: SkinId, mood: Mood, accent: string): string {
  const p = 1.5
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${16 * p}" height="${13 * p}" viewBox="0 0 ${16 * p} ${13 * p}">${mascotGroup(skinId, mood, accent, p, 0, 0, false)}</svg>`
}

/* ───────────── Темы ───────────── */

type Theme = { bg: [string, string]; text: string; muted: string; track: string; accent: string; deco: (w: number, h: number) => string }

function rand(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function stars(w: number, h: number, n: number, seed: number, color = '#ffffff'): string {
  const r = rand(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = (r() * w).toFixed(1), y = (r() * h).toFixed(1), o = (0.25 + r() * 0.55).toFixed(2)
    const sz = r() > 0.85 ? 1.6 : 1
    const tw = i % 4 === 0 ? `<animate attributeName="opacity" values="${o};0.05;${o}" dur="${(2 + r() * 3).toFixed(1)}s" repeatCount="indefinite"/>` : ''
    out += `<rect x="${x}" y="${y}" width="${sz}" height="${sz}" fill="${color}" opacity="${o}">${tw}</rect>`
  }
  return out
}

const bat = (x: number, y: number, dur: number, dx: number) =>
  `<g opacity="0.55"><path d="M0 2 L2 0 L3 2 L4 1 L5 2 L6 1 L7 2 L8 0 L10 2 L7 3 L5 4 L3 3 Z" fill="#6b4a7a" transform="translate(${x} ${y})">` +
  `<animateTransform attributeName="transform" type="translate" values="${x} ${y};${x + dx} ${y - 6};${x} ${y}" dur="${dur}s" repeatCount="indefinite"/></path></g>`

const THEME: Record<ThemeId, Theme> = {
  classic: {
    bg: ['#262624', '#1f1e1d'], text: '#ece9e1', muted: '#9a968c', track: 'rgba(255,255,255,0.09)', accent: '#7aa7ff',
    deco: (w, h) => stars(w, h, 14, 3, '#ffffff'),
  },
  halloween: {
    bg: ['#2a1a2e', '#1a1020'], text: '#f3e9f5', muted: '#b39bb8', track: 'rgba(255,255,255,0.09)', accent: '#ff8a2a',
    deco: (w, h) =>
      // паутина в углу
      `<g stroke="rgba(255,255,255,0.13)" stroke-width="0.8" fill="none">` +
      `<path d="M0 0 L46 0 M0 0 L0 46 M0 0 L40 22 M0 0 L22 40"/>` +
      `<path d="M14 0 Q12 7 0 14 M28 0 Q25 14 0 28 M42 0 Q38 21 0 42"/></g>` +
      stars(w, h, 8, 11, '#ffd9a8') + bat(w * 0.42, 14, 5, 10) + bat(w * 0.58, 28, 6.5, -8),
  },
  space: {
    bg: ['#1c1238', '#0d0920'], text: '#efeaff', muted: '#a89cd1', track: 'rgba(255,255,255,0.10)', accent: '#a78bfa',
    deco: (w, h) =>
      stars(w, h, 34, 7) +
      `<g opacity="0.55" transform="translate(${w * 0.52} 26)"><circle r="7" fill="#e879f9"/><ellipse rx="13" ry="3.2" fill="none" stroke="#c4b5fd" stroke-width="1.2" transform="rotate(-18)"/></g>` +
      `<circle cx="${w * 0.3}" cy="${h * 0.75}" r="60" fill="#7c3aed" opacity="0.10"/>`,
  },
  ocean: {
    bg: ['#11344a', '#0a1f2e'], text: '#e6f6ff', muted: '#8fb7cc', track: 'rgba(255,255,255,0.10)', accent: '#38bdf8',
    deco: (w, h) => {
      const r = rand(5)
      let b = ''
      for (let i = 0; i < 9; i++) {
        const x = (r() * w).toFixed(1), rad = (1 + r() * 2.2).toFixed(1), d = (5 + r() * 6).toFixed(1), del = (r() * 5).toFixed(1)
        b += `<circle cx="${x}" cy="${h + 6}" r="${rad}" fill="none" stroke="rgba(190,235,255,0.45)" stroke-width="0.8"><animate attributeName="cy" from="${h + 6}" to="-6" dur="${d}s" begin="-${del}s" repeatCount="indefinite"/></circle>`
      }
      return `<path d="M0 ${h * 0.35} Q${w * 0.3} ${h * 0.25} ${w * 0.6} ${h * 0.4} T${w} ${h * 0.3} L${w} 0 L0 0Z" fill="rgba(255,255,255,0.03)"/>` + b
    },
  },
  midnight: {
    bg: ['#162447', '#0e1730'], text: '#e8eeff', muted: '#93a3c9', track: 'rgba(255,255,255,0.09)', accent: '#60a5fa',
    deco: (w, h) =>
      stars(w, h, 18, 13) +
      `<g opacity="0.7" transform="translate(${w * 0.46} 22)"><circle r="6" fill="#e6ecff"/><circle cx="2.6" cy="-1.6" r="5.4" fill="#162447"/></g>`,
  },
  forest: {
    bg: ['#1b2a1f', '#111b14'], text: '#eaf5ec', muted: '#93b19a', track: 'rgba(255,255,255,0.09)', accent: '#5eead4',
    deco: (w, h) => {
      const r = rand(17)
      let f = ''
      for (let i = 0; i < 8; i++) {
        const x = (r() * w).toFixed(1), y = (r() * h * 0.8).toFixed(1), d = (1.8 + r() * 2.5).toFixed(1)
        f += `<circle cx="${x}" cy="${y}" r="1.3" fill="#d9f99d"><animate attributeName="opacity" values="0;0.9;0" dur="${d}s" begin="-${(r() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`
      }
      let pines = ''
      for (let i = 0; i < 7; i++) {
        const x = i * (w / 6) - 6, ph = 22 + (i % 3) * 8
        pines += `<path d="M${x} ${h} L${x + 9} ${h - ph} L${x + 18} ${h}Z" fill="rgba(0,0,0,0.22)"/>`
      }
      return pines + f
    },
  },
  oled: {
    bg: ['#000000', '#000000'], text: '#f2f2f2', muted: '#8a8a8a', track: 'rgba(255,255,255,0.10)', accent: '#7aa7ff',
    deco: (w, h) => stars(w, h, 10, 23, '#ffffff'),
  },
}

/* ───────────── Карточка ───────────── */

export type CardRow = { label: string; percent: number; right: string }
export type CardModel = {
  title: string
  big: { label: string; percent: number; sub: string }
  rows: CardRow[]
  footer: string
  theme: ThemeId
  skin: SkinId
  mood: Mood
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function cardSvg(m: CardModel, width = 320): string {
  const t = THEME[m.theme]
  const pad = 18
  const inner = width - pad * 2
  const rowH = 34
  const height = 128 + m.rows.length * rowH + 30
  const big = Math.round(m.big.percent)
  const font = `font-family="ui-sans-serif,-apple-system,'Segoe UI',Roboto,system-ui,sans-serif"`

  const bar = (y: number, p: number, color: string, h: number) => {
    const wv = Math.max(0, Math.min(100, p)) / 100 * inner
    return `<rect x="${pad}" y="${y}" width="${inner}" height="${h}" rx="${h / 2}" fill="${t.track}"/>` +
      (wv > 0 ? `<rect x="${pad}" y="${y}" width="${Math.max(wv, h).toFixed(1)}" height="${h}" rx="${h / 2}" fill="${color}"/>` : '')
  }

  let rows = ''
  m.rows.forEach((r, i) => {
    const y = 128 + i * rowH
    const col = r.percent >= 85 ? tone(r.percent) : t.accent
    rows +=
      `<text x="${pad}" y="${y + 10}" font-size="9.5" letter-spacing="0.9" fill="${t.muted}" font-weight="600">${esc(r.label.toUpperCase())}</text>` +
      `<text x="${width - pad}" y="${y + 10}" font-size="11" fill="${t.text}" text-anchor="end">${esc(r.right)}</text>` +
      bar(y + 17, r.percent, col, 4)
  })

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${font}>` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg[0]}"/><stop offset="1" stop-color="${t.bg[1]}"/></linearGradient>` +
    `<clipPath id="card"><rect width="${width}" height="${height}" rx="14"/></clipPath></defs>` +
    `<g clip-path="url(#card)"><rect width="${width}" height="${height}" fill="url(#bg)"/>${t.deco(width, height)}</g>` +
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="13.5" fill="none" stroke="rgba(255,255,255,0.08)"/>` +
    `<text x="${pad}" y="26" font-size="10" letter-spacing="1.2" font-weight="600" fill="${t.muted}">${esc(m.title.toUpperCase())}</text>` +
    `<text x="${pad}" y="70" font-size="40" font-weight="300" fill="${tone(m.big.percent)}">${big}<tspan font-size="15" dy="-20" dx="2">%</tspan></text>` +
    `<text x="${pad + 2 + String(big).length * 23 + 22}" y="68" font-size="10" letter-spacing="0.9" font-weight="600" fill="${t.muted}">${esc(m.big.label.toUpperCase())}</text>` +
    mascotGroup(m.skin, m.mood, tone(m.big.percent), 4, width - pad - 64, 16, true) +
    bar(82, m.big.percent, tone(m.big.percent), 7) +
    `<text x="${pad}" y="108" font-size="12" fill="${t.text}">${esc(m.big.sub)}</text>` +
    rows +
    `<circle cx="${pad + 3}" cy="${height - 19}" r="3" fill="#3ddc84"/>` +
    `<text x="${pad + 12}" y="${height - 15}" font-size="11" fill="${t.muted}">${esc(m.footer)}</text>` +
    `</svg>`
  )
}
