// Optional adapter: CALLS pbakaus/impeccable (Apache-2.0) as an external CLI.
// Nothing from impeccable is vendored or copied; we only read its --json output.
// `npx --no-install` means we never download it for you: install it yourself to enable.
import { runCommand, extractJson } from "./run.js";
import { trunc } from "../checks/util.js";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/** npm ships npx-cli.js next to node on Windows installs. */
export function findNpxCli(execPath = process.execPath, exists = existsSync) {
  const p = join(dirname(execPath), "node_modules", "npm", "bin", "npx-cli.js");
  return exists(p) ? p : null;
}

export const IMPECCABLE_SOURCE =
  "pbakaus/impeccable (Apache-2.0), called via npx, not vendored";
const SAFE_URL = /^https?:\/\/[A-Za-z0-9._~:/?#=@+,-]+$/;

function sev(s) {
  const v = String(s || "").toLowerCase();
  if (/error|high|fail|critical|major/.test(v)) return "high";
  if (/warn|medium|moderate/.test(v)) return "medium";
  return "low";
}

/** Map impeccable JSON (array or {findings|issues|results|violations}) to our finding rows, one per rule. */
export function mapImpeccable(json) {
  const list = Array.isArray(json)
    ? json
    : (json &&
        (json.findings ||
          json.issues ||
          json.results ||
          json.violations ||
          json.antipatterns)) ||
      [];
  if (!Array.isArray(list)) return [];
  const byRule = new Map();
  for (const f of list) {
    if (!f || typeof f !== "object") continue;
    const rule = String(
      f.rule || f.ruleId || f.id || f.name || f.type || "unknown",
    )
      .replace(/[^\w.-]+/g, "-")
      .toLowerCase();
    const row = byRule.get(rule) || { count: 0, first: f };
    row.count++;
    byRule.set(rule, row);
  }
  return [...byRule.entries()].map(([rule, { count, first }]) => ({
    id: `impeccable.${rule}`,
    group: "design",
    severity: sev(first.severity || first.level || first.tier),
    effort: 2,
    title: trunc(
      first.message ||
        first.description ||
        first.title ||
        `impeccable rule ${rule}`,
      100,
    ),
    status: "fail",
    evidence: `${count} hit(s)${first.selector || first.location || first.file ? `, e.g. ${trunc(first.selector || first.location || first.file, 50)}` : ""}`,
    fix: trunc(
      first.fix ||
        first.suggestion ||
        `See impeccable's guidance for rule "${rule}" (npx impeccable detect --list-rules).`,
      140,
    ),
    source: IMPECCABLE_SOURCE,
  }));
}

export async function runImpeccable(
  url,
  {
    runner = runCommand,
    timeoutMs = 90000,
    platform = process.platform,
    npxCli = findNpxCli(),
  } = {},
) {
  if (!SAFE_URL.test(url))
    return {
      status: "degraded",
      note: "design: partial (impeccable skipped: URL has characters we will not pass to a shell)",
      findings: [],
    };
  const args = ["--no-install", "impeccable", "detect", url, "--json"];
  let res;
  if (platform !== "win32") {
    res = await runner("npx", args, { timeoutMs });
  } else if (npxCli) {
    // Windows: run npm's npx-cli.js with node directly, so no shell is involved.
    res = await runner(process.execPath, [npxCli, ...args], { timeoutMs });
  } else {
    // Last resort: the npx.cmd shim needs a shell; the URL was validated above.
    res = await runner("npx.cmd", args, { timeoutMs, shell: true });
  }
  if (res.error === "timeout")
    return {
      status: "degraded",
      note: `design: partial (impeccable timed out after ${Math.round(timeoutMs / 1000)}s)`,
      findings: [],
    };
  if (res.error)
    return {
      status: "degraded",
      note: `design: partial (impeccable not available: ${res.error}). Install it with npm i -g impeccable to add its 62 rules.`,
      findings: [],
    };
  const json = extractJson(res.stdout);
  if (!json) {
    return {
      status: "degraded",
      note: `design: partial (impeccable not available or produced no JSON, exit ${res.code}). Install it with npm i -g impeccable to add its 62 rules.`,
      findings: [],
    };
  }
  const findings = mapImpeccable(json);
  return {
    status: "ok",
    note: `design: impeccable ran (${findings.length} rule(s) flagged)`,
    findings,
  };
}
