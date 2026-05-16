<div align="center">

# Espresso

![Espresso](espresso-hero.jpeg)

**Concentrated Claude. Zero fluff, max power per token.**

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blue.svg)](https://github.com/mirkobozzetto/espresso)

```
/install-plugin mirkobozzetto/espresso
```

</div>

---

## Before / After

> **Without Espresso:**
> Sure! I'd be happy to help you with that. The issue you're experiencing is
> likely caused by a misconfiguration in your authentication middleware. Let me
> explain what's happening and walk you through the solution step by step.
> First, let me look at the relevant files...

> **With Espresso:**
> Bug in auth middleware. Token expiry check uses `<` not `<=`.
> Fix:

Same information. **~60% fewer tokens.**

---

## What It Does

| Rule | Effect |
|------|--------|
| **120 char line limit** | No walls of text |
| **Bullet points by default** | Scannable output |
| **Forbidden openers** | No "Sure!", "I'd be happy to", "Of course" |
| **Forbidden closers** | No recaps, no "let me know if you have questions" |
| **No filler words** | Cuts just/really/basically/actually/simply |
| **Result-first** | Answer before explanation |
| **No code comments** | Clean code output |
| **No emojis** | Unless you ask |

---

## Commands

| Command | What it does |
|---------|-------------|
| `/espresso` | Activate espresso mode |
| `/espresso off` | Deactivate |
| `/espresso-rules` | Show all formatting rules |
| `/espresso-guide` | Full token-saving stack guide |

---

## Go Deeper — The Full Stack

Espresso handles output formatting. For maximum token savings, combine with:

### [RTK](https://github.com/rtk-ai/rtk) — 60-90% CLI savings

Compresses output from git, npm, docker, cargo, kubectl.
Transparent proxy — commands work normally, output shrinks.

```bash
brew install rtk-ai/tap/rtk
```

### [Caveman](https://github.com/JuliusBrussee/caveman) — 75% conversation compression

Ultra-compressed communication mode.
Drops articles, filler, pleasantries. Speaks like smart caveman.

```
/install-plugin JuliusBrussee/caveman
```

### [GStack](https://github.com/garrytan/gstack) — Workflow optimization

Skills framework with QA testing, design review, shipping workflows, benchmarks.
Efficient workflows = fewer wasted tokens.

### Manual Config (the last 20%)

Some optimizations can't be packaged in a plugin.
Run `/espresso-guide` for copy-paste config blocks:

- Disable adaptive thinking (`CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`)
- Clean git commits (no "Generated with Claude Code" signatures)
- Permission deny lists (block destructive commands)
- Global rules files (`~/.claude/rules/`)

---

## Combined Savings

<div align="center">

| Layer | Savings | Target |
|:------|:-------:|:-------|
| **Espresso** | 40-60% | Response formatting |
| **RTK** | 60-90% | CLI command output |
| **Caveman** | ~75% | Conversation style |
| **GStack** | indirect | Workflow efficiency |
| **Manual config** | ~10% | Misc optimizations |

**Full stack: 70-85% total token reduction** vs vanilla Claude Code.

</div>

---

## How It Works

Two hooks fire automatically:

1. **SessionStart** — injects output rules as system context
2. **UserPromptSubmit** — reinforces rules every turn so they don't drift

No flag files to manage, no modes to switch.
On by default, `/espresso off` to stop.

---

<div align="center">

MIT License — [Mirko Bozzetto](https://github.com/mirkobozzetto)

</div>
