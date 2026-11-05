// Orchestrates one scan: gather inputs (URL or local file) -> ctx -> rules -> adapters -> report object.
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { isIP } from "node:net";
import { dirname, join, resolve, relative, isAbsolute, sep } from "node:path";
import { tmpdir } from "node:os";
import { createFetcher, isSameSiteHop, USER_AGENT, REPO_URL } from "./fetch.js";
import { parseRobots, isAllowed } from "./robots.js";
import { buildContext } from "./context.js";
import { findTags } from "./html.js";
import { runRules, RULES } from "./rules.js";
import { score, topFixes } from "./score.js";
import { assertPublicHost } from "./netguard.js";
import { runImpeccable } from "./adapters/impeccable.js";
import { runHallmark } from "./adapters/hallmark.js";

export const VERSION = "1.0.1";
const MAX_CSS = 3;
const MAX_FORM_PROBES = 2;

export function normaliseUrl(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("No URL given");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!/^https?:$/.test(u.protocol))
    throw new Error(`Only http(s) URLs can be scanned, got ${u.protocol}`);
  u.hash = "";
  return u.href;
}

async function getText(fetcher, url) {
  try {
    const r = await fetcher.get(url);
    if (
      r.status >= 200 &&
      r.status < 300 &&
      r.body &&
      !/^\s*<(!doctype|html)/i.test(r.body)
    )
      return r.body;
    return null;
  } catch {
    return null;
  }
}

/** Gather everything for a live URL. Polite: ~6-9 requests total, 1 per second. */
export async function gatherUrl(
  inputUrl,
  {
    fetchImpl,
    minIntervalMs = 1000,
    timeoutMs = 10000,
    probeForms = true,
    allowPrivate = false,
    lookup,
  } = {},
) {
  let url = normaliseUrl(inputUrl);
  // Block private/loopback/metadata targets. With an injected fetchImpl (tests, no real
  // network) and no injected lookup we skip DNS; literal IPs are still checked.
  const guard = async (u) => {
    if (allowPrivate) return;
    if (fetchImpl && !lookup) {
      const h = new URL(u).hostname;
      if (!isIP(h.replace(/^\[|\]$/g, ""))) return;
    }
    await assertPublicHost(u, lookup);
  };
  await guard(url);
  const fetcher = createFetcher({
    origin: url,
    fetchImpl,
    minIntervalMs,
    timeoutMs,
  });
  const notes = [];

  const robotsFor = async (origin) =>
    getText(fetcher, new URL("/robots.txt", origin).href);
  let robotsTxt = await robotsFor(url);
  const checkRobots = (txt, target) => {
    if (txt == null) return;
    const u = new URL(target);
    if (!isAllowed(parseRobots(txt), "site-slopcard", u.pathname + u.search)) {
      throw new Error(
        `robots.txt disallows ${u.pathname} for site-slopcard; not scanning (we respect robots.txt).`,
      );
    }
  };
  checkRobots(robotsTxt, url);
  // Optional fetches (llms.txt, sitemap, CSS, form HEADs) honour robots.txt too: skip + note.
  const robotsBlocks = (target) => {
    if (robotsTxt == null) return false;
    const u = new URL(target);
    return !isAllowed(
      parseRobots(robotsTxt),
      "site-slopcard",
      u.pathname + u.search,
    );
  };
  const skipNote = (target) =>
    notes.push(
      `skipped ${new URL(target).pathname} (disallowed by robots.txt)`,
    );

  let page;
  for (let hop = 0; hop < 5; hop++) {
    page = await fetcher.get(url);
    if (page.status >= 300 && page.status < 400 && page.headers.location) {
      const next = new URL(page.headers.location, url).href;
      if (!isSameSiteHop(url, next))
        throw new Error(
          `Redirects off-site to ${new URL(next).origin}; scan that URL directly if you own it.`,
        );
      const changedOrigin = new URL(next).origin !== new URL(url).origin;
      if (changedOrigin) await guard(next);
      fetcher.allowOrigin(next);
      url = next;
      if (changedOrigin) robotsTxt = await robotsFor(url);
      // every hop target is checked, not just the first URL
      checkRobots(robotsTxt, url);
      continue;
    }
    break;
  }
  if (!page || page.status >= 400)
    throw new Error(`Page returned HTTP ${page ? page.status : "nothing"}`);
  if (page.status >= 300) throw new Error("Too many redirects");

  const origin = new URL(url).origin;
  const llmsUrl = new URL("/llms.txt", origin).href;
  let llmsTxt = null;
  if (robotsBlocks(llmsUrl)) skipNote(llmsUrl);
  else llmsTxt = await getText(fetcher, llmsUrl);
  const robots = robotsTxt ? parseRobots(robotsTxt) : null;
  const sitemapUrl =
    (robots &&
      robots.sitemaps.find((s) => fetcher.isAllowed(s) && !robotsBlocks(s))) ||
    new URL("/sitemap.xml", origin).href;
  let sitemapXml = null;
  if (robotsBlocks(sitemapUrl)) skipNote(sitemapUrl);
  else
    try {
      const sm = await fetcher.get(sitemapUrl);
      if (sm.status < 300 && /<(urlset|sitemapindex)\b/i.test(sm.body))
        sitemapXml = sm.body;
    } catch {}

  // Same-origin stylesheets only (max 3). Off-origin CSS is skipped, never fetched.
  let css = "";
  const sheets = findTags(page.body, "link")
    .map((t) => t.attrs)
    .filter((a) => /stylesheet/i.test(a.rel || "") && a.href);
  let fetched = 0;
  for (const s of sheets) {
    if (fetched >= MAX_CSS) break;
    let href;
    try {
      href = new URL(s.href, url).href;
    } catch {
      continue;
    }
    if (!fetcher.isAllowed(href)) continue;
    if (robotsBlocks(href)) {
      skipNote(href);
      continue;
    }
    try {
      const r = await fetcher.get(href);
      if (r.status < 300) css += "\n" + r.body;
      fetched++;
    } catch {}
  }

  // Form endpoints: HEAD only, same-origin only, never a submit.
  const formProbes = [];
  if (probeForms) {
    const forms = findTags(page.body, "form").map((t) => t.attrs);
    for (const f of forms.slice(0, MAX_FORM_PROBES)) {
      const action = (f.action || "").trim();
      if (!action || /^(#|javascript:|mailto:)/i.test(action)) continue;
      let target;
      try {
        target = new URL(action, url).href;
      } catch {
        continue;
      }
      if (!fetcher.isAllowed(target)) {
        formProbes.push({ url: target, skipped: "off-origin, not probed" });
        continue;
      }
      if (robotsBlocks(target)) {
        formProbes.push({
          url: target,
          skipped: "disallowed by robots.txt, not probed",
        });
        continue;
      }
      try {
        const r = await fetcher.head(target);
        formProbes.push({ url: target, status: r.status });
      } catch (err) {
        formProbes.push({ url: target, error: err.message });
      }
    }
  }

  return {
    input: {
      url,
      mode: "url",
      html: page.body,
      headers: page.headers,
      status: page.status,
      css,
      robotsTxt,
      llmsTxt,
      sitemapXml,
      formProbes,
    },
    requests: fetcher.log,
    notes,
  };
}

/** Offline mode: read a local HTML file plus optional siblings (robots.txt, llms.txt, sitemap.xml, headers.json, local CSS). */
export async function gatherFile(filePath) {
  const abs = resolve(filePath);
  const dir = dirname(abs);
  const html = await readFile(abs, "utf8");
  const sib = async (name) =>
    existsSync(join(dir, name)) ? readFile(join(dir, name), "utf8") : null;
  let headers = null;
  const hj = await sib("headers.json");
  if (hj) {
    try {
      headers = JSON.parse(hj);
    } catch {
      headers = null;
    }
  }
  let css = "";
  for (const l of findTags(html, "link").map((t) => t.attrs)) {
    if (
      !/stylesheet/i.test(l.rel || "") ||
      !l.href ||
      /^[a-z]+:|^\/\//i.test(l.href)
    )
      continue;
    const p = resolve(dir, l.href.split(/[?#]/)[0]);
    const rel = relative(dir, p);
    if (
      rel &&
      rel !== ".." &&
      !rel.startsWith(".." + sep) &&
      !isAbsolute(rel) &&
      existsSync(p)
    )
      css += "\n" + (await readFile(p, "utf8"));
  }
  return {
    input: {
      url: "",
      mode: "file",
      html,
      headers,
      status: 200,
      css,
      robotsTxt: await sib("robots.txt"),
      llmsTxt: await sib("llms.txt"),
      sitemapXml: await sib("sitemap.xml"),
      formProbes: null,
    },
    requests: [],
    notes: [
      "offline file mode: header checks use headers.json when present, otherwise they are marked n/a",
    ],
  };
}

/**
 * Full scan. opts: { file, url, impeccable (bool, opt-in, default off), allowPrivate, lookup, hallmark (dir), client, brandColor, now, fetchImpl, impeccableRunner, hallmarkRunner, displayTarget }
 */
export async function scan(opts = {}) {
  const gathered = opts.file
    ? await gatherFile(opts.file)
    : await gatherUrl(opts.url, opts);
  const ctx = buildContext(gathered.input);
  const results = runRules(ctx, RULES);
  const notes = [...gathered.notes];
  const adapters = {};

  if (opts.impeccable === true && ctx.mode === "url") {
    const r = await runImpeccable(ctx.url, { runner: opts.impeccableRunner });
    adapters.impeccable = r.status;
    notes.push(r.note);
    results.push(...r.findings);
  } else {
    adapters.impeccable = "off";
    notes.push(
      ctx.mode === "file"
        ? "design: partial (impeccable needs a URL; serve the file and scan http://localhost to add its rules)"
        : "design: partial (impeccable is opt-in: add --with-impeccable to run it; it makes its own requests outside our rate and robots limits)",
    );
  }

  if (opts.hallmark) {
    let tmp;
    try {
      tmp = await mkdtemp(join(tmpdir(), "slopcard-"));
      const snap = join(tmp, "snapshot.html");
      await writeFile(snap, gathered.input.html);
      const r = await runHallmark(opts.hallmark, snap, {
        runner: opts.hallmarkRunner,
      });
      adapters.hallmark = r.status;
      notes.push(r.note);
      results.push(...r.findings);
    } finally {
      if (tmp) await rm(tmp, { recursive: true, force: true }).catch(() => {});
    }
  }

  const s = score(results);
  const now =
    opts.now || process.env.SLOPCARD_FIXED_DATE || new Date().toISOString();
  return {
    tool: {
      name: "site-slopcard",
      version: VERSION,
      url: REPO_URL,
      userAgent: USER_AGENT,
    },
    target:
      opts.displayTarget ||
      (ctx.mode === "file" ? String(opts.file).replace(/\\/g, "/") : ctx.url),
    mode: ctx.mode,
    generatedAt: now,
    client: opts.client || null,
    brandColor: opts.brandColor || null,
    score: s,
    topFixes: topFixes(results, 5).map(({ rank, ...r }) => r),
    findings: results.filter((r) => r.status === "fail"),
    results,
    adapters,
    notes,
    requests: gathered.requests,
  };
}
