import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRobots, isAllowed } from "../src/robots.js";
import {
  parseAttrs,
  findElements,
  textOf,
  parseJsonLd,
  decodeEntities,
} from "../src/html.js";
import { colorsIn, isPurple } from "../src/checks/util.js";

test("robots: specific group beats *", () => {
  const r = parseRobots(
    "User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /\n",
  );
  assert.equal(isAllowed(r, "GPTBot", "/"), true);
  assert.equal(isAllowed(r, "ClaudeBot", "/"), false);
});

test("robots: longest match wins, empty Disallow allows all", () => {
  const r = parseRobots(
    "User-agent: *\nDisallow: /private\nAllow: /private/ok\n",
  );
  assert.equal(isAllowed(r, "x", "/private/a"), false);
  assert.equal(isAllowed(r, "x", "/private/ok/b"), true);
  assert.equal(
    isAllowed(parseRobots("User-agent: *\nDisallow:\n"), "x", "/"),
    true,
  );
});

test("robots: wildcard and $ anchors, sitemaps collected", () => {
  const r = parseRobots(
    "User-agent: *\nDisallow: /*.pdf$\nSitemap: https://x.test/sitemap.xml\n",
  );
  assert.equal(isAllowed(r, "x", "/a.pdf"), false);
  assert.equal(isAllowed(r, "x", "/a.pdf?x"), true);
  assert.deepEqual(r.sitemaps, ["https://x.test/sitemap.xml"]);
});

test("robots: grouped user-agents share rules", () => {
  const r = parseRobots(
    "User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n",
  );
  assert.equal(isAllowed(r, "ClaudeBot", "/"), false);
  assert.equal(isAllowed(r, "GPTBot", "/"), false);
  assert.equal(isAllowed(r, "Googlebot", "/"), true);
});

test("html: attributes, quoting and entities", () => {
  assert.deepEqual(parseAttrs(" a=\"1\" b='2' c=3 d"), {
    a: "1",
    b: "2",
    c: "3",
    d: "",
  });
  assert.equal(decodeEntities("&amp;&lt;&#39;&#x41;"), "&<'A");
});

test("html: visible text ignores script and style", () => {
  assert.equal(
    textOf("<p>Hi <b>there</b></p><script>var x=1</script><style>p{}</style>"),
    "Hi there",
  );
  assert.equal(findElements("<h2>a</h2><h2>b</h2>", "h2").length, 2);
});

test("html: JSON-LD @graph types are flattened; invalid blocks counted", () => {
  const ld = parseJsonLd(
    '<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":["FAQPage"]}]}</script><script type="application/ld+json">{x</script>',
  );
  assert.deepEqual(ld.types.sort(), ["FAQPage", "Organization"]);
  assert.equal(ld.invalid, 1);
});

test("colour parsing: hex, rgb, hsl and names", () => {
  assert.ok(colorsIn("#7c3aed").some(isPurple));
  assert.ok(colorsIn("rgb(124, 58, 237)").some(isPurple));
  assert.ok(colorsIn("hsl(270, 80%, 50%)").some(isPurple));
  assert.ok(colorsIn("rebeccapurple").some(isPurple));
  assert.ok(!colorsIn("#c2410c, #15803d").some(isPurple));
});
