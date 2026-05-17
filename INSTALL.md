# Install

## Claude Code
```
/install-plugin mirkobozzetto/espresso
```

## OpenAI Codex
```bash
codex plugin marketplace add mirkobozzetto/espresso
codex plugin install espresso
```
Enable in `~/.codex/config.toml`:
```toml
[features]
plugin_hooks = true
```

## Cursor / Windsurf / Copilot / Others
```bash
curl -sL https://raw.githubusercontent.com/mirkobozzetto/espresso/main/AGENTS.md > AGENTS.md
```

## Optional (more savings)
```bash
brew install rtk-ai/tap/rtk               # 60-90% CLI compression
```
```
/install-plugin JuliusBrussee/caveman      # 75% conversation compression
```

## Verify (Claude Code / Codex)
```bash
ls ~/.claude/rules/                        # 4 rule files
cat ~/.claude/.espresso-setup-done         # setup timestamp
```

## Uninstall

### Claude Code
```
/uninstall-plugin espresso
```

### Clean up created files
```bash
rm ~/.claude/rules/exa.md ~/.claude/rules/git.md ~/.claude/rules/gitnexus.md ~/.claude/rules/project-rules-suggestion.md
rm ~/.claude/.espresso-active ~/.claude/.espresso-setup-done
rm ~/.config/caveman/config.json
```

### Cursor / Windsurf / Others
Delete the `AGENTS.md` you copied.
