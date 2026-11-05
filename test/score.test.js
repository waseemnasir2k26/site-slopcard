import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { scan } from "../src/scan.js";
import { score, gradeFor, topFixes, GROUP_WEIGHTS } from "../src/score.js";
import { GROUPS } from "../src/rules.js";

const fx = (p) => fileURLToPath(new URL(`../examples/${p}`, import.meta.url));
const bad = await scan({
  file: fx("bad-site/index.html"),
  now: "2026-11-05T00:00:00.000Z",
});
const good = await scan({
  file: fx("good-site/index.html"),
  now: "2026-11-05T00:00:00.000Z",
});

test("bad-site scores below 60", () => {
  assert.ok(bad.score.overall < 60, `got ${bad.score.overall}`);
});

test("bad-site has at least one finding in every group", () => {
  for (const g of GROUPS)
    assert.ok(
      bad.findings.some((f) => f.group === g),
      `no ${g} finding`,
    );
});

test("good-site scores 85 or more", () => {
  assert.ok(good.score.overall >= 85, `got ${good.score.overall}`);
});

test("weights are design 30 / seo 20 / aeo 20 / security 15 / leads 15", () => {
  assert.deepEqual(GROUP_WEIGHTS, {
    design: 30,
    seo: 20,
    aeo: 20,
    security: 15,
    leads: 15,
  });
});

test("grade boundaries", () => {
  assert.equal(gradeFor(100), "A");
  assert.equal(gradeFor(90), "A");
  assert.equal(gradeFor(89), "B");
  assert.equal(gradeFor(80), "B");
  assert.equal(gradeFor(70), "C");
  assert.equal(gradeFor(60), "D");
  assert.equal(gradeFor(59), "F");
  assert.equal(gradeFor(0), "F");
});

test("n/a rules are excluded and an all-n/a group is skipped in the overall", () => {
  const s = score([
    { group: "seo", severity: "high", status: "pass" },
    { group: "seo", severity: "low", status: "fail" },
    { group: "security", severity: "high", status: "na" },
  ]);
  assert.equal(s.groups.seo.score, Math.round((5 / 6) * 100));
  assert.equal(s.groups.security.score, null);
  assert.equal(s.groups.security.grade, "n/a");
  assert.equal(s.overall, s.groups.seo.score);
});

test("top fixes: at most 5, ranked by impact/effort", () => {
  const t = topFixes(bad.results, 5);
  assert.ok(t.length <= 5 && t.length > 0);
  for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].rank >= t[i].rank);
  assert.equal(bad.topFixes.length, 5);
});

test("report shape: every finding has id, group, severity, evidence, fix, source", () => {
  for (const f of bad.findings)
    for (const k of ["id", "group", "severity", "evidence", "fix", "source"])
      assert.ok(f[k], `${f.id} missing ${k}`);
});

test("offline mode never makes a request", () => {
  assert.equal(bad.requests.length, 0);
});
