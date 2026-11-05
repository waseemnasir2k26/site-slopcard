// v1.0.1 hardening: opt-in impeccable, robots on every path, SSRF guard, traversal, caps.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs, main } from "../src/cli.js";
import { gatherUrl, gatherFile, normaliseUrl, scan } from "../src/scan.js";
import { isSameSiteHop, readCapped } from "../src/fetch.js";
import { isPrivateIp } from "../src/netguard.js";
import {
  compareReports,
  renderCompareHtml,
  renderCompareMarkdown,
} from "../src/report/compare.js";
import { RULES, runRule } from "../src/rules.js";
import { buildContext } from "../src/context.js";
import { score } from "../src/score.js";

const BIN = fileURLToPath(new URL("../bin/site-slopcard.js", import.meta.url));
const GOOD = fileURLToPath(
  new URL("../examples/good-site/index.html", import.meta.url),
);
const rule = (id) => RULES.find((r) => r.id === id);
const ctxOf = (body, head = "") =>
  buildContext({
    mode: "file",
    html: `<!doctype html><html><head>${head}</head><body>${body}</body></html>`,
  });

function mockSite(routes, calls = []) {
  return async (url, init = {}) => {
    calls.push({ url, method: init.method });
    const r = routes[url];
    if (!r) return new Response("not found", { status: 404 });
    return new Response(r.body ?? "", {
      status: r.status ?? 200,
      headers: r.headers ?? {},
    });
  };
}
const PAGE =
  '<!doctype html><html lang="en"><head><title>Demo page for robots tests here</title><link rel="stylesheet" href="/priv/s.css"></head><body><h1>Hi</h1><form action="/priv/lead" method="post"><input name="email" type="email" aria-label="Email"></form></body></html>';

test("impeccable is opt-in: default off, --with-impeccable turns it on", async () => {
  assert.equal(parseArgs([]).impeccable, false);
  assert.equal(parseArgs(["--with-impeccable"]).impeccable, true);
  assert.throws(() => parseArgs(["--no-impeccable"]), /Unknown option/);
  let ran = 0;
  const runner = async () => {
    ran++;
    return { error: "x" };
  };
  const base = {
    url: "https://site.test/",
    fetchImpl: mockSite({ "https://site.test/": { body: PAGE } }),
    minIntervalMs: 0,
    impeccableRunner: runner,
  };
  const off = await scan(base);
  assert.equal(ran, 0);
  assert.equal(off.adapters.impeccable, "off");
  assert.ok(off.notes.some((n) => /opt-in/.test(n)));
  await scan({ ...base, impeccable: true });
  assert.equal(ran, 1);
});

test("--file CSS traversal: sibling dir sharing a prefix is not read", async () => {
  const root = await mkdtemp(join(tmpdir(), "slop-"));
  try {
    await mkdir(join(root, "site"));
    await mkdir(join(root, "site2"));
    await writeFile(
      join(root, "site2", "x.css"),
      "body{font-family:SECRETFONT}",
    );
    await writeFile(join(root, "site", "ok.css"), "body{color:red}");
    await writeFile(
      join(root, "site", "index.html"),
      '<html><head><link rel="stylesheet" href="../site2/x.css"><link rel="stylesheet" href="ok.css"></head><body></body></html>',
    );
    const g = await gatherFile(join(root, "site", "index.html"));
    assert.ok(!g.input.css.includes("SECRETFONT"));
    assert.ok(g.input.css.includes("color:red"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("compare: hostile report fields are coerced and escaped", () => {
  const evil = (g) => ({
    target: "t",
    generatedAt: "x",
    findings: [],
    tool: { url: "u" },
    score: {
      grade: '"><script>alert(1)</script>',
      overall: "<img src=x onerror=alert(1)>",
      groups: Object.fromEntries(
        ["design", "seo", "aeo", "security", "leads"].map((k) => [
          k,
          { score: g },
        ]),
      ),
    },
  });
  const c = compareReports(evil("<b>x</b>"), evil(5));
  const html = renderCompareHtml(c);
  assert.ok(!html.includes("<script>alert"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<b>x</b>"));
  assert.equal(c.before.grade, "n/a");
  assert.equal(c.before.overall, 0);
  assert.ok(!renderCompareMarkdown(c).includes("<b>x</b>"));
});

test("robots.txt is honoured for llms.txt, sitemap, CSS and form HEADs", async () => {
  const calls = [];
  const routes = {
    "https://site.test/robots.txt": {
      body: "User-agent: *\nDisallow: /priv/\nDisallow: /llms.txt\nDisallow: /sitemap.xml\n",
    },
    "https://site.test/": { body: PAGE },
  };
  const g = await gatherUrl("https://site.test/", {
    fetchImpl: mockSite(routes, calls),
    minIntervalMs: 0,
  });
  const urls = calls.map((c) => c.url);
  assert.ok(!urls.some((u) => /priv|llms|sitemap/.test(u)), urls.join(","));
  assert.ok(g.input.formProbes[0].skipped);
  assert.ok(g.notes.some((n) => /llms\.txt/.test(n)));
});

test("robots.txt is checked on every redirect hop", async () => {
  const routes = {
    "https://site.test/robots.txt": {
      body: "User-agent: *\nDisallow: /private\n",
    },
    "https://site.test/": {
      status: 301,
      headers: { location: "/private/page" },
    },
    "https://site.test/private/page": { body: PAGE },
  };
  await assert.rejects(
    gatherUrl("https://site.test/", {
      fetchImpl: mockSite(routes),
      minIntervalMs: 0,
    }),
    /robots\.txt disallows/,
  );
});

test("same-site hop compares host including port", () => {
  assert.ok(!isSameSiteHop("https://site.test/", "https://site.test:8443/"));
  assert.ok(
    !isSameSiteHop("https://site.test:3000/", "https://www.site.test:4000/"),
  );
  assert.ok(
    isSameSiteHop("https://site.test:8443/", "https://www.site.test:8443/"),
  );
});

test("response body is capped while streaming", async () => {
  let pulled = 0;
  let cancelled = false;
  const stream = new ReadableStream({
    pull(ctrl) {
      pulled++;
      ctrl.enqueue(new Uint8Array(1024 * 1024).fill(97));
    },
    cancel() {
      cancelled = true;
    },
  });
  const body = await readCapped(new Response(stream), 3 * 1024 * 1024);
  assert.equal(body.length, 3 * 1024 * 1024);
  assert.ok(cancelled);
  assert.ok(pulled <= 6, `pulled ${pulled} chunks`);
});

test("CLI: malformed URL says Invalid URL; stderr is scrubbed", () => {
  assert.throws(() => normaliseUrl("http://"), /Invalid URL/);
  const r = spawnSync(process.execPath, [BIN, "http://exa mple.com"], {
    encoding: "utf8",
  });
  assert.match(r.stderr, /Invalid URL/);
  assert.equal(r.status, 2);
  const key = "AIza" + "Q".repeat(35);
  const s = spawnSync(process.execPath, [BIN, `--${key}`], {
    encoding: "utf8",
  });
  assert.ok(!s.stderr.includes(key));
  assert.match(s.stderr, /Unknown option/);
});

test("--out pointing at an existing directory is fine", async () => {
  const root = await mkdtemp(join(tmpdir(), "slop-out-"));
  try {
    const sink = { write() {} };
    const io = { stdout: sink, stderr: sink };
    assert.equal(await main(["--file", GOOD, "--out", root], io), 0);
    assert.equal(await main(["--file", GOOD, "--out", root], io), 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("isPrivateIp covers loopback, RFC1918, link-local, metadata, ULA, mapped v6", () => {
  for (const ip of [
    "127.0.0.1",
    "127.9.9.9",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "fd12::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:a00:1",
  ])
    assert.ok(isPrivateIp(ip), ip);
  for (const ip of [
    "8.8.8.8",
    "172.32.0.1",
    "172.15.0.1",
    "192.169.0.1",
    "93.184.216.34",
    "2606:4700::1",
  ])
    assert.ok(!isPrivateIp(ip), ip);
});

test("private targets are refused unless --allow-private", async () => {
  const fetchImpl = mockSite({
    "http://127.0.0.1/": { body: PAGE },
    "https://site.test/": { body: PAGE },
  });
  const opts = { fetchImpl, minIntervalMs: 0 };
  await assert.rejects(gatherUrl("http://127.0.0.1/", opts), /private/);
  await assert.rejects(
    gatherUrl("http://169.254.169.254/latest", opts),
    /private/,
  );
  await assert.rejects(
    gatherUrl("http://localhost:3000/", {
      ...opts,
      lookup: async () => [{ address: "127.0.0.1" }],
    }),
    /private/,
  );
  await assert.rejects(
    gatherUrl("https://innocent.test/", {
      ...opts,
      lookup: async () => [{ address: "10.0.0.5" }],
    }),
    /private/,
  );
  const ok = await gatherUrl("https://site.test/", {
    ...opts,
    lookup: async () => [{ address: "93.184.216.34" }],
  });
  assert.equal(ok.input.status, 200);
  const allowed = await gatherUrl("http://127.0.0.1/", {
    ...opts,
    allowPrivate: true,
  });
  assert.equal(allowed.input.status, 200);
  assert.equal(parseArgs(["--allow-private"]).allowPrivate, true);
});

test("placeholder rule: body copy 'your company' passes, headline/CTA fails", () => {
  const r = rule("design.placeholder-copy");
  const body = runRule(
    r,
    ctxOf(
      "<h1>Payments for the internet</h1><p>Grow your company with our APIs.</p>",
    ),
  );
  assert.equal(body.status, "pass");
  assert.equal(
    runRule(r, ctxOf("<h1>Welcome to Your Company</h1>")).status,
    "fail",
  );
  assert.equal(
    runRule(r, ctxOf('<a href="/x">Your Company</a>')).status,
    "fail",
  );
  assert.equal(runRule(r, ctxOf("<p>Lorem ipsum dolor</p>")).status, "fail");
});

test("duplicate h1 is a warning (half credit); missing h1 still fails", () => {
  const r = rule("seo.single-h1");
  assert.equal(runRule(r, ctxOf("<h1>a</h1><h1>b</h1>")).status, "warn");
  assert.equal(runRule(r, ctxOf("<p>x</p>")).status, "fail");
  assert.equal(runRule(r, ctxOf("<h1>a</h1>")).status, "pass");
  const sc = (status) =>
    score([{ group: "seo", severity: "medium", status }]).groups.seo.score;
  assert.equal(sc("pass"), 100);
  assert.equal(sc("warn"), 50);
  assert.equal(sc("fail"), 0);
});
