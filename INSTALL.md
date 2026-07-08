# Install

## Claude Code

Inside Claude Code (type these in the prompt, not in a terminal):

```
/plugin marketplace add mirkobozzetto/espresso
/plugin install espresso@espresso
/reload-plugins
```

Or from terminal:

```bash
claude plugin marketplace add mirkobozzetto/espresso
claude plugin install espresso@espresso
```

Then restart Claude Code.

## Cursor / Windsurf / Copilot / Codex / Others

In your project root:

```bash
curl -sL https://raw.githubusercontent.com/mirkobozzetto/espresso/main/AGENTS.md > AGENTS.md
```

## Verify

```bash
ls ~/.claude/rules/                        # 6 rule files
cat ~/.claude/.espresso-setup-done         # setup timestamp
```

## Model ladder only (no full stack)

Want just the cheaper-worker fallback, not caveman/ponytail/rules? The ladder
hook is self-contained (one file, zero dependencies). Copy it and register it
in your own `settings.json`:

```bash
cp "$(claude plugin root espresso 2>/dev/null || echo .)/src/hooks/espresso-model-ladder.cjs" ~/.claude/hooks/
```

Then add two hook entries to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/espresso-model-ladder.cjs", "timeout": 5 }] }
    ],
    "PreToolUse": [
      { "matcher": "Agent|Task", "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/espresso-model-ladder.cjs", "timeout": 10 }] }
    ]
  }
}
```

Restart Claude Code. Every subagent now spawns one tier below the session model.
Disable anytime with `touch ~/.claude/.espresso-ladder-off`.

## Uninstall

Inside Claude Code:

```
/plugin uninstall espresso@espresso
```

Clean up created files:

```bash
rm ~/.claude/rules/exa.md ~/.claude/rules/git.md ~/.claude/rules/gitnexus.md ~/.claude/rules/project-rules-suggestion.md
rm ~/.claude/rules/subagent-model-economy.md ~/.claude/rules/subagent-delegation.md
rm ~/.claude/.espresso-active ~/.claude/.espresso-setup-done ~/.claude/.espresso-ponytail-done
rm -f ~/.claude/.espresso-ladder-off
rm ~/.config/caveman/config.json ~/.config/ponytail/config.json
```
