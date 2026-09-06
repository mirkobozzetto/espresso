#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { lowerModel } = require("../core.cjs");

try {
  const input = JSON.parse(fs.readFileSync(0, "utf8"));
  if (input.hook_event_name !== "PreToolUse") process.exit(0);
  const ti = input.tool_input;
  if (!ti || typeof ti !== "object" || ti.model) process.exit(0);
  const type = ti.subagent_type || ti.agent_type;
  // Custom agents and explicit models are deliberate choices, never override them.
  if (type && !["general-purpose", "default", "espresso-worker"].includes(type)) process.exit(0);
  const home = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  if (fs.existsSync(path.join(home, ".espresso-ladder-off"))) process.exit(0);
  let model = input.model;
  if (!model && input.transcript_path) {
    const fd = fs.openSync(input.transcript_path, "r");
    try {
      const size = fs.fstatSync(fd).size;
      const buffer = Buffer.alloc(Math.min(size, 262144));
      fs.readSync(fd, buffer, 0, buffer.length, size - buffer.length);
      for (const line of buffer.toString("utf8").split("\n").reverse()) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === "assistant" && entry.message?.model) {
            model = entry.message.model;
            break;
          }
        } catch { /* A tail read can start in the middle of a JSONL record. */ }
      }
    } finally { fs.closeSync(fd); }
  }
  const target = lowerModel(model);
  if (!target || target === model) process.exit(0);
  // Codex does not expose a per-spawn model field. Route only its named worker.
  if (input.tool_name === "spawn_agent") process.exit(0);
  process.stdout.write(JSON.stringify({hookSpecificOutput: {
    hookEventName: "PreToolUse", updatedInput: {...ti, model: target},
  }}));
} catch (error) {
  process.stderr.write(`Espresso routing: ${error.message}\n`);
  process.exitCode = 1;
}
