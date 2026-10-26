import { expect, mock, test } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const

const BAND_PROPS = {
  hasSurvey: false,
  isWorking: true,
  maxRows: 10,
  bodyColumns: 80,
  scroll: { bodyRows: 9, offset: 0 },
  view: {},
}

test('band shows the running turn with its tool count', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('tool.call', () => ({ isError: true as const, result: null, text: 'stub' }))
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: '/x' })
  await clock.advance(5000)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'progress-viz', surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect(await ui.find({ type: 'Text', text: /Working .*1 tool/ })).toBeDefined()
    await ui.unmount()
  }
})

test('pane lists a spawned agent with its role, then marks it done', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  on('turn.complete', () => ({ text: '' }))
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'a1' }))
  await $.agent.spawn({
    tool_use_id: 'tu1',
    prompt: 'find things',
    description: 'Find callers',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: true,
    fork: false,
  })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({
      plugin: 'progress-viz',
      surface,
      component: 'Pane',
      requestId: 'agent-progress',
      props: { title: 'Agents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { bodyRows: 20, offset: 0 }, view: {} },
    })
    expect(await ui.find({ type: 'Text', text: /Explorer/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /working .*0 tools/ })).toBeDefined()
    await ui.unmount()
  }

  await $.turn.complete({ answer: 'done', durationMs: 10, isAborted: false, turnId: 'x', agentId: 'a1', reason: 'answer' })

  const ui = await $.ui.mount({
    plugin: 'progress-viz',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'agent-progress',
    props: { title: 'Agents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { bodyRows: 20, offset: 0 }, view: {} },
  })
  expect(await ui.find({ type: 'Text', text: /100%/ })).toBeDefined()
  await ui.press({ key: 'clear' })
  expect(await ui.find({ type: 'Text', text: /No agents yet/ })).toBeDefined()
  await ui.unmount()
})

test('band keeps what the plugins beneath draw, below the bar', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>Quiz button</Text>
  })
  await $.turn.start({ text: 'go', turnId: 't1' })
  await clock.advance(1000)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'progress-viz', surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect(await ui.find({ type: 'Text', text: /Working/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Quiz button/ })).toBeDefined()
    await ui.unmount()
  }
})

test('terminal pane draws Clawd beside each agent', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'a1' }))
  await $.agent.spawn({
    tool_use_id: 'tu1',
    prompt: 'find things',
    description: 'Find callers',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: true,
    fork: false,
  })

  const ui = await $.ui.mount({
    plugin: 'progress-viz',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'agent-progress',
    props: { title: 'Agents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { bodyRows: 20, offset: 0 }, view: {} },
  })
  expect(await ui.find({ type: 'Text', text: /▐▛███▜/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /▗▆▆▆▖/ })).toBeDefined()
  await ui.unmount()
})

test('desktop pane still draws the costumed SVG avatar', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'a1' }))
  await $.agent.spawn({
    tool_use_id: 'tu1',
    prompt: 'find things',
    description: 'Find callers',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: true,
    fork: false,
  })

  const ui = await $.ui.mount({
    plugin: 'progress-viz',
    surface: 'desktop',
    component: 'Pane',
    requestId: 'agent-progress',
    props: { title: 'Agents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { bodyRows: 20, offset: 0 }, view: {} },
  })
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn).toContain('Explorer avatar')
  expect(drawn).toContain('#D9B77E')
  expect(drawn).not.toContain('▐▛███▜')
  await ui.unmount()
})

test("finished agent shows a View agent's output button that reveals its answer", async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  on('turn.complete', () => ({ text: '' }))
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'a1' }))
  await $.agent.spawn({
    tool_use_id: 'tu1',
    prompt: 'find things',
    description: 'Find callers',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: true,
    fork: false,
  })
  await $.turn.complete({ answer: 'Found 3 callers', durationMs: 10, isAborted: false, turnId: 'x', agentId: 'a1', reason: 'answer' })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({
      plugin: 'progress-viz',
      surface,
      component: 'Pane',
      requestId: 'agent-progress',
      props: { title: 'Agents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { bodyRows: 20, offset: 0 }, view: {} },
    })
    await ui.press({ key: 'out-a1' })
    expect(await ui.find({ type: 'Markdown', text: /Found 3 callers/ })).toBeDefined()
    await ui.press({ key: 'out-a1' })
    await ui.unmount()
  }
})
