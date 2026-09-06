#!/usr/bin/env node
"use strict";
const { POLICY } = require("../core.cjs");
// No installation, global flags or companion configuration during startup.
process.stdout.write(POLICY + "\n");
