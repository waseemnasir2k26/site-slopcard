import { designRules } from "./checks/design.js";
import { seoRules } from "./checks/seo.js";
import { aeoRules } from "./checks/aeo.js";
import { securityRules } from "./checks/security.js";
import { leadRules } from "./checks/leads.js";

export const RULES = [
  ...designRules,
  ...seoRules,
  ...aeoRules,
  ...securityRules,
  ...leadRules,
];
export const GROUPS = ["design", "seo", "aeo", "security", "leads"];

/** Run one rule safely. Returns a result row. */
export function runRule(rule, ctx) {
  let out;
  try {
    out = rule.check(ctx);
  } catch (err) {
    out = "na";
  }
  const base = {
    id: rule.id,
    group: rule.group,
    severity: rule.severity,
    effort: rule.effort,
    title: rule.title,
    source: rule.source,
  };
  if (out === true) return { ...base, status: "pass" };
  if (out === "na") return { ...base, status: "na" };
  return {
    ...base,
    status: "fail",
    evidence: out && out.evidence ? out.evidence : "failed",
    fix: rule.fix,
  };
}

export function runRules(ctx, rules = RULES) {
  return rules.map((r) => runRule(r, ctx));
}
