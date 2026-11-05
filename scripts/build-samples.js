// Regenerates examples/sample-out/ deterministically (fixed date, offline).
// Run: npm run sample
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { scan } from "../src/scan.js";
import { renderHtml } from "../src/report/html.js";
import { renderMarkdown, renderJson } from "../src/report/md.js";
import {
  compareReports,
  renderCompareHtml,
  renderCompareMarkdown,
  headline,
} from "../src/report/compare.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const now = "2026-11-05T00:00:00.000Z";
const out = join(root, "examples", "sample-out");

async function write(dir, report) {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "report.html"), renderHtml(report));
  await writeFile(join(dir, "report.md"), renderMarkdown(report));
  await writeFile(join(dir, "report.json"), renderJson(report));
}

const bad = await scan({
  file: join(root, "examples/bad-site/index.html"),
  now,
  displayTarget: "examples/bad-site/index.html",
});
const good = await scan({
  file: join(root, "examples/good-site/index.html"),
  now,
  displayTarget: "examples/good-site/index.html",
  client: "Harbour Lane Plumbing",
});
await write(out, bad);
await write(join(out, "after"), good);
const c = compareReports(bad, good);
await writeFile(join(out, "compare.html"), renderCompareHtml(c));
await writeFile(join(out, "compare.md"), renderCompareMarkdown(c));
console.log(
  `bad ${bad.score.grade} ${bad.score.overall} | good ${good.score.grade} ${good.score.overall} | ${headline(c)}`,
);
