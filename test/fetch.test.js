// Politeness + safety of the fetch layer. All network is mocked.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createFetcher,
  isSameSiteHop,
  USER_AGENT,
  RefusedError,
} from "../src/fetch.js";
import { gatherUrl, normaliseUrl, scan } from "../src/scan.js";

function mockSite(routes, calls = []) {
  return async (url, init = {}) => {
    calls.push({ url, method: init.method, headers: init.headers });
    const r = routes[url];
    if (!r) return new Response("not found", { status: 404 });
    if (typeof r === "function") return r(init);
    return new Response(r.body ?? "", {
      status: r.status ?? 200,
      headers: r.headers ?? {},
    });
  };
}

const PAGE =
  '<!doctype html><html lang="en"><head><title>Demo site for polite fetch tests ok</title><link rel="stylesheet" href="/s.css"><link rel="stylesheet" href="https://other.test/x.css"></head><body><h1>Hi</h1><form action="/api/lead" method="post"><input name="email" type="email" aria-label="Email"></form><form action="https://forms.other.test/f"></form></body></html>';

test("POST, PUT, DELETE and PATCH are refused before any network call", async () => {
  const calls = [];
  const f = createFetcher({
    origin: "https://site.test",
    fetchImpl: mockSite({}, calls),
    minIntervalMs: 0,
  });
  for (const m of ["POST", "PUT", "DELETE", "PATCH"]) {
    await assert.rejects(f.request("https://site.test/", m), RefusedError);
  }
  assert.equal(calls.length, 0);
});

test("off-origin requests are refused", async () => {
  const calls = [];
  const f = createFetcher({
    origin: "https://site.test",
    fetchImpl: mockSite({}, calls),
    minIntervalMs: 0,
  });
  await assert.rejects(f.get("https://evil.test/"), /off-origin/);
  await assert.rejects(f.get("http://site.test/"), /off-origin/);
  assert.equal(calls.length, 0);
});

test("non-http URLs are refused", async () => {
  const f = createFetcher({
    origin: "https://site.test",
    fetchImpl: mockSite({}),
    minIntervalMs: 0,
  });
  await assert.rejects(f.get("file:///etc/passwd"), /non-http/);
});

test("sends the honest User-Agent and uses manual redirects", async () => {
  const calls = [];
  const f = createFetcher({
    origin: "https://site.test",
    fetchImpl: mockSite({ "https://site.test/": { body: "ok" } }, calls),
    minIntervalMs: 0,
  });
  await f.get("https://site.test/");
  assert.equal(calls[0].headers["user-agent"], USER_AGENT);
  assert.match(USER_AGENT, /^site-slopcard\/1\.0 \(\+https:\/\/github\.com\//);
});

test("rate limit: at most one request per second", async () => {
  let clock = 0;
  const sleeps = [];
  const f = createFetcher({
    origin: "https://site.test",
    fetchImpl: mockSite({ "https://site.test/": { body: "ok" } }),
    now: () => clock,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
  });
  await f.get("https://site.test/");
  await f.get("https://site.test/");
  await f.get("https://site.test/");
  assert.deepEqual(sleeps, [1000, 1000]);
});

test("timeouts are reported, not hung", async () => {
  const hang = (url, init) =>
    new Promise((_, rej) =>
      init.signal.addEventListener("abort", () =>
        rej(Object.assign(new Error("aborted"), { name: "AbortError" })),
      ),
    );
  const f = createFetcher({
    origin: "https://site.test",
    fetchImpl: hang,
    minIntervalMs: 0,
    timeoutMs: 20,
  });
  await assert.rejects(f.get("https://site.test/"), /timeout/);
});

test("same-site hop rules: www toggle and http->https only", () => {
  assert.ok(isSameSiteHop("http://site.test/", "https://site.test/"));
  assert.ok(isSameSiteHop("https://site.test/", "https://www.site.test/"));
  assert.ok(!isSameSiteHop("https://site.test/", "https://evil.test/"));
  assert.ok(!isSameSiteHop("https://site.test/", "http://site.test/"));
});

test("normaliseUrl adds https and rejects other schemes", () => {
  assert.equal(normaliseUrl("example.com"), "https://example.com/");
  assert.throws(() => normaliseUrl("ftp://x.test/"), /http/);
  assert.throws(() => normaliseUrl(""), /No URL/);
});

test("gatherUrl: GET/HEAD only, same-origin CSS only, off-origin form endpoint not probed", async () => {
  const calls = [];
  const routes = {
    "https://site.test/robots.txt": { body: "User-agent: *\nAllow: /\n" },
    "https://site.test/": {
      body: PAGE,
      headers: {
        "content-type": "text/html",
        "strict-transport-security": "max-age=31536000",
      },
    },
    "https://site.test/llms.txt": { body: "# Site\n\nA demo site for tests." },
    "https://site.test/s.css": { body: "body{font-family:Fraunces,serif}" },
    "https://site.test/api/lead": { status: 405 },
  };
  const g = await gatherUrl("https://site.test/", {
    fetchImpl: mockSite(routes, calls),
    minIntervalMs: 0,
  });
  assert.ok(
    calls.every((c) => c.method === "GET" || c.method === "HEAD"),
    "only GET/HEAD",
  );
  assert.ok(
    calls.every((c) => c.url.startsWith("https://site.test/")),
    "same-origin only",
  );
  assert.ok(!calls.some((c) => c.method === "POST"));
  const head = calls.find((c) => c.method === "HEAD");
  assert.equal(head.url, "https://site.test/api/lead");
  assert.ok(
    g.input.formProbes.some(
      (p) => p.skipped && p.url.startsWith("https://forms.other.test"),
    ),
  );
  assert.match(g.input.css, /Fraunces/);
  assert.ok(calls.length <= 9, `polite request budget, got ${calls.length}`);
});

test("gatherUrl respects robots.txt Disallow for our UA", async () => {
  const calls = [];
  const routes = {
    "https://site.test/robots.txt": { body: "User-agent: *\nDisallow: /\n" },
  };
  await assert.rejects(
    gatherUrl("https://site.test/", {
      fetchImpl: mockSite(routes, calls),
      minIntervalMs: 0,
    }),
    /robots\.txt disallows/,
  );
  assert.equal(calls.length, 1, "only robots.txt was fetched");
});

test("gatherUrl follows a www redirect but refuses an off-site redirect", async () => {
  const ok = {
    "https://site.test/": {
      status: 301,
      headers: { location: "https://www.site.test/" },
    },
    "https://www.site.test/": { body: PAGE },
  };
  const g = await gatherUrl("https://site.test/", {
    fetchImpl: mockSite(ok),
    minIntervalMs: 0,
    probeForms: false,
  });
  assert.equal(g.input.url, "https://www.site.test/");
  const off = {
    "https://site.test/": {
      status: 302,
      headers: { location: "https://elsewhere.test/" },
    },
  };
  await assert.rejects(
    gatherUrl("https://site.test/", {
      fetchImpl: mockSite(off),
      minIntervalMs: 0,
    }),
    /off-site/,
  );
});

test("gatherUrl reports HTTP errors", async () => {
  await assert.rejects(
    gatherUrl("https://site.test/", {
      fetchImpl: mockSite({}),
      minIntervalMs: 0,
    }),
    /HTTP 404/,
  );
});

test("full scan over a mocked URL produces a graded report without impeccable", async () => {
  const routes = {
    "https://site.test/": {
      body: PAGE,
      headers: { "x-content-type-options": "nosniff" },
    },
  };
  const r = await scan({
    url: "https://site.test/",
    fetchImpl: mockSite(routes),
    minIntervalMs: 0,
    impeccable: false,
  });
  assert.equal(r.mode, "url");
  assert.match(r.score.grade, /^[A-F]$/);
  assert.ok(r.notes.some((n) => /design: partial/.test(n)));
  assert.ok(r.requests.every((q) => q.method === "GET" || q.method === "HEAD"));
});
