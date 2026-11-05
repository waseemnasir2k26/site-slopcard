// Before/after delta card: "F 34 -> A 94".
import { GROUPS } from "../rules.js";
import { GROUP_LABELS } from "../score.js";
import { scrub } from "../redact.js";
import { esc, safeColor, BASE_CSS, GRADE_COLORS, footer } from "./html.js";

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const grade = (g) =>
  Object.prototype.hasOwnProperty.call(GRADE_COLORS, g) ? g : "n/a";
const cell = (v) => (v == null ? "n/a" : String(num(v)));

export function compareReports(before, after) {
  const ids = (r) => new Set(r.findings.map((f) => f.id));
  const b = ids(before),
    a = ids(after);
  return {
    target:
      after.target === before.target
        ? after.target
        : `${before.target} -> ${after.target}`,
    before: {
      grade: grade(before.score.grade),
      overall: num(before.score.overall),
      generatedAt: before.generatedAt,
    },
    after: {
      grade: grade(after.score.grade),
      overall: num(after.score.overall),
      generatedAt: after.generatedAt,
    },
    delta: num(after.score.overall) - num(before.score.overall),
    groups: Object.fromEntries(
      GROUPS.map((g) => [
        g,
        {
          before: before.score.groups[g].score ?? null,
          after: after.score.groups[g].score ?? null,
        },
      ]),
    ),
    fixed: before.findings
      .filter((f) => !a.has(f.id))
      .map((f) => ({ id: f.id, title: f.title })),
    introduced: after.findings
      .filter((f) => !b.has(f.id))
      .map((f) => ({ id: f.id, title: f.title })),
    client: after.client || before.client || null,
    brandColor: after.brandColor || before.brandColor || null,
    tool: after.tool,
  };
}

export const headline = (c) =>
  `${c.before.grade} ${c.before.overall} -> ${c.after.grade} ${c.after.overall} (${c.delta >= 0 ? "+" : ""}${c.delta})`;

export function renderCompareMarkdown(c) {
  const L = [
    `# Before / after: ${c.target}`,
    "",
    `**${headline(c)}**`,
    "",
    "| Area | Before | After |",
    "|---|---:|---:|",
  ];
  for (const g of GROUPS)
    L.push(
      `| ${GROUP_LABELS[g]} | ${cell(c.groups[g].before)} | ${cell(c.groups[g].after)} |`,
    );
  L.push("", `## Fixed (${c.fixed.length})`, "");
  for (const f of c.fixed) L.push(`- \`${f.id}\` ${f.title}`);
  if (c.introduced.length) {
    L.push("", `## New issues (${c.introduced.length})`, "");
    for (const f of c.introduced) L.push(`- \`${f.id}\` ${f.title}`);
  }
  L.push("", "---", "", `Generated with [site-slopcard](${c.tool.url}).`, "");
  return scrub(L.join("\n"));
}

export function renderCompareHtml(c) {
  const brand = safeColor(c.brandColor);
  const card = (x, label) =>
    `<div class="grade" style="--g:${GRADE_COLORS[grade(x.grade)]}"><span class="l">${esc(x.grade)}</span><span class="n">${esc(num(x.overall))}/100</span><span class="n">${label}</span></div>`;
  const rows = GROUPS.map(
    (g) =>
      `<tr><td>${esc(GROUP_LABELS[g])}</td><td class="num">${esc(cell(c.groups[g].before))}</td><td class="num"><b>${esc(cell(c.groups[g].after))}</b></td></tr>`,
  ).join("");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Before and after: ${esc(c.target)}</title>
<style>:root{--brand:${brand}}${BASE_CSS}.vs{display:flex;align-items:center;justify-content:center;gap:34px;margin:22px 0 8px}.arrow{font-size:40px;color:var(--brand)}.delta{text-align:center;font-size:18px;font-weight:700;color:var(--brand)}</style>
</head>
<body>
<main class="page">
<h1>Before and after</h1>
<div class="target">${esc(c.target)}</div>
${c.client ? `<div class="meta">Prepared for <b>${esc(c.client)}</b></div>` : ""}
<div class="vs">${card(c.before, "before")}<span class="arrow" aria-hidden="true">&rarr;</span>${card(c.after, "after")}</div>
<div class="delta">${c.delta >= 0 ? "+" : ""}${esc(num(c.delta))} points · ${c.fixed.length} issue(s) fixed</div>
<h2>Scores by area</h2>
<table><thead><tr><th>Area</th><th class="num">Before</th><th class="num">After</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Fixed</h2>
<ul>${c.fixed.map((f) => `<li>${esc(f.title)} <code>${esc(f.id)}</code></li>`).join("") || "<li>None</li>"}</ul>
${c.introduced.length ? `<h2>New issues</h2><ul>${c.introduced.map((f) => `<li>${esc(f.title)} <code>${esc(f.id)}</code></li>`).join("")}</ul>` : ""}
${footer({ tool: c.tool })}
</main>
</body>
</html>
`;
  return scrub(html);
}
