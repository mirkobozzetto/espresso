#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { GPT, POLICY } = require("../core.cjs");

function run(args = process.argv.slice(2)) {
  const [harness, ...flags] = args;
  if (!["omp", "pi", "codex"].includes(harness) || flags.some(f => f !== "--apply")) {
    throw new Error("Usage: node src/hooks/install.js omp|pi|codex [--apply]. Without --apply, only show planned files.");
  }
  const apply = flags.includes("--apply");
  const root = path.resolve(__dirname, "../..");
  const home = os.homedir();
  const config = harness === "omp" ? process.env.PI_CODING_AGENT_DIR || path.join(home, ".omp/agent")
    : harness === "pi" ? process.env.PI_CODING_AGENT_DIR || path.join(home, ".pi/agent")
    : process.env.CODEX_HOME || path.join(home, ".codex");
  const files = [[path.join(config, "skills/espresso/SKILL.md"), fs.readFileSync(path.join(root, "skills/espresso/SKILL.md"), "utf8")]];
  if (harness !== "codex") {
    files.push([path.join(config, "extensions/espresso.ts"), `export { default } from ${JSON.stringify(path.join(root, "src/extension.ts"))};\n`]);
  }
  for (const model of GPT.slice(1)) {
    const name = `espresso-${model.split("-").pop()}`;
    const prompt = `${POLICY}\nExecute only the bounded assignment. Do not spawn further agents. Report the result, evidence and unresolved limits.`;
    if (harness === "omp") files.push([path.join(config, `agents/${name}.md`),
      `---\nname: ${name}\ndescription: Explicit Espresso worker using ${model}.\nmodel: openai-codex/${model}\nthinking-level: medium\nspawns: []\n---\n${prompt}\n`]);
    if (harness === "codex") files.push([path.join(config, `agents/${name}.toml`),
      `name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(`Explicit Espresso worker using ${model}.`)}\nmodel = ${JSON.stringify(model)}\nmodel_reasoning_effort = "medium"\ndeveloper_instructions = ${JSON.stringify(prompt)}\n`]);
  }
  // Preflight all conflicts before any writes. User settings and credentials stay untouched.
  for (const [file, content] of files) {
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8") !== content) throw new Error(`Existing file differs; refusing overwrite: ${file}`);
  }
  if (apply) for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    if (!fs.existsSync(file)) fs.writeFileSync(file, content, {flag: "wx", mode: 0o600});
  }
  return JSON.stringify({apply, harness, files: files.map(([file]) => file), restart: apply}, null, 2);
}
if (require.main === module) {
  try { console.log(run()); } catch (error) { console.error(error.message); process.exitCode = 1; }
} else module.exports = {run};
