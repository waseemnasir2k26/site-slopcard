import { GROUPS } from "../rules.js";
import { GROUP_LABELS } from "../score.js";
import { scrub } from "../redact.js";

const esc = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");

export function renderMarkdown(report) {
  const L = [];
  const s = report.score;
  L.push(`# Site Report Card: ${esc(report.target)}`);
  L.push("");
  L.push(
    `**Grade ${s.grade} (${s.overall}/100)** · generated ${String(report.generatedAt).slice(0, 10)} · ${report.tool.name} ${report.tool.version}`,
  );
  if (report.client) L.push(`\nPrepared for: **${esc(report.client)}**`);
  L.push("");
  L.push("| Area | Weight | Score | Grade | Passed | Failed | n/a |");
  L.push("|---|---:|---:|:---:|---:|---:|---:|");
  for (const g of GROUPS) {
    const r = s.groups[g];
    L.push(
      `| ${GROUP_LABELS[g]} | ${r.weight} | ${r.score ?? "n/a"} | ${r.grade} | ${r.passed} | ${r.failed} | ${r.na} |`,
    );
  }
  L.push("");
  L.push("## Top 5 fixes");
  L.push("");
  if (!report.topFixes.length) L.push("Nothing to fix. Nice work.");
  report.topFixes.forEach((f, i) => {
    L.push(
      `${i + 1}. **${esc(f.title)}** (${f.group}, ${f.severity}): ${esc(f.evidence)}`,
    );
    L.push(`   Fix: ${esc(f.fix)}`);
  });
  L.push("");
  L.push("## All findings");
  for (const g of GROUPS) {
    const rows = report.findings.filter((f) => f.group === g);
    L.push("");
    L.push(`### ${GROUP_LABELS[g]} (${rows.length})`);
    L.push("");
    if (!rows.length) {
      L.push("No issues found.");
      continue;
    }
    for (const f of rows) {
      L.push(
        `- [${f.severity}] \`${f.id}\` ${esc(f.title)}: ${esc(f.evidence)}`,
      );
      L.push(`  - Fix: ${esc(f.fix)}`);
      L.push(`  - Source: ${esc(f.source)}`);
    }
  }
  if (report.notes && report.notes.length) {
    L.push("");
    L.push("## Notes");
    L.push("");
    for (const n of report.notes) L.push(`- ${esc(n)}`);
  }
  L.push("");
  L.push("---");
  L.push("");
  L.push(
    `Generated with [site-slopcard](${report.tool.url}). Only scan sites you own or have permission to audit.`,
  );
  L.push("");
  return scrub(L.join("\n"));
}

export function renderJson(report) {
  return scrub(JSON.stringify(report, null, 2)) + "\n";
}
