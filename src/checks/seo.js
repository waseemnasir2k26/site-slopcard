// SEO basics. Checklist items reimplemented in our own code from the ideas in
// AgriciDaniel/claude-seo (MIT) seo-audit skill. No code copied.
import { PASS, NA, fail, warn, trunc } from "./util.js";

const SRC = "AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented";

const metaContent = (ctx, key, val) => {
  const m = ctx.doc.meta(key, val);
  return m ? (m.content || "").trim() : null;
};

export const seoRules = [
  {
    id: "seo.title-present",
    severity: "high",
    effort: 1,
    title: "Page has a <title>",
    fix: "Add a unique <title> that names the offer and the place or audience.",
    check: (ctx) =>
      ctx.doc.title ? PASS : fail("No <title> element (or it is empty)"),
  },
  {
    id: "seo.title-length",
    severity: "medium",
    effort: 1,
    title: "Title is 30-65 characters",
    fix: "Rewrite the title to 30-65 characters so it is not truncated in results.",
    check(ctx) {
      const t = ctx.doc.title;
      if (!t) return fail("No title to measure");
      return t.length >= 30 && t.length <= 65
        ? PASS
        : fail(`Title is ${t.length} chars: "${trunc(t, 70)}"`);
    },
  },
  {
    id: "seo.meta-description",
    severity: "high",
    effort: 1,
    title: "Meta description present",
    fix: 'Add <meta name="description"> with a one-sentence promise and a reason to click.',
    check: (ctx) =>
      metaContent(ctx, "name", "description")
        ? PASS
        : fail("No meta description"),
  },
  {
    id: "seo.meta-description-length",
    severity: "low",
    effort: 1,
    title: "Meta description is 70-160 characters",
    fix: "Keep the description between 70 and 160 characters.",
    check(ctx) {
      const d = metaContent(ctx, "name", "description");
      if (!d) return fail("No meta description to measure");
      return d.length >= 70 && d.length <= 160
        ? PASS
        : fail(`Description is ${d.length} chars`);
    },
  },
  {
    id: "seo.single-h1",
    severity: "medium",
    effort: 1,
    title: "Exactly one <h1>",
    fix: "Use one <h1> for the page topic; demote the others to <h2>.",
    check: (ctx) =>
      ctx.doc.h1.length === 1
        ? PASS
        : ctx.doc.h1.length > 1
          ? warn(`${ctx.doc.h1.length} <h1> elements`)
          : fail("No <h1> element"),
  },
  {
    id: "seo.canonical",
    severity: "medium",
    effort: 1,
    title: "Canonical URL declared",
    fix: 'Add <link rel="canonical" href="https://your-domain/page"> to stop duplicate-URL dilution.',
    check: (ctx) =>
      ctx.doc.links.some(
        (l) => /(^|\s)canonical(\s|$)/i.test(l.rel || "") && l.href,
      )
        ? PASS
        : fail("No rel=canonical link"),
  },
  {
    id: "seo.open-graph",
    severity: "medium",
    effort: 1,
    title: "Open Graph title, description and image",
    fix: "Add og:title, og:description and og:image so shared links render a proper card.",
    check(ctx) {
      const missing = ["og:title", "og:description", "og:image"].filter(
        (p) => !metaContent(ctx, "property", p),
      );
      return missing.length ? fail(`Missing ${missing.join(", ")}`) : PASS;
    },
  },
  {
    id: "seo.twitter-card",
    severity: "low",
    effort: 1,
    title: "Twitter/X card meta",
    fix: 'Add <meta name="twitter:card" content="summary_large_image">.',
    check: (ctx) =>
      metaContent(ctx, "name", "twitter:card")
        ? PASS
        : fail("No twitter:card meta"),
  },
  {
    id: "seo.structured-data",
    severity: "medium",
    effort: 2,
    title: "Valid JSON-LD structured data",
    fix: "Add a JSON-LD block (Organization or LocalBusiness at minimum) and make sure it parses.",
    check(ctx) {
      const { blocks, invalid } = ctx.doc.jsonld;
      if (invalid) return fail(`${invalid} JSON-LD block(s) do not parse`);
      return blocks.length ? PASS : fail("No JSON-LD structured data");
    },
  },
  {
    id: "seo.img-alt",
    severity: "medium",
    effort: 1,
    title: "Images have alt text (90%+)",
    fix: 'Give every meaningful image a descriptive alt; use alt="" for pure decoration.',
    check(ctx) {
      const imgs = ctx.doc.imgs;
      if (!imgs.length) return PASS;
      const withAlt = imgs.filter((i) => "alt" in i).length;
      const pct = Math.round((withAlt / imgs.length) * 100);
      return pct >= 90
        ? PASS
        : fail(`${withAlt}/${imgs.length} images have alt (${pct}%)`);
    },
  },
  {
    id: "seo.html-lang",
    severity: "low",
    effort: 1,
    title: "<html lang> set",
    fix: 'Add lang="en" (or your language) to the <html> tag.',
    check: (ctx) => (ctx.doc.lang ? PASS : fail("No lang attribute on <html>")),
  },
  {
    id: "seo.viewport",
    severity: "medium",
    effort: 1,
    title: "Mobile viewport meta",
    fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
    check: (ctx) =>
      metaContent(ctx, "name", "viewport") ? PASS : fail("No viewport meta"),
  },
  {
    id: "seo.indexable",
    severity: "high",
    effort: 1,
    title: "Page is not set to noindex",
    fix: "Remove noindex from the robots meta / X-Robots-Tag if this page should rank.",
    check(ctx) {
      const m = metaContent(ctx, "name", "robots") || "";
      const h = ctx.headers ? ctx.headers["x-robots-tag"] || "" : "";
      if (/noindex/i.test(m))
        return fail(`<meta name="robots" content="${m}">`);
      if (/noindex/i.test(h)) return fail(`X-Robots-Tag: ${h}`);
      return PASS;
    },
  },
  {
    id: "seo.sitemap",
    severity: "low",
    effort: 1,
    title: "sitemap.xml reachable",
    fix: "Publish /sitemap.xml and reference it from robots.txt.",
    check(ctx) {
      if (ctx.sitemapXml && /<(urlset|sitemapindex)\b/i.test(ctx.sitemapXml))
        return PASS;
      return fail("No sitemap.xml found");
    },
  },
].map((r) => ({ group: "seo", source: SRC, ...r }));

export { NA };
