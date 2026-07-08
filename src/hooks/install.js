#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const claudeDir =
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const claudeJsonPath = path.join(os.homedir(), ".claude.json");
const rulesDir = path.join(claudeDir, "rules");
const settingsPath = path.join(claudeDir, "settings.json");
const cavemanConfigDir = path.join(os.homedir(), ".config", "caveman");
const cavemanConfigPath = path.join(cavemanConfigDir, "config.json");
const ponytailConfigDir = path.join(os.homedir(), ".config", "ponytail");
const ponytailConfigPath = path.join(ponytailConfigDir, "config.json");
const setupFlag = path.join(claudeDir, ".espresso-setup-done");
const ponytailDoneFlag = path.join(claudeDir, ".espresso-ponytail-done");

function readClaudeJson() {
  try {
    return JSON.parse(fs.readFileSync(claudeJsonPath, "utf8"));
  } catch (_) {
    return {};
  }
}

function writeClaudeJson(data) {
  fs.writeFileSync(claudeJsonPath, JSON.stringify(data, null, 2) + "\n");
}

const RULES = {
  "exa.md": [
    "ONLY use Exa MCP for internet search: `mcp__exa__web_search_exa`, `mcp__exa__get_code_context_exa`, `mcp__exa__company_research_exa`.",
    "NEVER use `WebFetch`, `WebSearch`, or the `websearch` agent.",
    "Exa is the ONLY web access tool. ALL sessions, ALL agents, ALL contexts.",
    "Verify online before answering uncertain topics.",
  ].join("\n"),
  "git.md": [
    'NEVER add "Generated with Claude Code" signature.',
    'NEVER add "Co-Authored-By: Claude <noreply@anthropic.com>".',
    "Commit messages CLEAN — only the message, nothing else.",
    'Use `git commit -m "message"` format only.',
  ].join("\n"),
  "gitnexus.md": [
    "When GitNexus is configured in a project, ALWAYS use GitNexus MCP tools FIRST for code exploration.",
    "Use `gitnexus_query` for concepts and execution flows — NOT grep.",
    "Use `gitnexus_context` for symbol deep-dive (callers, callees, processes).",
    "Use `gitnexus_impact` BEFORE modifying any symbol.",
    "Use `gitnexus_detect_changes` BEFORE committing.",
    "Grep/find only as fallback when GitNexus has no indexed data.",
    "Applies to ALL agents, ALL subagents, ALL exploration tasks.",
  ].join("\n"),
  "project-rules-suggestion.md": [
    "When entering a project that has NO `.claude/rules/` directory, proactively suggest creating path-scoped rules based on the project's stack.",
    "Propose rules with `paths` frontmatter for each major area (backend, frontend, tests, infra).",
    "One concern per file. Descriptive filenames (e.g. `api-conventions.md`, not `rules1.md`).",
    "Do NOT create rules without asking — suggest first, implement on approval.",
  ].join("\n"),
  "subagent-model-economy.md": [
    "Every subagent spawn runs one tier BELOW the session model, enforced mechanically by the espresso model-ladder hook: fable->opus->sonnet->haiku->haiku.",
    "Pass the lower-tier `model` override explicitly when you spawn; the hook is the safety net, not a substitute.",
    "Two structural exemptions the hook handles: forks inherit the session model (the tool ignores overrides), and agent types that pin their own `model:` in `.claude/agents` frontmatter keep it.",
    "Going cheaper than the ladder tier is always allowed; never climb above it.",
    "Why: each tier down roughly halves cost per MTok. Fable 5 (claude-fable-5) is the top tier and the priciest, so it drains its quota fastest; a Fable session dispatching Opus workers is the single biggest win, and Opus or Sonnet sessions still gain. The orchestrator keeps the long context and synthesis; workers run bounded lots where the lower tier suffices.",
    "Applies to ALL sessions, agents, subagents.",
  ].join("\n"),
  "subagent-delegation.md": [
    "Offload the expensive tier onto workers. The model ladder hook drops every spawn one tier down (fable->opus->sonnet->haiku); this rule says WHEN to spawn.",
    "Delegate by default: code discovery/exploration, mechanical verification (lint, broad grep, verbose logs/tests), parallelizable work (N independent targets), and any task whose intermediate output is large but only the summary matters.",
    "Keep in session (the expensive tier): judgement, architecture, final synthesis, risky diffs (auth, billing, migrations, security), and trivial edits where spawn overhead beats the gain.",
    "Guardrails: one worker = one bounded task with a clear brief. Never call the same worker twice on the same unresolved question. Discovery first, judgement next.",
    "Applies to ALL sessions, agents, subagents.",
  ].join("\n"),
};

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (_) {
    return {};
  }
}

function writeSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

function run() {
  const installed = [];
  const skipped = [];
  const optional = [];

  // 1. Rules
  fs.mkdirSync(rulesDir, { recursive: true });
  for (const [name, content] of Object.entries(RULES)) {
    const filePath = path.join(rulesDir, name);
    if (fs.existsSync(filePath)) {
      skipped.push(`rules/${name} (exists)`);
    } else {
      fs.writeFileSync(filePath, content + "\n", { mode: 0o644 });
      installed.push(`rules/${name}`);
    }
  }

  // 2. RTK
  let rtkFound = false;
  try {
    execSync("which rtk", { stdio: "pipe" });
    rtkFound = true;
  } catch (_) {}

  if (rtkFound) {
    const settings = readSettings();
    if (!settings.hooks) settings.hooks = {};

    let hasRtk = false;
    for (const entries of Object.values(settings.hooks)) {
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          const hooks = entry.hooks || [];
          if (hooks.some((h) => h.command && h.command.includes("rtk"))) {
            hasRtk = true;
            break;
          }
        }
      }
      if (hasRtk) break;
    }

    if (hasRtk) {
      skipped.push("RTK hook (exists)");
    } else {
      if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];
      settings.hooks.PreToolUse.push({
        matcher: "Bash",
        hooks: [{ type: "command", command: "rtk hook claude", timeout: 10 }],
      });
      writeSettings(settings);
      installed.push("RTK PreToolUse hook");
    }
  } else {
    optional.push("RTK (60-90% CLI savings): brew install rtk-ai/tap/rtk");
  }

  // 3. Caveman
  const settingsNow = readSettings();
  const ep = settingsNow.enabledPlugins || {};
  const cavemanInstalled = ep["caveman@caveman"] === true;

  if (cavemanInstalled) {
    let needsConfig = true;
    try {
      const config = JSON.parse(fs.readFileSync(cavemanConfigPath, "utf8"));
      if (config.defaultMode === "ultra") {
        skipped.push("Caveman ultra (already configured)");
        needsConfig = false;
      }
    } catch (_) {}

    if (needsConfig) {
      fs.mkdirSync(cavemanConfigDir, { recursive: true });
      fs.writeFileSync(cavemanConfigPath, '{"defaultMode": "ultra"}\n');
      installed.push("Caveman → ultra default");
    }
  } else {
    optional.push(
      "Caveman (75% savings): /install-plugin JuliusBrussee/caveman",
    );
  }

  // 4. GitNexus
  let gnBin = "";
  try {
    gnBin = execSync("which gitnexus", { stdio: "pipe" }).toString().trim();
  } catch (_) {}

  if (gnBin) {
    const cj = readClaudeJson();
    if (!cj.mcpServers) cj.mcpServers = {};

    if (cj.mcpServers.gitnexus) {
      skipped.push("GitNexus MCP (exists)");
    } else {
      cj.mcpServers.gitnexus = { command: gnBin, args: ["mcp"] };
      writeClaudeJson(cj);
      installed.push("GitNexus MCP server");
    }

    const s = readSettings();
    if (!s.hooks) s.hooks = {};
    let hasGnStop = false;
    for (const entry of s.hooks.Stop || []) {
      for (const h of entry.hooks || []) {
        if (h.command && h.command.includes("gitnexus")) {
          hasGnStop = true;
          break;
        }
      }
      if (hasGnStop) break;
    }

    if (hasGnStop) {
      skipped.push("GitNexus auto-reindex hook (exists)");
    } else {
      if (!s.hooks.Stop) s.hooks.Stop = [];
      s.hooks.Stop.push({
        hooks: [
          {
            type: "command",
            command:
              "(npx gitnexus status 2>&1 | grep -q 'not indexed' && npx gitnexus analyze --silent) || true",
            timeout: 30,
          },
        ],
      });
      writeSettings(s);
      installed.push("GitNexus auto-reindex (Stop hook)");
    }
  } else {
    optional.push("GitNexus (code intelligence): npm install -g gitnexus");
  }

  // Write setup flag
  fs.writeFileSync(setupFlag, new Date().toISOString());

  // Output summary
  const lines = ["Espresso stack configured:"];
  if (installed.length) lines.push("  Installed: " + installed.join(", "));
  if (skipped.length) lines.push("  Skipped: " + skipped.join(", "));
  if (optional.length) {
    lines.push("  Optional:");
    optional.forEach((o) => lines.push("    → " + o));
  }
  return lines.join("\n");
}

// Installs the real DietrichGebert/ponytail plugin (same commands a user runs),
// then pins its default mode. Own marker so update users get it too, even after
// the main setup flag already exists. Runs once.
function ensurePonytail() {
  if (fs.existsSync(ponytailDoneFlag)) return "";

  const ep = readSettings().enabledPlugins || {};
  const out = [];

  if (ep["ponytail@ponytail"] === true) {
    out.push("Ponytail plugin (already installed)");
  } else {
    let claudeBin = false;
    try {
      execSync("which claude", { stdio: "pipe" });
      claudeBin = true;
    } catch (_) {}

    if (claudeBin) {
      try {
        execSync("claude plugin marketplace add DietrichGebert/ponytail", {
          stdio: "pipe",
        });
        execSync("claude plugin install ponytail@ponytail", { stdio: "pipe" });
        out.push("Ponytail plugin installed (restart to activate)");
      } catch (_) {
        out.push(
          "Ponytail: /plugin marketplace add DietrichGebert/ponytail then /plugin install ponytail@ponytail",
        );
      }
    } else {
      out.push(
        "Ponytail: /plugin marketplace add DietrichGebert/ponytail then /plugin install ponytail@ponytail",
      );
    }
  }

  // Ponytail's SessionStart hook reads this on next launch.
  try {
    let needsConfig = true;
    try {
      if (JSON.parse(fs.readFileSync(ponytailConfigPath, "utf8")).defaultMode)
        needsConfig = false;
    } catch (_) {}
    if (needsConfig) {
      fs.mkdirSync(ponytailConfigDir, { recursive: true });
      fs.writeFileSync(ponytailConfigPath, '{"defaultMode": "ultra"}\n');
      out.push("Ponytail → ultra default");
    }
  } catch (_) {}

  try {
    fs.writeFileSync(ponytailDoneFlag, new Date().toISOString());
  } catch (_) {}
  return out.length ? "Ponytail companion:\n  " + out.join("\n  ") : "";
}

// Export for use by activate hook, or run directly
if (require.main === module) {
  console.log(run());
  console.log(ensurePonytail());
} else {
  module.exports = { run, setupFlag, ensurePonytail };
}
