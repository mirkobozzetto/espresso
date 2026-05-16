---
name: espresso-guide
description: >
  Interactive guide to the full token-saving stack. Shows what Espresso does,
  what companion tools add, and how to set up the remaining 20% manually.
  Use /espresso-guide to see the full setup instructions.
---

# Espresso Guide — The Full Token-Saving Stack

Espresso handles **output formatting** (~40-60% savings on response tokens).
For maximum savings, combine with these companion tools:

---

## Level 1: Espresso (you're here)

**What it does:** Output compression — 120 char lines, bullet points, no filler, result-first.
**Savings:** ~40-60% on response tokens.
**Status:** Already installed.

---

## Level 2: RTK (Rust Token Killer)

**What it does:** Compresses CLI output from git, npm, docker, cargo, kubectl, etc.
Transparent proxy — commands work normally, output is 60-90% smaller.
**Savings:** 60-90% on command output tokens.
**Install:**
```bash
# macOS
brew install rtk-ai/tap/rtk

# or via cargo
cargo install rtk-cli

# Verify
rtk --version
rtk gain  # check savings
```
**Repo:** https://github.com/rtk-ai/rtk

**Manual step:** Add PreToolUse hook in `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "rtk hook claude",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

---

## Level 3: Caveman

**What it does:** Ultra-compressed communication style.
Drops articles, filler, pleasantries, hedging. Speaks like smart caveman.
**Savings:** ~75% on conversation tokens.
**Install:**
```
/install-plugin JuliusBrussee/caveman
```
**Repo:** https://github.com/JuliusBrussee/caveman

---

## Level 4: GStack

**What it does:** Skills framework + workflow optimization.
QA testing, design review, shipping workflow, benchmarks, and more.
**Savings:** Indirect — efficient workflows = fewer wasted tokens.
**Install:** https://github.com/garrytan/gstack
**Repo:** https://github.com/garrytan/gstack

---

## Level 5: Manual Config (the last 20%)

These can't be packaged in a plugin — requires manual setup:

### Environment Variables
Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING": "1"
  }
}
```

### Global Rules
Create `~/.claude/rules/` and add these files:

**git.md** — Clean commits:
```markdown
NEVER add "Generated with Claude Code" signature.
NEVER add "Co-Authored-By: Claude <noreply@anthropic.com>".
Commit messages CLEAN — only the message, nothing else.
```

### Permissions
Add to `~/.claude/settings.json` under `permissions.deny`:
```json
["Bash(rm -rf:*)", "Bash(sudo:*)", "Bash(git push --force:*)"]
```

---

## Combined Savings

| Layer | Savings | What |
|-------|---------|------|
| Espresso | 40-60% | Output formatting |
| RTK | 60-90% | CLI command output |
| Caveman | ~75% | Conversation style |
| GStack | indirect | Workflow efficiency |
| Manual config | ~10% | Adaptive thinking off, clean commits |

Full stack: **70-85% total token reduction** compared to vanilla Claude Code.
