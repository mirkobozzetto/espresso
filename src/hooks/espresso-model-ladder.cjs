#!/usr/bin/env node
// Espresso model ladder: every Agent/Task spawn runs one tier BELOW the session
// model, mechanically. Cuts cost-per-token AND preserves the scarce quota of the
// expensive tier (Opus/Fable windows are capped).
//   fable -> opus -> sonnet -> haiku -> haiku
// Exemptions: forks (tool ignores overrides), agent types that pin their own model
// in .claude/agents frontmatter, and calls already asking for a tier <= the ladder
// tier (going cheaper is always allowed).
//
// Default ON. Disable by creating the flag file: <claudeDir>/.espresso-ladder-off
// Claude Code only (reads the JSONL transcript + PreToolUse Agent|Task). On other
// agents the hook simply never fires.
//
// Wired via plugin.json on two events:
//   SessionStart: caches the session model (when provided) for later lookups.
//   PreToolUse (matcher Agent|Task): rewrites tool_input.model via updatedInput.

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const claudeDir =
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const OFF_FLAG = path.join(claudeDir, ".espresso-ladder-off");
const CACHE_DIR = path.join(claudeDir, ".espresso-model-cache");
const RANK = { haiku: 1, sonnet: 2, opus: 3, fable: 4 };
const LADDER = {
  fable: "opus",
  opus: "sonnet",
  sonnet: "haiku",
  haiku: "haiku",
};

function tierOf(modelId) {
  if (!modelId || typeof modelId !== "string") return null;
  const m = modelId.toLowerCase();
  for (const t of ["fable", "opus", "sonnet", "haiku"])
    if (m.includes(t)) return t;
  return null;
}

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function cachePath(sessionId) {
  return path.join(CACHE_DIR, String(sessionId || "unknown"));
}

function cacheModel(sessionId, model) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath(sessionId), model);
  } catch {
    /* cache is best-effort */
  }
}

// The transcript is JSONL; the freshest assistant entry carries the live model,
// which also tracks a mid-session /model switch (the SessionStart cache cannot).
function modelFromTranscript(transcriptPath) {
  try {
    const raw = fs.readFileSync(transcriptPath, "utf8");
    const lines = raw.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line.includes('"model"')) continue;
      try {
        const entry = JSON.parse(line);
        const model = entry?.message?.model || entry?.model;
        if (typeof model === "string" && model.startsWith("claude-"))
          return model;
      } catch {
        /* skip unparseable line */
      }
    }
  } catch {
    /* no transcript yet */
  }
  return null;
}

// An agent type that pins its own model in frontmatter keeps it (deliberate choice).
function agentTypePinsModel(subagentType, cwd) {
  if (!subagentType) return false;
  const name = subagentType.includes(":")
    ? subagentType.split(":").pop()
    : subagentType;
  const candidates = [
    cwd && path.join(cwd, ".claude", "agents", `${name}.md`),
    path.join(claudeDir, "agents", `${name}.md`),
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      const head = fs.readFileSync(p, "utf8").slice(0, 2000);
      const fm = head.split("---")[1] || "";
      if (/^\s*model\s*:\s*\S+/m.test(fm)) return true;
    } catch {
      /* not found here */
    }
  }
  return false;
}

function main() {
  if (fs.existsSync(OFF_FLAG)) return;

  const input = readStdin();
  if (!input) return;

  if (input.hook_event_name === "SessionStart") {
    if (input.model) cacheModel(input.session_id, String(input.model));
    return;
  }

  // PreToolUse on Agent/Task
  const ti = input.tool_input || {};
  if (ti.subagent_type === "fork") return;
  if (agentTypePinsModel(ti.subagent_type, input.cwd)) return;

  const sessionModel =
    modelFromTranscript(input.transcript_path) ||
    (() => {
      try {
        return fs.readFileSync(cachePath(input.session_id), "utf8").trim();
      } catch {
        return null;
      }
    })();
  const sessionTier = tierOf(sessionModel);
  if (!sessionTier) return; // cannot resolve: stay out of the way

  // Read-only exploration never needs reasoning: floor it at haiku, not one tier.
  const EXPLORE_TYPES = new Set(["Explore"]);
  const target = EXPLORE_TYPES.has(ti.subagent_type)
    ? "haiku"
    : LADDER[sessionTier];
  const requested = tierOf(ti.model);
  // already at or below the ladder tier: cheaper is always fine
  if (requested && RANK[requested] <= RANK[target]) return;

  // updatedInput REPLACES tool_input wholesale (no merge): echo the full input back
  // with only the model overridden, or the spawn loses prompt/description and fails.
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        updatedInput: { ...ti, model: target },
      },
    }),
  );
}

main();
