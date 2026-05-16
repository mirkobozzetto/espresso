#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.espresso-active');

function safeWriteFlag(flagPath, content) {
  try {
    const dir = path.dirname(flagPath);
    fs.mkdirSync(dir, { recursive: true });

    try {
      if (fs.lstatSync(flagPath).isSymbolicLink()) return;
    } catch (e) {
      if (e.code !== 'ENOENT') return;
    }

    const tempPath = path.join(dir, `.espresso-active.${process.pid}.${Date.now()}`);
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW;
    let fd;
    try {
      fd = fs.openSync(tempPath, flags, 0o600);
      fs.writeSync(fd, String(content));
      try { fs.fchmodSync(fd, 0o600); } catch (_) {}
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
    fs.renameSync(tempPath, flagPath);
  } catch (_) {}
}

safeWriteFlag(flagPath, 'on');

let skillContent = '';
try {
  skillContent = fs.readFileSync(
    path.join(__dirname, '..', '..', 'skills', 'espresso', 'SKILL.md'), 'utf8'
  );
} catch (_) {}

let output;

if (skillContent) {
  const body = skillContent.replace(/^---[\s\S]*?---\s*/, '');
  output = 'ESPRESSO MODE ACTIVE\n\n' + body;
} else {
  output =
    'ESPRESSO MODE ACTIVE\n\n' +
    'Concentrated output. Zero fluff, max power per token.\n\n' +
    '## Output Rules\n\n' +
    '- Max 2 sentences per paragraph. Line break after every full stop.\n' +
    '- Max 120 chars per line — split if longer.\n' +
    '- Bullet points by default unless user asks otherwise.\n' +
    '- Fragments OK. Short synonyms preferred.\n\n' +
    '## Forbidden Patterns\n\n' +
    '- Openers: "I will", "Sure", "Here is", "Of course", "Perfect", "Great", "Certainly"\n' +
    '- Closers: recap, "In summary", "Let me know if"\n' +
    '- Filler: just, really, basically, actually, simply, certainly\n' +
    '- Hedging: "I think", "It seems like", "It appears that"\n' +
    '- Meta-commentary: "Let me explain", "As mentioned"\n\n' +
    '## Communication Style\n\n' +
    '- Result first, not narration. Lead with the answer.\n' +
    '- One proposal by default. Multiple only if asked.\n' +
    '- No comments in code. No emojis unless asked.\n' +
    '- No recap or summary at end of response.';
}

process.stdout.write(output);
