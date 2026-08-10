#!/usr/bin/env node

import { runCLI } from '../dist/index.js';

runCLI().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
