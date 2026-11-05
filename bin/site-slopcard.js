#!/usr/bin/env node
import { main } from "../src/cli.js";
import { scrub } from "../src/redact.js";

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`site-slopcard: ${scrub(String(err && err.message))}\n`);
    process.exitCode = 2;
  },
);
