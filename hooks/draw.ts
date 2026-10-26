import type { AgentRow, TurnRow } from '../types'

export type Role = { label: string; color: string; icon: string; costume: string }

export type BarSegment = { text: string; color?: string; isDim?: boolean }

// Claude Code's own spinner glyphs.
export const SPARK_FRAMES = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢']

const CLAUDE = '#D97757'

// Pixel costumes drawn over Clawd, in the sprite's own coordinates: body x 11-44, y 8-28; arms reach x 49.
const r = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`

const GOLD = '#F5C518'

const COSTUMES = {
  // Pith helmet and a magnifying glass.
  explorer:
    r(9, 6, 37, 2, '#D9B77E') + r(14, 2, 27, 4, '#D9B77E') + r(17, 0, 21, 2, '#D9B77E') + r(14, 5, 27, 1, '#8B6B3E') +
    '<line x1="49" y1="21" x2="51.5" y2="16.5" stroke="#8B6B3E" stroke-width="2" shape-rendering="auto"/>' +
    '<circle cx="53.5" cy="13" r="3.5" fill="#BFE3FF" fill-opacity="0.5" stroke="#C9CED6" stroke-width="1.5" shape-rendering="auto"/>',
  // Guard cap with a gold badge.
  security: r(13, 1, 29, 6, '#23305A') + r(10, 6, 35, 2, '#111111') + r(26, 2, 3, 3, GOLD),
  // Reading glasses and a clipboard.
  reviewer:
    '<g fill="none" stroke="#1A1A1A" stroke-width="1"><rect x="14.5" y="11.5" width="7" height="8"/><rect x="33.5" y="11.5" width="7" height="8"/></g>' +
    r(22, 14, 11, 1, '#1A1A1A') + r(49, 11, 8, 11, '#8B6B3E') + r(50, 12, 6, 9, '#F2EEE3') + r(51, 10, 4, 2, '#A9AEB8') +
    '<path d="M51 17 L52.5 18.5 L55 14.5" fill="none" stroke="#30A46C" stroke-width="1.2" shape-rendering="auto"/>',
  // Hard hat and a flask.
  qa:
    r(14, 1, 27, 6, GOLD) + r(10, 6, 35, 2, GOLD) + r(26, -1, 3, 2, '#E0B000') + r(14, 5, 27, 1, '#D9A800') +
    r(51, 10, 3, 4, '#C9CED6') + '<path d="M49 21 L51 14 L54 14 L56 21 Z" fill="#7CE0A3" stroke="#C9CED6" stroke-width="1"/>',
  // Wizard hat with stars.
  planner:
    r(26, -4, 3, 2, '#6E3FB0') + r(24, -2, 7, 2, '#6E3FB0') + r(22, 0, 11, 2, '#6E3FB0') + r(20, 2, 15, 2, '#6E3FB0') +
    r(18, 4, 19, 2, '#6E3FB0') + r(12, 6, 31, 2, '#6E3FB0') + r(27, -1, 1, 1, GOLD) + r(22, 4, 2, 1, GOLD) + r(31, 2, 1, 1, GOLD),
  // Beret and a pencil.
  drafter:
    r(12, 4, 28, 4, '#C2413A') + r(15, 2, 20, 2, '#C2413A') + r(24, 0, 2, 2, '#C2413A') + r(12, 7, 28, 1, '#8E2C27') +
    '<line x1="49" y1="21" x2="55" y2="10" stroke="' + GOLD + '" stroke-width="2.5" shape-rendering="auto"/>' +
    '<line x1="55" y1="10" x2="56.2" y2="7.8" stroke="#2B2B2B" stroke-width="2.5" shape-rendering="auto"/>',
  // Mortarboard with a tassel.
  guide:
    r(16, 3, 23, 5, '#3A4466') + r(8, 1, 39, 3, '#4E5A85') + r(8, 1, 39, 1, '#6B78A8') + r(26, 0, 3, 1, GOLD) +
    r(45, 3, 1, 6, GOLD) + r(44, 8, 3, 2, GOLD),
  // Mechanic's cap and a wrench.
  setup:
    r(13, 2, 29, 6, '#5A5F6B') + r(13, 6, 29, 1, '#41454F') + r(26, 1, 3, 1, '#41454F') +
    '<line x1="49" y1="21" x2="54" y2="13" stroke="#A9AEB8" stroke-width="2" shape-rendering="auto"/>' +
    '<circle cx="55" cy="11" r="2.5" fill="none" stroke="#A9AEB8" stroke-width="1.8" shape-rendering="auto"/>',
  // Striped party hat.
  fork:
    r(26, -3, 3, 2, '#E5484D') + r(25, -1, 5, 2, '#3E63DD') + r(23, 1, 9, 2, GOLD) + r(21, 3, 13, 2, '#3E63DD') +
    r(19, 5, 17, 3, GOLD),
  // Plain Clawd with a twinkling spark overhead.
  claude:
    '<g class="spark" stroke="#F0A07F" stroke-width="2" stroke-linecap="round" shape-rendering="auto">' +
    '<line x1="27.5" y1="-4" x2="27.5" y2="6"/><line x1="22.5" y1="1" x2="32.5" y2="1"/>' +
    '<line x1="24" y1="-2.5" x2="31" y2="4.5"/><line x1="31" y1="-2.5" x2="24" y2="4.5"/></g>',
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
  [/fork/i, { label: 'Fork', color: CLAUDE, icon: '⑂', costume: COSTUMES.fork }],
]

const DEFAULT_ROLE: Role = { label: 'Claude', color: CLAUDE, icon: '✦', costume: COSTUMES.claude }

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

// Clawd, Claude Code's pixel mascot, traced from its sprite: body, arms, eye holes and four legs.
export const CLAWD = '#D78787'
const LEGS = [11, 16, 36, 41]

// Clawd in block characters, as the CLI's start screen draws him; while running the legs step in pairs.
export const CLAWD_COLUMNS = 9
const CLAWD_HEAD = ' ▐▛███▜▌ '
const CLAWD_HEAD_FAILED = ' ▐▀███▀▌ '
const CLAWD_ARMS = '▝▜█████▛▘'
const CLAWD_LEGS = '  ▘▘ ▝▝  '
const CLAWD_LEGS_STEP = '  ▝▘ ▘▝  '

// The terminal's take on each costume, by role label: a hat row over Clawd and a prop at his right hand.
// Each hat is CLAWD_COLUMNS wide; colours are lifted from the SVG costumes, lightened to show on a dark terminal.
const TERMINAL_COSTUMES: Record<string, { hat: string; color: string; prop: string }> = {
  Explorer: { hat: '  ▗▆▆▆▖  ', color: '#D9B77E', prop: '⌕' },
  Security: { hat: '  ▗███▖  ', color: '#4E6BC9', prop: '★' },
  QA: { hat: '  ▗███▖  ', color: GOLD, prop: '⚗' },
  Reviewer: { hat: '         ', color: CLAWD, prop: '▤' },
  Planner: { hat: '  ▗▟█▙▖  ', color: '#8E4EC6', prop: '✦' },
  Drafter: { hat: '  ▄▄▄▄▖  ', color: '#C2413A', prop: '✎' },
  Guide: { hat: '  ▄▄▄▄▄▖ ', color: '#6B78A8', prop: ' ' },
  Setup: { hat: '  ▗▄▄▄▖  ', color: '#8B8D98', prop: '⚙' },
  Fork: { hat: '   ▗▲▖   ', color: GOLD, prop: ' ' },
  Claude: { hat: '    ✻    ', color: '#F0A07F', prop: ' ' },
}

export const clawdRows = (o: { role: Role; isRunning: boolean; isFailed: boolean; now: number }): BarSegment[][] => {
  const costume = TERMINAL_COSTUMES[o.role.label] ?? TERMINAL_COSTUMES.Claude
  const head = o.isFailed ? CLAWD_HEAD_FAILED : CLAWD_HEAD

  return [
    [{ text: costume?.hat ?? '', color: costume?.color }],
    [
      { text: head.slice(0, -1), color: CLAWD },
      { text: costume?.prop ?? ' ', color: o.role.color },
    ],
    [{ text: CLAWD_ARMS, color: CLAWD }],
    [{ text: o.isRunning && Math.floor(o.now / 250) % 2 === 1 ? CLAWD_LEGS_STEP : CLAWD_LEGS, color: CLAWD }],
  ]
}

export const avatarSvg = (o: { role: Role; isRunning: boolean; isFailed: boolean; now: number }): string => {
  // While running the legs step in alternating pairs, the body and costume bob and the eyes blink.
  const legs = LEGS.map((x, i) => {
    const step = o.isRunning
      ? `<animate attributeName="height" values="${i % 2 ? '5;3;5' : '3;5;3'}" dur="0.5s" begin="${phase(o.now, 500)}" repeatCount="indefinite"/>`
      : ''

    return `<rect x="${x}" y="28" width="3" height="5">${step}</rect>`
  }).join('')
  const bob = o.isRunning
    ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1;0 0" dur="0.5s" begin="${phase(o.now, 500)}" repeatCount="indefinite"/>`
    : ''
  const blink = o.isRunning
    ? `<animate attributeName="height" values="5;5;0.6;5" keyTimes="0;0.9;0.95;1" dur="3.2s" begin="${phase(o.now, 3200)}" repeatCount="indefinite"/>`
    : ''
  const twinkle = o.isRunning
    ? `<style>.spark{animation:tw 1.2s ${phase(o.now, 1200)} infinite ease-in-out;transform-origin:27.5px 1px}` +
      `@keyframes tw{50%{opacity:.35;transform:scale(.6) rotate(45deg)}}</style>`
    : ''
  const eyes = o.isFailed
    ? '<path d="M15.5 13 L19.5 18 M19.5 13 L15.5 18 M35.5 13 L39.5 18 M39.5 13 L35.5 18" stroke="#000" stroke-width="1.4"/>'
    : `<rect x="16" y="13" width="3" height="5" fill="#000">${blink}</rect><rect x="36" y="13" width="3" height="5" fill="#000">${blink}</rect>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="42" viewBox="2 -5 58 42" shape-rendering="crispEdges">` +
    twinkle +
    `<g fill="${CLAWD}">${legs}</g>` +
    `<g opacity="${o.isFailed ? 0.6 : 1}">${bob}<g fill="${CLAWD}"><rect x="11" y="8" width="33" height="20"/><rect x="6" y="18" width="43" height="5"/></g>` +
    `${eyes}${o.role.costume}</g>` +
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
