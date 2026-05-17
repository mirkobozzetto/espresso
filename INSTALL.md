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
ls ~/.claude/rules/                        # 4 rule files
cat ~/.claude/.espresso-setup-done         # setup timestamp
```

## Uninstall

Inside Claude Code:

```
/plugin uninstall espresso@espresso
```

Clean up created files:

```bash
rm ~/.claude/rules/exa.md ~/.claude/rules/git.md ~/.claude/rules/gitnexus.md ~/.claude/rules/project-rules-suggestion.md
rm ~/.claude/.espresso-active ~/.claude/.espresso-setup-done
rm ~/.config/caveman/config.json
```
