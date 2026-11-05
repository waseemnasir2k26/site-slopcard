// Fake keys must never appear in full in html, md, json or stdout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { main } from "../src/cli.js";
import { findSecrets, scrub, redactValue } from "../src/redact.js";

const BAD = fileURLToPath(
  new URL("../examples/bad-site/index.html", import.meta.url),
);
const html = await readFile(BAD, "utf8");
const FAKES = [...html.matchAll(/"((?:sk-|AIza|xoxb-)[^"]+)"/g)].map(
  (m) => m[1],
);

test("the bad-site fixture really contains three fake key shapes", () => {
  assert.equal(FAKES.length, 3);
  assert.ok(FAKES.some((k) => k.startsWith("sk-")));
  assert.ok(FAKES.some((k) => k.startsWith("AIza")));
  assert.ok(FAKES.some((k) => k.startsWith("xoxb-")));
});

for (const flag of [[], ["--json"]]) {
  test(`no fake key appears in full in any output ${flag.join(" ") || "(summary)"}`, async () => {
    const out = await mkdtemp(join(tmpdir(), "slopcard-test-"));
    try {
      let stdout = "";
      const io = {
        stdout: {
          write: (s) => {
            stdout += s;
          },
        },
        stderr: { write: () => {} },
      };
      const code = await main(["--file", BAD, "--out", out, ...flag], io);
      assert.equal(code, 0);
      const files = await Promise.all(
        ["report.html", "report.md", "report.json"].map((f) =>
          readFile(join(out, f), "utf8"),
        ),
      );
      for (const k of FAKES) {
        for (const [i, text] of [stdout, ...files].entries())
          assert.ok(!text.includes(k), `full key leaked in output #${i}`);
      }
      assert.match(files[1], /sk-F…\(\d+ chars\)/);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });
}

test("findSecrets returns redacted values only", () => {
  const hits = findSecrets(html);
  assert.equal(hits.length, 3);
  for (const h of hits)
    for (const k of FAKES) assert.ok(!h.redacted.includes(k));
});

test("redactValue keeps 4 chars plus the length", () => {
  assert.equal(redactValue("abcdefghij"), "abcd…(10 chars)");
});

test("scrub removes secret shapes from arbitrary text", () => {
  const k = "ghp_" + "A".repeat(36);
  const s = scrub(`token ${k} end`);
  assert.ok(!s.includes(k));
  assert.match(s, /ghp_…\(40 chars\)/);
});

test("scrub catches AWS key ids and private key headers", () => {
  const aws = "AKIA" + "Z".repeat(16);
  assert.ok(!scrub(aws).includes(aws));
  assert.ok(
    !scrub("-----BEGIN PRIVATE KEY-----").includes("BEGIN PRIVATE KEY"),
  );
});
