#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const rulesDir = path.join(claudeDir, 'rules');
const settingsPath = path.join(claudeDir, 'settings.json');
const cavemanConfigDir = path.join(os.homedir(), '.config', 'caveman');
const cavemanConfigPath = path.join(cavemanConfigDir, 'config.json');
const setupFlag = path.join(claudeDir, '.espresso-setup-done');

const RULES = {
  'exa.md': [
    'ONLY use Exa MCP for internet search: `mcp__exa__web_search_exa`, `mcp__exa__get_code_context_exa`, `mcp__exa__company_research_exa`.',
    'NEVER use `WebFetch`, `WebSearch`, or the `websearch` agent.',
    'Exa is the ONLY web access tool. ALL sessions, ALL agents, ALL contexts.',
    'Verify online before answering uncertain topics.',
  ].join('\n'),
  'git.md': [
    'NEVER add "Generated with Claude Code" signature.',
    'NEVER add "Co-Authored-By: Claude <noreply@anthropic.com>".',
    'Commit messages CLEAN — only the message, nothing else.',
    'Use `git commit -m "message"` format only.',
  ].join('\n'),
  'gitnexus.md': [
    'When GitNexus is configured in a project, ALWAYS use GitNexus MCP tools FIRST for code exploration.',
    'Use `gitnexus_query` for concepts and execution flows — NOT grep.',
    'Use `gitnexus_context` for symbol deep-dive (callers, callees, processes).',
    'Use `gitnexus_impact` BEFORE modifying any symbol.',
    'Use `gitnexus_detect_changes` BEFORE committing.',
    'Grep/find only as fallback when GitNexus has no indexed data.',
    'Applies to ALL agents, ALL subagents, ALL exploration tasks.',
  ].join('\n'),
  'project-rules-suggestion.md': [
    'When entering a project that has NO `.claude/rules/` directory, proactively suggest creating path-scoped rules based on the project\'s stack.',
    'Propose rules with `paths` frontmatter for each major area (backend, frontend, tests, infra).',
    'One concern per file. Descriptive filenames (e.g. `api-conventions.md`, not `rules1.md`).',
    'Do NOT create rules without asking — suggest first, implement on approval.',
  ].join('\n'),
};

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (_) {
    return {};
  }
}

function writeSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
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
      fs.writeFileSync(filePath, content + '\n', { mode: 0o644 });
      installed.push(`rules/${name}`);
    }
  }

  // 2. RTK
  let rtkFound = false;
  try {
    execSync('which rtk', { stdio: 'pipe' });
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
          if (hooks.some(h => h.command && h.command.includes('rtk'))) {
            hasRtk = true;
            break;
          }
        }
      }
      if (hasRtk) break;
    }

    if (hasRtk) {
      skipped.push('RTK hook (exists)');
    } else {
      if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];
      settings.hooks.PreToolUse.push({
        matcher: 'Bash',
        hooks: [{ type: 'command', command: 'rtk hook claude', timeout: 10 }],
      });
      writeSettings(settings);
      installed.push('RTK PreToolUse hook');
    }
  } else {
    optional.push('RTK (60-90% CLI savings): brew install rtk-ai/tap/rtk');
  }

  // 3. Caveman
  const settingsNow = readSettings();
  const ep = settingsNow.enabledPlugins || {};
  const cavemanInstalled = ep['caveman@caveman'] === true;

  if (cavemanInstalled) {
    let needsConfig = true;
    try {
      const config = JSON.parse(fs.readFileSync(cavemanConfigPath, 'utf8'));
      if (config.defaultMode === 'ultra') {
        skipped.push('Caveman ultra (already configured)');
        needsConfig = false;
      }
    } catch (_) {}

    if (needsConfig) {
      fs.mkdirSync(cavemanConfigDir, { recursive: true });
      fs.writeFileSync(cavemanConfigPath, '{"defaultMode": "ultra"}\n');
      installed.push('Caveman → ultra default');
    }
  } else {
    optional.push('Caveman (75% savings): /install-plugin JuliusBrussee/caveman');
  }

  // Write setup flag
  fs.writeFileSync(setupFlag, new Date().toISOString());

  // Output summary
  const lines = ['Espresso stack configured:'];
  if (installed.length) lines.push('  Installed: ' + installed.join(', '));
  if (skipped.length) lines.push('  Skipped: ' + skipped.join(', '));
  if (optional.length) {
    lines.push('  Optional:');
    optional.forEach(o => lines.push('    → ' + o));
  }
  return lines.join('\n');
}

// Export for use by activate hook, or run directly
if (require.main === module) {
  console.log(run());
} else {
  module.exports = { run, setupFlag };
}
