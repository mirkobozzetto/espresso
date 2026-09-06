"use strict";

const POLICY = "Be concise without omitting necessary explanations, uncertainty, evidence, security or useful code comments. Lead with the result; avoid filler and repetition. Preserve the user's language and accents. Prefer the smallest correct change and targeted checks. Do not delegate trivial tasks or spawn workers without authorization. Never claim measured savings without measurements. Active skills own their workflow: Arsenal selects skills; Ship or the selected skill retains approval gates, solo flags, specialized agents and models, output schemas, artifact states, verification and commit rules. These override Espresso recommendations, including automatic delegation. Never add a competing team or reviewer. Never use an external worker to bypass a controlled runtime. These workflows remain independent of Espresso.";
const GPT = ["gpt-6-astra", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"];
const CLAUDE = ["fable", "opus", "sonnet", "haiku"];

function lowerModel(model, available) {
  if (typeof model !== "string") return null;
  const slash = model.indexOf("/");
  const provider = slash < 0 ? "" : model.slice(0, slash + 1);
  const id = slash < 0 ? model : model.slice(slash + 1);
  const index = GPT.indexOf(id);
  if (index >= 0) {
    const target = provider + GPT[Math.min(index + 1, GPT.length - 1)];
    return !available || available.includes(target) ? target : null;
  }
  const tier = CLAUDE.findIndex(t => id === t || id.startsWith(`claude-${t}-`));
  if (tier < 0) return null;
  const next = CLAUDE[Math.min(tier + 1, CLAUDE.length - 1)];
  if (!available) return provider ? null : next;
  return available.find(m => m.startsWith(provider + `claude-${next}-`)) || null;
}

function rewriteCommand(command) {
  // Only simple read-only Git commands: preserve raw diffs, errors and scripts.
  if (typeof command !== "string" || !/^(?:git status(?: --short| --branch| -s| -b)*|git log --oneline(?: -[0-9]+| --max-count=[0-9]+)?)$/.test(command)) return null;
  const result = require("node:child_process").spawnSync("rtk", ["rewrite", command], {
    encoding: "utf8", timeout: 1000, windowsHide: true,
  });
  const rewritten = result.stdout?.trim();
  return result.status === 0 && rewritten?.startsWith("rtk git ") ? rewritten : null;
}

module.exports = { POLICY, GPT, lowerModel, rewriteCommand };
