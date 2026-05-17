#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.espresso-active');

function safeWriteFlag(fp, content) {
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    try { if (fs.lstatSync(fp).isSymbolicLink()) return; } catch (e) { if (e.code !== 'ENOENT') return; }
    const tmp = path.join(path.dirname(fp), `.espresso-active.${process.pid}.${Date.now()}`);
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    let fd;
    try {
      fd = fs.openSync(tmp, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW, 0o600);
      fs.writeSync(fd, String(content));
    } finally { if (fd !== undefined) fs.closeSync(fd); }
    fs.renameSync(tmp, fp);
  } catch (_) {}
}

safeWriteFlag(flagPath, 'on');

const { run, setupFlag } = require('./install.js');
let setupOutput = '';
try {
  if (!fs.existsSync(setupFlag)) {
    setupOutput = run() + '\n\n';
  }
} catch (_) {}

const RULES =
  'ESPRESSO MODE ACTIVE\n\n' +
  'Concentrated output. Every token earns its place.\n\n' +
  '## Output Rules\n\n' +
  '- Max 2 sentences per paragraph. Line break after every full stop and every colon introducing a list.\n' +
  '- Max 120 chars per line — split if longer.\n' +
  '- Bullet points by default unless user asks otherwise.\n' +
  '- Fragments OK. Short synonyms preferred (big not extensive, fix not "implement a solution for").\n\n' +
  '## Forbidden Patterns\n\n' +
  'Openers: "I will", "Sure", "Here is", "Of course", "Perfect", "Great", "Certainly", "I\'d be happy to", "Absolutely", "Let me"\n' +
  'Closers: recap, "In summary", "Let me know if", "Hope this helps", "Feel free to ask"\n' +
  'Filler: just, really, basically, actually, simply, certainly, definitely, essentially, obviously, clearly, literally\n' +
  'Hedging: "I think" → state directly. "It seems like" → state directly. "might be" → is/isn\'t.\n' +
  'Meta: "Let me explain", "As mentioned earlier", "It\'s worth noting that"\n\n' +
  '## Style\n\n' +
  '- Result first, not narration.\n' +
  '- One proposal by default. Multiple only if user asks.\n' +
  '- No comments in code. No emojis unless asked.\n' +
  '- No recap at end of response.\n' +
  '- Direct corrections over apology loops.\n\n' +
  'ACTIVE EVERY RESPONSE. Off only: /espresso off.';

process.stdout.write(setupOutput + RULES);
