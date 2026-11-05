// Every rule gets a pass fixture and a fail fixture (offline, no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { RULES, runRule } from "../src/rules.js";
import { buildContext } from "../src/context.js";
import { gatherFile } from "../src/scan.js";

const GOOD = fileURLToPath(
  new URL("../examples/good-site/index.html", import.meta.url),
);
const goodInput = (await gatherFile(GOOD)).input;
const goodCtx = buildContext(goodInput);

const page = (body = "", head = "") =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const mk = (o = {}) => buildContext({ mode: "file", html: page(), ...o });
const withHtml = (body, head) => mk({ html: page(body, head) });
const withCss = (css) => mk({ css });
const withHeaders = (headers) => mk({ headers });
const fakeGoogleKey = "AIza" + "Q".repeat(35);

// [ruleId, failCtx, passCtx?]  (passCtx defaults to the good-site fixture)
const CASES = [
  ["design.default-font", withCss("body{font-family:Inter,sans-serif}")],
  [
    "design.purple-gradient",
    withCss(".h{background:linear-gradient(90deg,#7c3aed,#06b6d4)}"),
  ],
  [
    "design.gradient-text",
    withCss(".t{-webkit-background-clip:text;background-clip:text}"),
  ],
  [
    "design.tracked-eyebrow",
    withCss(".e{text-transform:uppercase;letter-spacing:.2em}"),
  ],
  [
    "design.emoji-bullets",
    withHtml("<ul><li>🚀 fast</li><li>✨ magic</li><li>🔒 safe</li></ul>"),
  ],
  ["design.hero-buzzwords", withHtml("<h1>Unlock your potential</h1>")],
  ["design.glassmorphism", withCss(".c{backdrop-filter:blur(8px)}")],
  ["design.placeholder-copy", withHtml("<p>Lorem ipsum dolor sit amet</p>")],
  [
    "design.em-dash-density",
    withHtml("<p>One — two — three — four — five — six — seven.</p>"),
  ],
  [
    "design.stock-phrases",
    withHtml("<p>In today's fast-paced world we delve into growth.</p>"),
  ],
  ["design.default-palette", withCss(".b{color:#6366f1}")],
  ["seo.title-present", withHtml("<p>x</p>")],
  ["seo.title-length", withHtml("", "<title>Hi</title>")],
  ["seo.meta-description", withHtml("")],
  [
    "seo.meta-description-length",
    withHtml("", '<meta name="description" content="Too short">'),
  ],
  ["seo.single-h1", withHtml("<h1>a</h1><h1>b</h1>")],
  ["seo.canonical", withHtml("")],
  ["seo.open-graph", withHtml("", '<meta property="og:title" content="x">')],
  ["seo.twitter-card", withHtml("")],
  [
    "seo.structured-data",
    withHtml("", '<script type="application/ld+json">{not json</script>'),
  ],
  ["seo.img-alt", withHtml('<img src="a.png"><img src="b.png">')],
  ["seo.html-lang", withHtml("")],
  ["seo.viewport", withHtml("")],
  [
    "seo.indexable",
    withHtml("", '<meta name="robots" content="noindex,follow">'),
  ],
  ["seo.sitemap", mk({ sitemapXml: null })],
  ["aeo.llms-txt", mk({ llmsTxt: null })],
  ["aeo.robots-txt", mk({ robotsTxt: null })],
  [
    "aeo.ai-bots-allowed",
    mk({
      robotsTxt: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /",
    }),
  ],
  ["aeo.faq-schema", withHtml("")],
  [
    "aeo.entity-schema",
    withHtml(
      "",
      '<script type="application/ld+json">{"@type":"WebPage"}</script>',
    ),
  ],
  ["aeo.answer-first", withHtml(`<p>${"word ".repeat(200)}</p>`)],
  ["aeo.question-headings", withHtml("<h2>Services</h2>")],
  ["aeo.freshness", withHtml("")],
  [
    "security.https",
    mk({ mode: "url", url: "http://plain.test/" }),
    mk({ mode: "url", url: "https://secure.test/" }),
  ],
  [
    "security.hsts",
    withHeaders({ "strict-transport-security": "max-age=300" }),
  ],
  ["security.csp", withHeaders({})],
  ["security.nosniff", withHeaders({})],
  ["security.referrer-policy", withHeaders({})],
  ["security.frame-protection", withHeaders({})],
  [
    "security.version-leak",
    withHeaders({ server: "Apache/2.4.1", "x-powered-by": "PHP/8.1.2" }),
  ],
  [
    "security.mixed-content",
    withHtml('<img src="http://cdn.plain.test/a.png">'),
  ],
  [
    "security.exposed-keys",
    withHtml(`<script>var m="${fakeGoogleKey}"</script>`),
  ],
  [
    "security.third-party-scripts",
    withHtml(
      Array.from(
        { length: 9 },
        (_, i) => `<script src="https://t${i}.tracker.test/a.js"></script>`,
      ).join(""),
    ),
  ],
  [
    "security.sri",
    withHtml('<script src="https://unpkg.com/x@1.0.0/x.js"></script>'),
  ],
  ["leads.contact-path", withHtml("<p>Hello</p>")],
  ["leads.form-present", withHtml("<p>No form</p>")],
  [
    "leads.form-action",
    withHtml('<form action="#"><button>Go</button></form>'),
  ],
  [
    "leads.form-https",
    withHtml('<form action="http://forms.plain.test/f"></form>'),
  ],
  [
    "leads.form-endpoint",
    mk({ formProbes: [{ url: "https://x.test/api", status: 500 }] }),
    mk({ formProbes: [{ url: "https://x.test/api", status: 200 }] }),
  ],
  [
    "leads.input-labels",
    withHtml('<form action="/f"><input name="a" type="text"></form>'),
  ],
  [
    "leads.email-type",
    withHtml('<input name="email" type="text" aria-label="Email">'),
  ],
  [
    "leads.primary-cta",
    withHtml('<a href="/">Home</a><a href="/about">About</a>'),
  ],
  ["leads.instant-channel", withHtml('<a href="mailto:a@b.test">mail</a>')],
];

const byId = new Map(RULES.map((r) => [r.id, r]));

test("rule catalogue: 40+ rules, unique ids, every rule has fix + source + valid severity", () => {
  assert.ok(RULES.length >= 40, `only ${RULES.length} rules`);
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length);
  for (const r of RULES) {
    assert.ok(r.fix && r.source && r.title, r.id);
    assert.ok(["high", "medium", "low"].includes(r.severity), r.id);
    assert.ok(
      ["design", "seo", "aeo", "security", "leads"].includes(r.group),
      r.id,
    );
    assert.ok(r.id.startsWith(r.group + "."), r.id);
  }
});

test("every rule has a fail case in this file", () => {
  const covered = new Set(CASES.map((c) => c[0]));
  for (const r of RULES) assert.ok(covered.has(r.id), `no fixture for ${r.id}`);
});

for (const [id, failCtx, passCtx] of CASES) {
  test(`${id} fails on its fail fixture`, () => {
    const rule = byId.get(id);
    assert.ok(rule, `unknown rule ${id}`);
    const r = runRule(rule, failCtx);
    assert.equal(r.status, "fail", `${id}: expected fail, got ${r.status}`);
    assert.ok(r.evidence && r.fix && r.source);
  });
  test(`${id} passes on its pass fixture`, () => {
    const r = runRule(byId.get(id), passCtx || goodCtx);
    assert.equal(
      r.status,
      "pass",
      `${id}: expected pass, got ${r.status} (${r.evidence || ""})`,
    );
  });
}

test("header-based security rules are n/a without headers", () => {
  const ctx = withHtml("<p>x</p>");
  for (const id of [
    "security.hsts",
    "security.csp",
    "security.nosniff",
    "security.referrer-policy",
    "security.frame-protection",
    "security.version-leak",
    "security.https",
  ]) {
    assert.equal(runRule(byId.get(id), ctx).status, "na", id);
  }
});

test("form rules are n/a when the page has no form or fields", () => {
  const ctx = withHtml("<p>x</p>");
  for (const id of [
    "leads.form-action",
    "leads.form-https",
    "leads.input-labels",
    "leads.email-type",
    "leads.form-endpoint",
  ]) {
    assert.equal(runRule(byId.get(id), ctx).status, "na", id);
  }
});

test("purple gradient is also caught from Tailwind classes", () => {
  const r = runRule(
    byId.get("design.purple-gradient"),
    withHtml(
      '<div class="bg-gradient-to-r from-purple-500 to-cyan-400">x</div>',
    ),
  );
  assert.equal(r.status, "fail");
});

test("gradient text is also caught from Tailwind classes", () => {
  const r = runRule(
    byId.get("design.gradient-text"),
    withHtml('<h1 class="bg-clip-text text-transparent">x</h1>'),
  );
  assert.equal(r.status, "fail");
});

test("Google Fonts link with only Inter counts as default font", () => {
  const r = runRule(
    byId.get("design.default-font"),
    withHtml(
      "",
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400">',
    ),
  );
  assert.equal(r.status, "fail");
});

test("a distinctive font next to Inter passes", () => {
  const r = runRule(
    byId.get("design.default-font"),
    withCss('h1{font-family:"Fraunces",serif} p{font-family:Inter,sans-serif}'),
  );
  assert.equal(r.status, "pass");
});

test("a rule that throws is reported as n/a, not a crash", () => {
  const r = runRule(
    {
      id: "x.boom",
      group: "seo",
      severity: "low",
      check() {
        throw new Error("boom");
      },
    },
    goodCtx,
  );
  assert.equal(r.status, "na");
});

test("exposed-key evidence is redacted to 4 chars + length", () => {
  const r = runRule(
    byId.get("security.exposed-keys"),
    withHtml(`<script>var m="${fakeGoogleKey}"</script>`),
  );
  assert.ok(!r.evidence.includes(fakeGoogleKey));
  assert.match(r.evidence, /AIza…\(39 chars\)/);
});
