# progress-viz

A Claude Code plugin that shows how a turn and its agents are doing.

## What it does

- **Progress band above the prompt.** An animated bar for the running turn, with elapsed time, tool count and the last tool used. It turns green when the turn finishes and red when it is interrupted, then fades after a few seconds.
- **Agents pane.** Opens on its own when the first subagent spawns. Each agent gets a Clawd avatar in a costume that matches its role (Explorer, Reviewer, QA, Planner and more), a progress bar, and its run stats. Finished agents have a button to view their output, and the pane has a button to clear them.

It draws in both the terminal (block characters) and the desktop app (animated SVG).

Progress is an estimate. Claude Code gives no completion signal, so the bar climbs with time and tool calls, stays under 95% while running, and jumps to 100% when the run ends.

## Install

At the prompt of a terminal session:

```
/plugin install progress-viz --marketplace mmediavilla/progress-viz
```

From a shell:

```
claude plugin install progress-viz --marketplace mmediavilla/progress-viz
```

In the desktop app, click + next to the prompt box, then Plugins, Add marketplace with `mmediavilla/progress-viz`, then Add plugin.

If the repository is private, the install works only for people who can read it on GitHub and already have a git credential for github.com.

## Usage

- The band shows on its own while a turn runs.
- Run `/agent-progress` to open the Agents pane at any time.

## Development

Load the plugin from this folder:

```
claude --plugin-dir .
```

Claude Code writes the API types into `.claude-plugin/types/` the first time it loads the plugin. Type-checking needs them, so load it once before running `tsc`. That folder is ignored by git.

```
claude plugin validate .
claude plugin test .
tsc -p .
```

## License

MIT. See [LICENSE](LICENSE).
