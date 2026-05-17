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
```
/uninstall-plugin espresso
```
