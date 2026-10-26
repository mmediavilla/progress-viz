import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AgentRow, TurnRow } from '../types'
import {
  agentProgress,
  avatarSvg,
  barSvg,
  clawdRows,
  roleOf,
  terminalBar,
  turnProgress,
  CLAWD_COLUMNS,
  SPARK_FRAMES,
} from './draw'
import type { BarSegment } from './draw'

const PANE = 'agent-progress'
const LINGER_MS = 4000

const turn = atom({ plugin: 'progress-viz', key: 'turn' } as const, null)
const agents = atom({ plugin: 'progress-viz', key: 'agents' } as const, [])
const openId = atom({ plugin: 'progress-viz', key: 'openId' } as const, null)

const clock = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const register: Register = on => {
  // Last drawn fill per bar, so each redraw animates from where the previous one stopped.
  const drawn = new Map<string, number>()
  let hasTerminal = false
  let isPaneOpened = false
  let ticks = 0
  // Activity seen for an agent id before its spawn resolved, merged in when it does.
  const early = new Map<string, Pick<AgentRow, 'tools' | 'lastTool' | 'endedAt' | 'isFailed'>>()
  const known = new Set<string>()
  const earlyFor = (id: string) => {
    const row = early.get(id) ?? { tools: 0, lastTool: '', endedAt: null, isFailed: false }
    early.set(id, row)
    if (early.size > 50) {
      early.delete(early.keys().next().value ?? id)
    }

    return row
  }

  const isLive = (t: TurnRow | null, list: AgentRow[], now: number): boolean =>
    (t !== null && (t.endedAt === null || now - t.endedAt < LINGER_MS + 500)) ||
    list.some(a => a.endedAt === null || now - a.endedAt < 1500)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'agent-progress', description: 'Open the Agents progress pane' })

    // Desktop SVG animates itself between redraws; the terminal needs frames for its spinner.
    $.clock.every(200, async () => {
      ticks += 1
      if (!hasTerminal && ticks % 5 !== 0) {
        return
      }
      const now = await $.clock.now()
      if (isLive(await read($, turn), await read($, agents), now)) {
        $.ui.invalidate('ui.render')
      }
    })

    return next(e)
  })

  on('command.run', { command: 'agent-progress' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Agents' })

    return { text: 'Agents pane opened.' }
  })

  on('turn.start', async ($, e, next) => {
    const startedAt = await $.clock.now()
    await update($, turn, () => ({ startedAt, tools: 0, lastTool: '', endedAt: null, isAborted: false }))
    drawn.delete('turn')

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) {
      void update($, turn, t => (t === null ? t : { ...t, tools: t.tools + 1, lastTool: e.tool }))
    } else if (known.has(id)) {
      void update($, agents, list =>
        list.map(a =>
          a.id === id ? { ...a, tools: a.tools + 1, lastTool: e.tool, endedAt: null, isFailed: false } : a,
        ),
      )
    } else {
      const row = earlyFor(id)
      row.tools += 1
      row.lastTool = e.tool
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    const id = result.agentId
    if (id === undefined) {
      return result
    }
    const startedAt = await $.clock.now()
    const row: AgentRow = {
      id,
      type: e.subagentType,
      description: e.description,
      startedAt,
      ...earlyFor(id),
    }
    early.delete(id)
    known.add(id)
    await update($, agents, list => [...list.filter(a => a.id !== id), row].slice(-30))
    if (!isPaneOpened) {
      isPaneOpened = true
      $.ui.open({ id: PANE, title: 'Agents' }).catch(() => {
        isPaneOpened = false
      })
    }

    return result
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const endedAt = await $.clock.now()
    const id = e.agentId
    if (id === undefined) {
      await update($, turn, t => (t === null ? t : { ...t, endedAt, isAborted: e.isAborted }))
    } else if (known.has(id)) {
      await update($, agents, list =>
        list.map(a => (a.id === id ? { ...a, endedAt, isFailed: e.isAborted, output: e.answer } : a)),
      )
    } else {
      Object.assign(earlyFor(id), { endedAt, isFailed: e.isAborted })
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const t = await read($, turn)
    const list = await read($, agents)
    const now = await $.clock.now()
    const running = list.filter(a => a.endedAt === null)
    const isTurnShown = t !== null && (t.endedAt === null || now - t.endedAt < LINGER_MS)

    if (e.props.hasSurvey) {
      return next(e)
    }
    // Draw above what the plugins beneath draw, rather than in place of it.
    const below = await next(e)
    if (!isTurnShown && running.length === 0) {
      return below
    }

    const els = $.ui.resolve(e)
    const { Box, Text } = els
    const segments = (list: BarSegment[]) =>
      list.map((seg, i) => (
        <Text key={String(i)} color={seg.color} dimColor={seg.isDim}>
          {seg.text}
        </Text>
      ))
    const agentNote = running.length > 0 ? ` · ${running.length} agent${running.length === 1 ? '' : 's'} running` : ''

    let label: string
    let pct: number
    let color = '#D97757'
    let isRunning = true
    if (t !== null && isTurnShown) {
      isRunning = t.endedAt === null
      pct = turnProgress(t, now)
      const elapsed = clock((t.endedAt ?? now) - t.startedAt)
      const tools = `${t.tools} tool${t.tools === 1 ? '' : 's'}`
      if (t.isAborted) {
        color = '#E5484D'
        label = `Interrupted at ${elapsed} · ${tools}`
      } else if (!isRunning) {
        color = '#30A46C'
        label = `Done in ${elapsed} · ${tools}`
      } else {
        label = `Working ${elapsed} · ${tools}${t.lastTool ? ` · ${t.lastTool}` : ''}`
      }
      label += agentNote
    } else {
      pct = running.reduce((sum, a) => sum + agentProgress(a, now), 0) / running.length
      label = `Agents${agentNote}`
    }

    if (e.surface === 'terminal' || !('Svg' in els)) {
      hasTerminal = true
      const spark = isRunning ? SPARK_FRAMES[Math.floor(now / 120) % SPARK_FRAMES.length] : t?.isAborted ? '✕' : '✓'
      const pctText = ` ${Math.round(pct * 100)}%`
      const width = Math.max(10, e.props.bodyColumns - 2)

      return (
        <Box flexDirection="column">
          <Text>
            <Text color={color}>{spark} </Text>
            <Text dimColor wrap="truncate-end">{label}</Text>
          </Text>
          <Text>
            {segments(terminalBar(pct, width - pctText.length, now, isRunning, color))}
            <Text dimColor>{pctText}</Text>
          </Text>
          {below}
        </Box>
      )
    }

    const { Svg } = els
    const from = drawn.get('turn') ?? 0
    drawn.set('turn', pct)

    return (
      <Box flexDirection="column">
        <Text dimColor>
          {label} · {Math.round(pct * 100)}%
        </Text>
        <Svg
          source={barSvg({ id: 'turn', from, to: pct, width: 640, height: 6, color, isRunning, now })}
          alt={`${label}, ${Math.round(pct * 100)}%`}
          height={6}
        />
        {below}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const list = await read($, agents)
    const opened = await read($, openId)
    const now = await $.clock.now()
    const els = $.ui.resolve(e)
    const { Box, Text, Button, Markdown } = els
    const segments = (list: BarSegment[]) =>
      list.map((seg, i) => (
        <Text key={String(i)} color={seg.color} dimColor={seg.isDim}>
          {seg.text}
        </Text>
      ))
    if (e.surface === 'terminal' || !('Svg' in els)) {
      hasTerminal = true
    }
    const finished = list.filter(a => a.endedAt !== null).length
    const running = list.length - finished
    const ordered = [...list].sort((a, b) => Number(a.endedAt !== null) - Number(b.endedAt !== null) || b.startedAt - a.startedAt)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text bold>
            {running} running · {finished} done
          </Text>
          {finished > 0 && (
            <Button
              key="clear"
              label="Clear finished"
              onPress={() => update($, agents, all => all.filter(a => a.endedAt === null))}
            />
          )}
        </Box>
        {list.length === 0 && <Text dimColor>No agents yet. They show here as soon as one spawns.</Text>}
        {ordered.map(a => {
          const role = roleOf(a.type)
          const isRunning = a.endedAt === null
          const pct = agentProgress(a, now)
          const color = a.isFailed ? '#E5484D' : role.color
          const elapsed = clock((a.endedAt ?? now) - a.startedAt)
          const state = isRunning ? 'working' : a.isFailed ? 'stopped' : 'done'
          const hasOutput = !isRunning && !!a.output
          const isOpen = hasOutput && opened === a.id
          const outputToggle = hasOutput && (
            <Button
              key={`out-${a.id}`}
              label={isOpen ? 'Hide output' : "View agent's output"}
              onPress={() => update($, openId, cur => (cur === a.id ? null : a.id))}
            />
          )
          const outputBody = isOpen && <Markdown key={`md-${a.id}`} text={a.output ?? ''} />
          const stats = `${state} · ${elapsed} · ${a.tools} tool${a.tools === 1 ? '' : 's'}${isRunning && a.lastTool ? ` · ${a.lastTool}` : ''}`

          if (e.surface === 'terminal' || !('Svg' in els)) {
            const spark = isRunning ? SPARK_FRAMES[Math.floor(now / 120 + a.startedAt) % SPARK_FRAMES.length] : a.isFailed ? '✕' : '✓'
            const sprite = clawdRows({ role, isRunning, isFailed: a.isFailed, now: now + a.startedAt })
            const width = Math.max(10, e.props.bodyColumns - 6 - CLAWD_COLUMNS - 1)

            return (
              <Box key={a.id} flexDirection="row" gap={1}>
                <Box flexDirection="column" flexShrink={0}>
                  {sprite.map((row, i) => (
                    <Text key={String(i)}>
                      {row.map((seg, j) => (
                        <Text key={String(j)} color={seg.color} dimColor={a.isFailed}>
                          {seg.text}
                        </Text>
                      ))}
                    </Text>
                  ))}
                </Box>
                <Box flexDirection="column" flexGrow={1}>
                  <Text wrap="truncate-end">
                    <Text color={color} bold>
                      {spark} {role.icon} {role.label}
                    </Text>
                    <Text dimColor> {a.type} · {a.description}</Text>
                  </Text>
                  <Text>
                    {segments(terminalBar(pct, width, now + a.startedAt, isRunning, color))}
                    <Text dimColor> {Math.round(pct * 100)}%</Text>
                  </Text>
                  <Text dimColor wrap="truncate-end">
                    {stats}
                  </Text>
                  {outputToggle}
                  {outputBody}
                </Box>
              </Box>
            )
          }

          const { Svg } = els
          const from = drawn.get(a.id) ?? 0
          drawn.set(a.id, pct)

          return (
            <Box key={a.id} flexDirection="row" gap={1} alignItems="center">
              <Svg
                source={avatarSvg({ role, isRunning, isFailed: a.isFailed, now })}
                alt={`${role.label} avatar`}
                width={58}
                height={42}
              />
              <Box flexDirection="column" flexGrow={1}>
                <Text wrap="truncate-end">
                  <Text bold color={color}>
                    {role.label}
                  </Text>
                  <Text dimColor> {a.type} · {a.description}</Text>
                </Text>
                <Svg
                  source={barSvg({ id: a.id, from, to: pct, width: 320, height: 5, color, isRunning, now: now + a.startedAt })}
                  alt={`${Math.round(pct * 100)}%`}
                  height={5}
                />
                <Text dimColor wrap="truncate-end">
                  {Math.round(pct * 100)}% · {stats}
                </Text>
                {outputToggle}
                {outputBody}
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
