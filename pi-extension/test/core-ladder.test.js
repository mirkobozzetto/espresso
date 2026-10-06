import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { lowerModel } = require("../../src/core.cjs");

// A real pi catalog lists legacy models before current ones, so picking the
// first match sent claude-opus-5 down to claude-sonnet-4-5.
const CATALOG = [
  "anthropic/claude-fable-5",
  "anthropic/claude-fable-5-1",
  "anthropic/claude-haiku-4-5",
  "anthropic/claude-opus-4-5",
  "anthropic/claude-opus-4-8",
  "anthropic/claude-opus-5",
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-sonnet-4-6",
  "anthropic/claude-sonnet-5",
];

test("claude ladder picks the newest model of the next tier", () => {
  assert.equal(lowerModel("anthropic/claude-fable-5-1", CATALOG), "anthropic/claude-opus-5");
  assert.equal(lowerModel("anthropic/claude-opus-5", CATALOG), "anthropic/claude-sonnet-5");
  assert.equal(lowerModel("anthropic/claude-sonnet-5", CATALOG), "anthropic/claude-haiku-4-5");
});

test("claude ladder compares numerically, not lexicographically", () => {
  const future = [...CATALOG, "anthropic/claude-sonnet-10"];
  assert.equal(lowerModel("anthropic/claude-opus-5", future), "anthropic/claude-sonnet-10");
});

test("claude ladder floors at the last tier and needs an available target", () => {
  assert.equal(lowerModel("anthropic/claude-haiku-4-5", CATALOG), "anthropic/claude-haiku-4-5");
  assert.equal(lowerModel("anthropic/claude-opus-5", ["anthropic/claude-opus-5"]), null);
});

test("gpt ladder is unaffected by the claude fix", () => {
  const gpt = [
    "openai-codex/gpt-6-astra",
    "openai-codex/gpt-5.6-sol",
    "openai-codex/gpt-5.6-terra",
    "openai-codex/gpt-5.6-luna",
  ];
  assert.equal(lowerModel("openai-codex/gpt-6-astra", gpt), "openai-codex/gpt-5.6-sol");
  assert.equal(lowerModel("openai-codex/gpt-5.6-luna", gpt), "openai-codex/gpt-5.6-luna");
});
