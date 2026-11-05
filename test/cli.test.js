import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { main, parseArgs } from "../src/cli.js";
import { scan } from "../src/scan.js";
import { renderMarkdown, renderJson } from "../src/report/md.js";
import { renderHtml } from "../src/report/html.js";
import { compareReports, headline } from "../src/report/compare.js";

const fx = (p) => fileURLToPath(new URL(`../examples/${p}`, import.meta.url));
const io = () => {
  const o = { out: "", err: "" };
  o.io = {
    stdout: {
      write: (s) => {
        o.out += s;
      },
    },
    stderr: {
      write: (s) => {
        o.err += s;
      },
    },
  };
  return o;
};
const FIXED = "2026-11-05T00:00:00.000Z";

test("parseArgs reads every flag", () => {
  const o = parseArgs([
    "https://x.test",
    "--out",
    "o",
    "--json",
    "--no-impeccable",
    "--hallmark",
    "h",
    "--client",
    "Acme Dental",
    "--brand-color",
    "#123456",
    "--fail-under",
    "80",
  ]);
  assert.deepEqual(o.positional, ["https://x.test"]);
  assert.equal(o.out, "o");
  assert.equal(o.json, true);
  assert.equal(o.impeccable, false);
  assert.equal(o.hallmark, "h");
  assert.equal(o.client, "Acme Dental");
  assert.equal(o.brandColor, "#123456");
  assert.equal(o.failUnder, 80);
});

test("parseArgs rejects unknown flags, bad colours and missing values", () => {
  assert.throws(() => parseArgs(["--nope"]), /Unknown option/);
  assert.throws(() => parseArgs(["--brand-color", "red"]), /hex/);
  assert.throws(() => parseArgs(["--out"]), /needs a value/);
  assert.throws(() => parseArgs(["--fail-under", "x"]), /number/);
});

test("--help prints usage with the safety line", async () => {
  const o = io();
  assert.equal(await main(["--help"], o.io), 0);
  assert.match(o.out, /Only scan sites you own or have permission to audit/);
});

test("exit code is 0 by default even for an F", async () => {
  const out = await mkdtemp(join(tmpdir(), "slopcard-"));
  const o = io();
  try {
    assert.equal(
      await main(["--file", fx("bad-site/index.html"), "--out", out], o.io),
      0,
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
  assert.match(o.out, /Grade F/);
});

test("--fail-under exits 1 when the score is below N, 0 when above", async () => {
  const out = await mkdtemp(join(tmpdir(), "slopcard-"));
  try {
    assert.equal(
      await main(
        [
          "--file",
          fx("bad-site/index.html"),
          "--out",
          out,
          "--fail-under",
          "80",
        ],
        io().io,
      ),
      1,
    );
    assert.equal(
      await main(
        [
          "--file",
          fx("good-site/index.html"),
          "--out",
          out,
          "--fail-under",
          "80",
        ],
        io().io,
      ),
      0,
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("writes report.html, report.md and report.json", async () => {
  const out = await mkdtemp(join(tmpdir(), "slopcard-"));
  try {
    await main(
      [
        "--file",
        fx("bad-site/index.html"),
        "--out",
        out,
        "--client",
        "Acme <Dental>",
        "--brand-color",
        "#336699",
      ],
      io().io,
    );
    const h = await readFile(join(out, "report.html"), "utf8");
    assert.match(
      h,
      /Prepared for <b>Acme &lt;Dental&gt;<\/b>/,
      "client name is escaped",
    );
    assert.match(h, /--brand:#336699/);
    assert.equal(
      (h.match(/Generated with <a/g) || []).length,
      1,
      "exactly one footer credit link",
    );
    const j = JSON.parse(await readFile(join(out, "report.json"), "utf8"));
    assert.equal(j.client, "Acme <Dental>");
    assert.match(
      await readFile(join(out, "report.md"), "utf8"),
      /^# Site Report Card/,
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("HTML report escapes hostile evidence", () => {
  const r = {
    tool: { name: "site-slopcard", version: "1", url: "u" },
    target: "<script>alert(1)</script>",
    generatedAt: FIXED,
    score: {
      overall: 50,
      grade: "F",
      groups: Object.fromEntries(
        ["design", "seo", "aeo", "security", "leads"].map((g) => [
          g,
          { score: 50, grade: "F", weight: 20, passed: 0, failed: 1, na: 0 },
        ]),
      ),
    },
    topFixes: [],
    findings: [
      {
        id: "x",
        group: "seo",
        severity: "low",
        title: "<img onerror=x>",
        evidence: '"><script>',
        fix: "f",
        source: "s",
      },
    ],
    results: [],
    notes: [],
  };
  const h = renderHtml(r);
  assert.ok(!h.includes("<script>alert"));
  assert.ok(!h.includes("<img onerror"));
});

test('compare: delta card "F x -> A y" and lists fixed checks', async () => {
  const bad = await scan({
    file: fx("bad-site/index.html"),
    now: FIXED,
    displayTarget: "demo",
  });
  const good = await scan({
    file: fx("good-site/index.html"),
    now: FIXED,
    displayTarget: "demo",
  });
  const c = compareReports(bad, good);
  assert.match(headline(c), /^F \d+ -> A \d+ \(\+\d+\)$/);
  assert.ok(c.fixed.length > 10);
  assert.equal(c.target, "demo");
  const out = await mkdtemp(join(tmpdir(), "slopcard-"));
  try {
    await writeFile(join(out, "b.json"), renderJson(bad));
    await writeFile(join(out, "a.json"), renderJson(good));
    const o = io();
    assert.equal(
      await main(
        ["compare", join(out, "b.json"), join(out, "a.json"), "--out", out],
        o.io,
      ),
      0,
    );
    assert.match(o.out, /^F \d+ -> A \d+/);
    assert.match(
      await readFile(join(out, "compare.html"), "utf8"),
      /Before and after/,
    );
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("snapshot: examples/sample-out/report.md matches a fresh render (LF pinned)", async () => {
  const report = await scan({
    file: fx("bad-site/index.html"),
    now: FIXED,
    displayTarget: "examples/bad-site/index.html",
  });
  const fresh = renderMarkdown(report);
  const saved = await readFile(fx("sample-out/report.md"), "utf8");
  assert.ok(!saved.includes("\r"), "sample-out/report.md must be LF only");
  assert.equal(fresh, saved);
});
