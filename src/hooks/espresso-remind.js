#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.espresso-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim().toLowerCase();

    if (prompt === '/espresso off' || prompt === '/espresso stop') {
      try { fs.unlinkSync(flagPath); } catch (_) {}
      return;
    }

    if (prompt === '/espresso' || prompt === '/espresso on') {
      try {
        fs.writeFileSync(flagPath, 'on', { mode: 0o600 });
      } catch (_) {}
    }

    let active = false;
    try {
      const st = fs.lstatSync(flagPath);
      active = st.isFile() && !st.isSymbolicLink();
    } catch (_) {}

    if (active) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext:
            "ESPRESSO MODE ACTIVE. " +
            "Max 120 chars/line. Bullet points default. No filler/hedging/pleasantries. " +
            "Result first. No recap. No code comments. Fragments OK."
        }
      }));
    }
  } catch (_) {}
});
