// Weights: design 30 / seo 20 / aeo 20 / security 15 / leads 15 -> 0-100 -> A-F
import { SEVERITY_WEIGHT } from "./checks/util.js";
import { GROUPS } from "./rules.js";

export const GROUP_WEIGHTS = {
  design: 30,
  seo: 20,
  aeo: 20,
  security: 15,
  leads: 15,
};
export const GROUP_LABELS = {
  design: "Design (AI-slop tells)",
  seo: "SEO basics",
  aeo: "AEO / AI answers",
  security: "Security headers",
  leads: "Lead capture",
};

export function gradeFor(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * results: rows from runRules (+ adapter findings with status 'fail').
 * Returns { overall, grade, groups: { [g]: { score, grade, passed, failed, na, weight } } }
 */
export function score(results) {
  const groups = {};
  let weighted = 0;
  let weightSum = 0;
  for (const g of GROUPS) {
    const rows = results.filter((r) => r.group === g);
    const applicable = rows.filter((r) => r.status !== "na");
    const total = applicable.reduce(
      (s, r) => s + (SEVERITY_WEIGHT[r.severity] || 1),
      0,
    );
    const got = applicable
      .filter((r) => r.status === "pass" || r.status === "warn")
      .reduce(
        (s, r) =>
          s +
          (SEVERITY_WEIGHT[r.severity] || 1) * (r.status === "warn" ? 0.5 : 1),
        0,
      );
    const gs = total ? Math.round((got / total) * 100) : null;
    groups[g] = {
      score: gs,
      grade: gs == null ? "n/a" : gradeFor(gs),
      passed: applicable.filter((r) => r.status === "pass").length,
      warned: applicable.filter((r) => r.status === "warn").length,
      failed: applicable.filter((r) => r.status === "fail").length,
      na: rows.length - applicable.length,
      weight: GROUP_WEIGHTS[g],
    };
    if (gs != null) {
      weighted += gs * GROUP_WEIGHTS[g];
      weightSum += GROUP_WEIGHTS[g];
    }
  }
  const overall = weightSum ? Math.round(weighted / weightSum) : 0;
  return { overall, grade: gradeFor(overall), groups };
}

/** Top N fixes ranked by impact (severity x group weight) / effort. */
export function topFixes(results, n = 5) {
  return results
    .filter((r) => r.status === "fail")
    .map((r) => ({
      ...r,
      rank:
        ((SEVERITY_WEIGHT[r.severity] || 1) * (GROUP_WEIGHTS[r.group] || 10)) /
        (r.effort || 1),
    }))
    .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id))
    .slice(0, n);
}
