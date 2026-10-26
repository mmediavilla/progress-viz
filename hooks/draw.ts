import type { AgentRow, TurnRow } from '../types'

export type Role = { label: string; color: string; icon: string; costume: string }

export type BarSegment = { text: string; color?: string; isDim?: boolean }

// Claude Code's own spinner glyphs.
export const SPARK_FRAMES = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢']

const ACCENT = '#D97757'

// Blok's palette. The shirt takes the role's colour, so only skin, hair and trousers are fixed.
const SKIN = '#E8B48A'
const HAIR = '#5A3B26'
const PANTS = '#3D4357'
const BOOTS = '#2A2A2A'

// Pixel gear drawn over Blok, in the sprite's own 2px grid: head x 20-36, y 0-14; body to y 26; legs to y 36.
// Hats sit in y -5 to 4; props are held in his right hand at x 34-38, y 20-26, and reach out to x 54.
const r = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`

// A diagonal of 2px steps rising from the right hand, for handles and pencils.
const stick = (steps: number, fill: string) =>
  Array.from({ length: steps }, (_, i) => r(38 + i * 2, 22 - i * 2, 2, 2, fill)).join('')

const GOLD = '#F5C518'
const WOOD = '#8B6B3E'
const IRON = '#A9AEB8'
const PAPER = '#F2EEE3'

const COSTUMES = {
  // Mining helmet with a lamp, and a pickaxe.
  explorer:
    r(19, -2, 18, 4, GOLD) + r(18, 1, 20, 2, '#D9A800') + r(26, -3, 4, 3, '#FFF6B0') +
    stick(5, WOOD) + r(42, 10, 10, 2, IRON) + r(40, 12, 2, 2, IRON) + r(52, 12, 2, 2, IRON),
  // Iron helmet and a shield.
  security:
    r(19, -2, 18, 5, IRON) + r(18, 2, 20, 2, '#8B8D98') +
    r(38, 15, 10, 12, '#23305A') + r(40, 17, 6, 8, '#3E63DD') + r(42, 19, 2, 4, GOLD),
  // Reading glasses and a clipboard.
  reviewer:
    '<g fill="none" stroke="#1A1A1A" stroke-width="1"><rect x="22.5" y="5.5" width="4" height="4"/><rect x="29.5" y="5.5" width="4" height="4"/></g>' +
    r(26, 7, 4, 1, '#1A1A1A') + r(38, 14, 10, 12, WOOD) + r(39, 15, 8, 10, PAPER) + r(41, 13, 4, 2, IRON) +
    '<path d="M40.5 20 L42 21.5 L45 17.5" fill="none" stroke="#30A46C" stroke-width="1.2" shape-rendering="auto"/>',
  // Goggles pushed up on the forehead, and a potion.
  qa:
    r(20, 2, 16, 2, '#3A3A3A') + r(22, 1, 5, 4, '#7CE0A3') + r(29, 1, 5, 4, '#7CE0A3') +
    r(41, 13, 4, 1, WOOD) + r(41, 14, 4, 3, '#C9CED6') + r(39, 17, 8, 9, '#7CE0A3') + r(40, 18, 2, 2, '#E9FFF1'),
  // Wizard hat with stars, and a rolled-up map.
  planner:
    r(27, -5, 2, 2, '#6E3FB0') + r(25, -3, 6, 2, '#6E3FB0') + r(23, -1, 10, 2, '#6E3FB0') + r(18, 1, 20, 2, '#6E3FB0') +
    r(27, -1, 1, 1, GOLD) + r(24, 1, 2, 1, GOLD) + r(31, 1, 1, 1, GOLD) +
    r(38, 18, 12, 6, '#E2C98F') + r(38, 18, 2, 6, '#9C7440') + r(48, 18, 2, 6, '#9C7440') + r(43, 20, 2, 2, '#C2413A'),
  // Beret and a pencil.
  drafter:
    r(19, -1, 17, 3, '#C2413A') + r(21, -3, 12, 2, '#C2413A') + r(27, -5, 2, 2, '#C2413A') + r(19, 2, 17, 1, '#8E2C27') +
    stick(4, GOLD) + r(46, 14, 2, 2, '#2B2B2B'),
  // Mortarboard with a tassel, and a book.
  guide:
    r(22, -1, 12, 3, '#3A4466') + r(16, -3, 24, 2, '#4E5A85') + r(16, -3, 24, 1, '#6B78A8') + r(38, -1, 1, 5, GOLD) + r(37, 3, 3, 2, GOLD) +
    r(38, 16, 9, 11, '#9C2C6E') + r(39, 17, 7, 9, '#D6409F') + r(46, 17, 1, 9, PAPER),
  // Hard hat and a wrench.
  setup:
    r(20, -2, 16, 4, GOLD) + r(18, 1, 20, 2, '#E0B000') + r(27, -3, 2, 1, '#E0B000') +
    stick(4, IRON) + r(44, 11, 8, 2, IRON) + r(44, 13, 2, 3, IRON) + r(50, 13, 2, 3, IRON),
  // Striped party hat.
  fork:
    r(27, -5, 2, 1, '#E5484D') + r(26, -4, 4, 2, '#3E63DD') + r(25, -2, 6, 1, GOLD) + r(24, -1, 8, 2, '#3E63DD') + r(22, 1, 12, 2, GOLD),
  // A torch, its flame flickering while he works.
  agent: r(38, 16, 2, 10, WOOD) + '<g class="flame">' + r(37, 12, 4, 4, '#F5A623') + r(38, 11, 2, 2, '#FFE066') + '</g>',
}

// First match wins, so the specific roles sit above the generic ones. `color` tints the label and bar.
const ROLES: Array<[RegExp, Role]> = [
  [/security/i, { label: 'Security', color: '#E5484D', icon: '⛨', costume: COSTUMES.security }],
  [/xray|qa|test/i, { label: 'QA', color: '#30A46C', icon: '⚗', costume: COSTUMES.qa }],
  [/review/i, { label: 'Reviewer', color: '#F5A623', icon: '✔', costume: COSTUMES.reviewer }],
  [/explore|search/i, { label: 'Explorer', color: '#12A594', icon: '⌕', costume: COSTUMES.explorer }],
  [/plan/i, { label: 'Planner', color: '#8E4EC6', icon: '☰', costume: COSTUMES.planner }],
  [/draft|writ/i, { label: 'Drafter', color: '#3E63DD', icon: '✎', costume: COSTUMES.drafter }],
  [/guide|doc/i, { label: 'Guide', color: '#D6409F', icon: '❏', costume: COSTUMES.guide }],
  [/setup|statusline|config/i, { label: 'Setup', color: '#8B8D98', icon: '⚙', costume: COSTUMES.setup }],
  [/fork/i, { label: 'Fork', color: ACCENT, icon: '⑂', costume: COSTUMES.fork }],
]

const DEFAULT_ROLE: Role = { label: 'Agent', color: ACCENT, icon: '✦', costume: COSTUMES.agent }

export const roleOf = (type: string): Role => ROLES.find(([match]) => match.test(type))?.[1] ?? DEFAULT_ROLE

// No real completion signal exists, so the fill is an estimate: it climbs with time and tool calls,
// never passes 95% while running, and jumps to 100% when the run ends.
const estimate = (startedAt: number, endedAt: number | null, tools: number, now: number, tau: number, k: number) => {
  if (endedAt !== null) {
    return 1
  }
  const seconds = Math.max(0, now - startedAt) / 1000

  return 0.95 * (1 - Math.exp(-(seconds / tau + tools / k)))
}

export const turnProgress = (t: TurnRow, now: number): number =>
  t.isAborted ? estimate(t.startedAt, null, t.tools, t.endedAt ?? now, 45, 10) : estimate(t.startedAt, t.endedAt, t.tools, now, 45, 10)

export const agentProgress = (a: AgentRow, now: number): number =>
  a.isFailed ? estimate(a.startedAt, null, a.tools, a.endedAt ?? now, 90, 15) : estimate(a.startedAt, a.endedAt, a.tools, now, 90, 15)

const fmt = (n: number) => n.toFixed(2)

// A negative begin keeps a looping animation in phase across redraws that remount the SVG.
const phase = (now: number, periodMs: number) => `-${fmt((now % periodMs) / 1000)}s`

const safeId = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '')

export const barSvg = (o: {
  id: string
  from: number
  to: number
  width: number
  height: number
  color: string
  isRunning: boolean
  now: number
}): string => {
  const id = safeId(o.id)
  const r = o.height / 2
  const fromW = fmt(Math.max(o.height, o.from * o.width))
  const toW = fmt(Math.max(o.height, o.to * o.width))
  const glow = o.width / 5
  const shimmer = o.isRunning
    ? `<rect x="${-glow}" width="${glow}" height="${o.height}" fill="url(#s${id})">` +
      `<animate attributeName="x" from="${-glow}" to="${o.width}" dur="1.6s" begin="${phase(o.now, 1600)}" repeatCount="indefinite"/></rect>`
    : ''
  const pulse = o.isRunning
    ? `<animate attributeName="opacity" values="1;0.75;1" dur="2s" begin="${phase(o.now, 2000)}" repeatCount="indefinite"/>`
    : ''

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" preserveAspectRatio="none">` +
    `<defs>` +
    `<linearGradient id="g${id}" x1="0" x2="1"><stop offset="0" stop-color="${o.color}"/><stop offset="1" stop-color="${o.color}" stop-opacity="0.65"/></linearGradient>` +
    `<linearGradient id="s${id}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="c${id}"><rect width="${toW}" height="${o.height}" rx="${r}">` +
    `<animate attributeName="width" from="${fromW}" to="${toW}" dur="0.7s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/></rect></clipPath>` +
    `</defs>` +
    `<rect width="${o.width}" height="${o.height}" rx="${r}" fill="#8883"/>` +
    `<g clip-path="url(#c${id})">${pulse}<rect width="${o.width}" height="${o.height}" fill="url(#g${id})"/>${shimmer}</g>` +
    `</svg>`
  )
}

// Blok in block characters: a hat row, his face, arms and shirt with the prop in hand, and legs that step while running.
export const BLOK_COLUMNS = 9
const BLOK_FACE = '█▄█▄█'
const BLOK_FACE_FAILED = '█▀█▀█'
const BLOK_LEGS = '  █▌ ▐█  '
const BLOK_LEGS_STEP = '  ▐▌ █▘  '
const HAIR_ROW = '  ▄▄▄▄▄  '

// The terminal's take on each costume, by role label: a hat row over Blok and a prop in his right hand.
// Each hat is BLOK_COLUMNS wide; colours are lifted from the SVG costumes, lightened to show on a dark terminal.
const TERMINAL_COSTUMES: Record<string, { hat: string; color: string; prop: string; propColor?: string }> = {
  Explorer: { hat: '  ▄▆█▆▄  ', color: GOLD, prop: '⌕' },
  Security: { hat: '  ▄███▄  ', color: '#C9CED6', prop: '★' },
  QA: { hat: '  ▀▀▀▀▀  ', color: '#7CE0A3', prop: '⚗' },
  Reviewer: { hat: HAIR_ROW, color: '#8A6246', prop: '▤' },
  Planner: { hat: '  ▗▟█▙▖  ', color: '#8E4EC6', prop: '✦' },
  Drafter: { hat: '  ▄▄▄▄▖  ', color: '#C2413A', prop: '✎' },
  Guide: { hat: '  ▄▄▄▄▄▖ ', color: '#6B78A8', prop: '▥' },
  Setup: { hat: '  ▄███▄▖ ', color: GOLD, prop: '⚙' },
  Fork: { hat: '   ▗▲▖   ', color: GOLD, prop: ' ' },
  Agent: { hat: HAIR_ROW, color: '#8A6246', prop: '¡', propColor: '#F5A623' },
}

export const blokRows = (o: { role: Role; isRunning: boolean; isFailed: boolean; now: number }): BarSegment[][] => {
  const costume = TERMINAL_COSTUMES[o.role.label] ?? TERMINAL_COSTUMES.Agent

  return [
    [{ text: costume?.hat ?? HAIR_ROW, color: costume?.color }],
    [{ text: '  ' }, { text: o.isFailed ? BLOK_FACE_FAILED : BLOK_FACE, color: SKIN }, { text: '  ' }],
    [
      { text: ' ' },
      { text: '▐', color: SKIN },
      { text: '█████', color: o.role.color },
      { text: '▌', color: SKIN },
      { text: costume?.prop ?? ' ', color: costume?.propColor ?? o.role.color },
    ],
    [{ text: o.isRunning && Math.floor(o.now / 250) % 2 === 1 ? BLOK_LEGS_STEP : BLOK_LEGS, color: '#6B7390' }],
  ]
}

export const avatarSvg = (o: { role: Role; isRunning: boolean; isFailed: boolean; now: number }): string => {
  // While running his legs step in turn, his upper body bobs, his eyes blink and the torch flickers.
  const leg = (x: number, i: number) => {
    const step = o.isRunning
      ? `<animateTransform attributeName="transform" type="translate" values="${i ? '0 0;0 -2;0 0' : '0 -2;0 0;0 -2'}" dur="0.5s" begin="${phase(o.now, 500)}" repeatCount="indefinite"/>`
      : ''

    return `<g>${step}${r(x, 26, 6, 8, PANTS)}${r(x, 34, 6, 2, BOOTS)}</g>`
  }
  const bob = o.isRunning
    ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1;0 0" dur="0.5s" begin="${phase(o.now, 500)}" repeatCount="indefinite"/>`
    : ''
  const blink = o.isRunning
    ? `<animate attributeName="height" values="3;3;0.6;3" keyTimes="0;0.9;0.95;1" dur="3.2s" begin="${phase(o.now, 3200)}" repeatCount="indefinite"/>`
    : ''
  const flicker = o.isRunning
    ? `<style>.flame{animation:fl .6s ${phase(o.now, 600)} infinite steps(2)}@keyframes fl{50%{opacity:.6;transform:translateY(-1px)}}</style>`
    : ''
  const eyes = o.isFailed
    ? '<path d="M23 6 L26 9 M26 6 L23 9 M30 6 L33 9 M33 6 L30 9" stroke="#2B2B3A" stroke-width="1.2"/>'
    : `<rect x="23" y="6" width="3" height="3" fill="#2B2B3A">${blink}</rect><rect x="30" y="6" width="3" height="3" fill="#2B2B3A">${blink}</rect>`
  const body =
    r(20, 0, 16, 14, SKIN) + r(20, 0, 16, 4, HAIR) + r(20, 4, 2, 2, HAIR) + r(34, 4, 2, 2, HAIR) +
    `<g fill-opacity="0.5">${r(21, 10, 2, 2, '#F28C8C')}${r(33, 10, 2, 2, '#F28C8C')}</g>` + r(26, 11, 4, 1, '#9A5B3C') +
    r(22, 14, 12, 12, o.role.color) + r(22, 24, 12, 2, '#3A2A1E') +
    r(18, 14, 4, 5, o.role.color) + r(18, 19, 4, 7, SKIN) + r(34, 14, 4, 5, o.role.color) + r(34, 19, 4, 7, SKIN)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="42" viewBox="2 -5 58 42" shape-rendering="crispEdges">` +
    flicker +
    `<g opacity="${o.isFailed ? 0.6 : 1}">${leg(22, 0)}${leg(28, 1)}` +
    `<g>${bob}${body}${eyes}${o.role.costume}</g></g>` +
    `</svg>`
  )
}

// Text bar for the terminal: solid fill with a bright band sweeping across it while running.
export const terminalBar = (pct: number, width: number, now: number, isRunning: boolean, color: string): BarSegment[] => {
  const cells = Math.max(1, width)
  const filled = Math.round(pct * cells)
  const sweep = isRunning && filled > 0 ? Math.floor((now / 60) % (filled + 6)) - 3 : -99
  const segments: BarSegment[] = []
  for (let i = 0; i < cells; i += 1) {
    const isFilled = i < filled
    const isLit = isFilled && Math.abs(i - sweep) <= 1
    const seg: BarSegment = isFilled
      ? { text: isLit ? '▓' : '█', color: isLit ? '#F6C9B3' : color }
      : { text: '░', isDim: true }
    const last = segments[segments.length - 1]
    if (last !== undefined && last.color === seg.color && last.isDim === seg.isDim) {
      last.text += seg.text
    } else {
      segments.push(seg)
    }
  }

  return segments
}
