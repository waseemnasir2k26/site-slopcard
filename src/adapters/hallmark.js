// Optional adapter: runs Nutlope/hallmark's sloplint (MIT) from a checkout YOU supply
// (--hallmark <dir>) against a saved HTML snapshot. Nothing is vendored.
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { runCommand, extractJson } from "./run.js";
import { trunc } from "../checks/util.js";

export const HALLMARK_SOURCE =
  "Nutlope/hallmark (MIT) sloplint, run from your own checkout";
const GRADE_SEV = { FAIL: "high", REFLEX: "medium", WARN: "low" };

export function sloplintPath(dir) {
  return join(dir, "skills", "hallmark", "scripts", "sloplint.mjs");
}

export function mapHallmark(json) {
  const list = json && Array.isArray(json.findings) ? json.findings : [];
  const byGate = new Map();
  for (const f of list) {
    const gate = String(f.gate || "gate")
      .replace(/[^\w.-]+/g, "-")
      .toLowerCase();
    const row = byGate.get(gate) || { count: 0, first: f };
    row.count++;
    byGate.set(gate, row);
  }
  return [...byGate.entries()].map(([gate, { count, first }]) => ({
    id: `hallmark.${gate}`,
    group: "design",
    severity: GRADE_SEV[String(first.grade || "").toUpperCase()] || "low",
    effort: 2,
    title: `hallmark ${String(first.grade || "WARN").toUpperCase()}: ${gate}`,
    status: "fail",
    evidence: `${count} hit(s)${first.evidence ? `, e.g. ${trunc(first.evidence, 60)}` : ""}`,
    fix: trunc(first.fix || "See hallmark references/gates.md", 140),
    source: HALLMARK_SOURCE,
  }));
}

export async function runHallmark(
  dir,
  snapshotPath,
  { runner = runCommand, timeoutMs = 90000, exists = existsSync } = {},
) {
  const script = sloplintPath(dir);
  if (!exists(script))
    return {
      status: "degraded",
      note: `hallmark skipped: ${script} not found`,
      findings: [],
    };
  const res = await runner(process.execPath, [script, snapshotPath, "--json"], {
    timeoutMs,
    cwd: dirname(snapshotPath),
  });
  if (res.error)
    return {
      status: "degraded",
      note: `hallmark skipped: ${res.error}`,
      findings: [],
    };
  const json = extractJson(res.stdout);
  if (!json)
    return {
      status: "degraded",
      note: `hallmark produced no JSON (exit ${res.code})`,
      findings: [],
    };
  const findings = mapHallmark(json);
  return {
    status: "ok",
    note: `hallmark sloplint ran (${findings.length} gate(s) flagged)`,
    findings,
  };
}
