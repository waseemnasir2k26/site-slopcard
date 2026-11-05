import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { scan, VERSION } from "./scan.js";
import { renderHtml } from "./report/html.js";
import { renderMarkdown, renderJson } from "./report/md.js";
import {
  compareReports,
  renderCompareHtml,
  renderCompareMarkdown,
  headline,
} from "./report/compare.js";
import { GROUPS } from "./rules.js";
import { GROUP_LABELS } from "./score.js";
import { scrub } from "./redact.js";

export const HELP = `site-slopcard ${VERSION}: one-page Site Report Card (A-F) for a URL

Usage
  site-slopcard <url> [options]
  site-slopcard --file <index.html> [options]       offline mode (no network)
  site-slopcard compare <before.json> <after.json> [--out dir]

Options
  --out <dir>            where report.html / report.md / report.json go (default ./slopcard-out)
  --json                 print the JSON report to stdout instead of the summary
  --with-impeccable      also run the impeccable detector (opt-in). It launches its own
                         browser OUTSIDE our 1 req/s, same-origin and robots.txt limits
  --allow-private        allow scanning private/loopback/link-local addresses
  --hallmark <dir>       also run hallmark's sloplint from your local checkout
  --client "Name"        white-label: "Prepared for Name"
  --brand-color #hex     white-label accent colour
  --fail-under <N>       exit 1 when the score is below N (for CI)
  -h, --help             show this help
  -v, --version          print the version

Passive and read-only: GET/HEAD only, same-origin, robots.txt respected, 1 request per second
(--with-impeccable is the exception: that tool runs its own browser).
Only scan sites you own or have permission to audit.
`;

export function parseArgs(argv) {
  const o = { positional: [], impeccable: false, out: "slopcard-out" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === "--out") o.out = val();
    else if (a === "--json") o.json = true;
    else if (a === "--with-impeccable") o.impeccable = true;
    else if (a === "--allow-private") o.allowPrivate = true;
    else if (a === "--hallmark") o.hallmark = val();
    else if (a === "--client") o.client = val();
    else if (a === "--brand-color") o.brandColor = val();
    else if (a === "--fail-under") {
      o.failUnder = Number(val());
      if (!Number.isFinite(o.failUnder))
        throw new Error("--fail-under needs a number");
    } else if (a === "--file") o.file = val();
    else if (a === "-h" || a === "--help") o.help = true;
    else if (a === "-v" || a === "--version") o.version = true;
    else if (a.startsWith("--"))
      throw new Error(`Unknown option ${a} (see --help)`);
    else o.positional.push(a);
  }
  if (o.brandColor && !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(o.brandColor))
    throw new Error("--brand-color must be a hex colour like #0f5c55");
  return o;
}

export function summary(report) {
  const s = report.score;
  const L = [`${report.target}`, `Grade ${s.grade}  ${s.overall}/100`];
  for (const g of GROUPS) {
    const r = s.groups[g];
    L.push(
      `  ${GROUP_LABELS[g].padEnd(24)} ${String(r.score ?? "n/a").padStart(3)}  ${r.grade}`,
    );
  }
  if (report.topFixes.length) {
    L.push("Top fixes:");
    report.topFixes.forEach((f, i) =>
      L.push(`  ${i + 1}. ${f.title}: ${f.evidence}`),
    );
  }
  for (const n of report.notes) L.push(`note: ${n}`);
  return scrub(L.join("\n")) + "\n";
}

export async function main(
  argv,
  io = { stdout: process.stdout, stderr: process.stderr },
  deps = {},
) {
  const o = parseArgs(argv);
  if (o.help) {
    io.stdout.write(HELP);
    return 0;
  }
  if (o.version) {
    io.stdout.write(VERSION + "\n");
    return 0;
  }

  if (o.positional[0] === "compare") {
    const [, b, a] = o.positional;
    if (!b || !a) throw new Error("compare needs <before.json> <after.json>");
    const c = compareReports(
      JSON.parse(await readFile(b, "utf8")),
      JSON.parse(await readFile(a, "utf8")),
    );
    const out = resolve(o.out);
    await mkdir(out, { recursive: true }).catch((e) => {
      if (e.code !== "EEXIST") throw e;
    });
    await writeFile(join(out, "compare.html"), renderCompareHtml(c));
    await writeFile(join(out, "compare.md"), renderCompareMarkdown(c));
    io.stdout.write(`${headline(c)}\nwrote ${join(out, "compare.html")}\n`);
    return 0;
  }

  if (!o.file && !o.positional[0]) {
    io.stdout.write(HELP);
    return 2;
  }
  const report = await scan({
    url: o.positional[0],
    file: o.file,
    impeccable: o.impeccable,
    allowPrivate: o.allowPrivate,
    hallmark: o.hallmark,
    client: o.client,
    brandColor: o.brandColor,
    ...deps,
  });
  const out = resolve(o.out);
  await mkdir(out, { recursive: true }).catch((e) => {
    if (e.code !== "EEXIST") throw e;
  });
  await writeFile(join(out, "report.html"), renderHtml(report));
  await writeFile(join(out, "report.md"), renderMarkdown(report));
  await writeFile(join(out, "report.json"), renderJson(report));
  if (o.json) io.stdout.write(renderJson(report));
  else
    io.stdout.write(
      summary(report) + `wrote ${join(out, "report.html")} (+ .md, .json)\n`,
    );

  if (o.failUnder != null && report.score.overall < o.failUnder) {
    io.stderr.write(
      `site-slopcard: score ${report.score.overall} is under --fail-under ${o.failUnder}\n`,
    );
    return 1;
  }
  return 0;
}
