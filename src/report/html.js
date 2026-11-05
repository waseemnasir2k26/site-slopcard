// One-page printable report card. Light theme, print-to-PDF friendly, no external assets.
import { GROUPS } from "../rules.js";
import { GROUP_LABELS } from "../score.js";
import { scrub } from "../redact.js";

export const DEFAULT_BRAND = "#0f5c55";
export const GRADE_COLORS = {
  A: "#15803d",
  B: "#4d7c0f",
  C: "#b45309",
  D: "#c2410c",
  F: "#b91c1c",
  "n/a": "#6b7280",
};

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const safeColor = (c) =>
  /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(c || "")) ? c : DEFAULT_BRAND;

export const BASE_CSS = `
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#f4f2ee;color:#1d1d1b;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.page{max-width:860px;margin:24px auto;background:#fff;border:1px solid #e3dfd7;padding:36px 40px 28px}
h1,h2,.grade{font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif}
h1{font-size:28px;line-height:1.15;margin:0 0 6px}
h2{font-size:19px;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--brand)}
.top{display:flex;gap:28px;align-items:center;justify-content:space-between;border-bottom:1px solid #e3dfd7;padding-bottom:22px}
.meta{color:#55524c;font-size:13px}
.meta b{color:#1d1d1b}
.target{word-break:break-all;font-weight:600;color:var(--brand)}
.grade{flex:none;width:132px;height:132px;border-radius:50%;border:6px solid var(--g);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--g)}
.grade .l{font-size:64px;font-weight:700;line-height:1}
.grade .n{font-size:15px;color:#55524c;font-family:system-ui,sans-serif}
.bars{display:grid;grid-template-columns:190px 1fr 46px 34px;gap:8px 12px;align-items:center;margin-top:6px}
.bar{height:12px;background:#eeebe5;border-radius:6px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--brand)}
.num{text-align:right;font-variant-numeric:tabular-nums}
.gl{font-weight:700;text-align:center}
ol.fixes{margin:0;padding-left:22px}
ol.fixes li{margin:0 0 10px}
ol.fixes .why{color:#55524c;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid #eeebe5}
th{color:#55524c;font-weight:600}
.sev{font-weight:600;white-space:nowrap}
.sev.high{color:#b91c1c}.sev.medium{color:#b45309}.sev.low{color:#55524c}
code{font-size:11.5px;color:#55524c}
.notes{color:#55524c;font-size:12.5px;padding-left:18px}
footer{margin-top:26px;padding-top:12px;border-top:1px solid #e3dfd7;color:#6b675f;font-size:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
footer a{color:var(--brand)}
@media (max-width:640px){.page{margin:0;padding:22px 16px;border:0}.top{flex-direction:column-reverse;align-items:flex-start}.bars{grid-template-columns:1fr 1fr 40px 28px}}
@media print{body{background:#fff}.page{margin:0;border:0;max-width:none;padding:0 4px}h2{break-after:avoid}tr,li{break-inside:avoid}}
`;

export function footer(report) {
  return `<footer><span>Generated with <a href="${esc(report.tool.url)}">site-slopcard</a> ${esc(report.tool.version)}. Passive, read-only checks.</span><span>Only scan sites you own or have permission to audit.</span></footer>`;
}

export function renderHtml(report) {
  const s = report.score;
  const brand = safeColor(report.brandColor);
  const g = GRADE_COLORS[s.grade];
  const bars = GROUPS.map((k) => {
    const r = s.groups[k];
    const w = r.score == null ? 0 : r.score;
    return `<div>${esc(GROUP_LABELS[k])} <span class="meta">(${r.weight}%)</span></div><div class="bar"><i style="width:${w}%"></i></div><div class="num">${r.score ?? "n/a"}</div><div class="gl" style="color:${GRADE_COLORS[r.grade]}">${esc(r.grade)}</div>`;
  }).join("\n");
  const fixes = report.topFixes.length
    ? `<ol class="fixes">${report.topFixes.map((f) => `<li><b>${esc(f.fix)}</b><div class="why">${esc(f.title)} · ${esc(GROUP_LABELS[f.group] || f.group)} · ${esc(f.severity)}. Found: ${esc(f.evidence)}</div></li>`).join("")}</ol>`
    : "<p>Nothing to fix. Nice work.</p>";
  const rows = report.findings
    .map(
      (f) =>
        `<tr><td>${esc(GROUP_LABELS[f.group] || f.group)}</td><td class="sev ${esc(f.severity)}">${esc(f.severity)}</td><td>${esc(f.title)}<br><code>${esc(f.id)}</code></td><td>${esc(f.evidence)}</td></tr>`,
    )
    .join("\n");
  const client = report.client
    ? `<div class="meta">Prepared for <b>${esc(report.client)}</b></div>`
    : "";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site Report Card: ${esc(report.target)}</title>
<style>:root{--brand:${brand};--g:${g}}${BASE_CSS}</style>
</head>
<body>
<main class="page">
<section class="top">
<div>
<h1>Site Report Card</h1>
<div class="target">${esc(report.target)}</div>
${client}
<div class="meta">${esc(String(report.generatedAt).slice(0, 10))} · ${report.findings.length} issue(s) across ${report.results.length} checks</div>
</div>
<div class="grade" role="img" aria-label="Grade ${esc(s.grade)}, ${s.overall} out of 100"><span class="l">${esc(s.grade)}</span><span class="n">${s.overall}/100</span></div>
</section>
<h2>Scores by area</h2>
<div class="bars">${bars}</div>
<h2>Fix these first</h2>
${fixes}
<h2>Every finding</h2>
${rows ? `<table><thead><tr><th>Area</th><th>Severity</th><th>Check</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table>` : "<p>No issues found.</p>"}
${report.notes && report.notes.length ? `<h2>Notes</h2><ul class="notes">${report.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
${footer(report)}
</main>
</body>
</html>
`;
  return scrub(html);
}
