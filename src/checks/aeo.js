// AEO (answer-engine optimisation) basics. Ideas from AgriciDaniel/claude-seo (MIT)
// seo-agentic items (llms.txt, AI crawler access, answer-ready schema), reimplemented.
import { PASS, NA, fail, trunc } from "./util.js";
import { isAllowed } from "../robots.js";
import { wordCount } from "../html.js";

const SRC =
  "AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented";

export const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

export const aeoRules = [
  {
    id: "aeo.llms-txt",
    severity: "medium",
    effort: 1,
    title: "/llms.txt published",
    fix: "Publish /llms.txt: a short markdown map of who you are, what you offer and your key pages.",
    check: (ctx) =>
      ctx.llmsTxt &&
      ctx.llmsTxt.trim().length >= 20 &&
      !/^\s*</.test(ctx.llmsTxt)
        ? PASS
        : fail("No usable /llms.txt"),
  },
  {
    id: "aeo.robots-txt",
    severity: "low",
    effort: 1,
    title: "robots.txt present",
    fix: "Publish /robots.txt with your sitemap line and explicit rules for AI crawlers.",
    check: (ctx) =>
      ctx.robotsTxt != null && !/^\s*</.test(ctx.robotsTxt)
        ? PASS
        : fail("No /robots.txt"),
  },
  {
    id: "aeo.ai-bots-allowed",
    severity: "high",
    effort: 1,
    title: "AI crawlers are not blocked",
    fix: "Unless you mean to opt out, remove the Disallow: / lines for GPTBot, ClaudeBot, PerplexityBot and Google-Extended.",
    check(ctx) {
      if (!ctx.robots) return PASS;
      const blocked = AI_BOTS.filter((b) => !isAllowed(ctx.robots, b, "/"));
      return blocked.length
        ? fail(`robots.txt blocks ${blocked.join(", ")}`)
        : PASS;
    },
  },
  {
    id: "aeo.faq-schema",
    severity: "medium",
    effort: 2,
    title: "Answer-ready schema (FAQPage / HowTo / QAPage)",
    fix: "Mark up your real customer questions with FAQPage JSON-LD (only questions shown on the page).",
    check: (ctx) =>
      ctx.doc.jsonld.types.some((t) => /^(FAQPage|HowTo|QAPage)$/i.test(t))
        ? PASS
        : fail("No FAQPage/HowTo/QAPage schema"),
  },
  {
    id: "aeo.entity-schema",
    severity: "medium",
    effort: 1,
    title: "Entity schema (Organization / LocalBusiness / Person)",
    fix: "Add Organization or LocalBusiness JSON-LD with name, url, logo and sameAs profiles.",
    check(ctx) {
      const ok = ctx.doc.jsonld.types.some(
        (t) =>
          /^(Organization|LocalBusiness|Person|ProfessionalService|Corporation)$/i.test(
            t,
          ) || /Business$|Service$|Store$/.test(t),
      );
      return ok ? PASS : fail("No Organization/LocalBusiness/Person entity");
    },
  },
  {
    id: "aeo.answer-first",
    severity: "medium",
    effort: 2,
    title: 'First paragraph answers the "what is this" question',
    fix: "Open with a 15-90 word paragraph that says who you help, with what, and where. Answer engines quote this.",
    check(ctx) {
      const p = ctx.doc.paragraphs.find((t) => wordCount(t) >= 5);
      if (!p) return fail("No paragraph copy found");
      const n = wordCount(p);
      return n >= 15 && n <= 90
        ? PASS
        : fail(`First paragraph is ${n} words: "${trunc(p, 60)}"`);
    },
  },
  {
    id: "aeo.question-headings",
    severity: "low",
    effort: 1,
    title: "At least one question-style heading",
    fix: 'Phrase one or two H2/H3s as the questions buyers actually ask ("How much does X cost?").',
    check: (ctx) =>
      [...ctx.doc.h2, ...ctx.doc.h3].some((h) => /\?\s*$/.test(h))
        ? PASS
        : fail("No H2/H3 phrased as a question"),
  },
  {
    id: "aeo.freshness",
    severity: "low",
    effort: 1,
    title: "Freshness signal (dateModified or <time>)",
    fix: "Expose a last-updated date: dateModified in JSON-LD or a visible <time datetime>.",
    check(ctx) {
      if (ctx.doc.jsonld.nodes.some((n) => n.dateModified)) return PASS;
      if (/<time\b[^>]*datetime=/i.test(ctx.doc.html)) return PASS;
      if (ctx.doc.meta("property", "article:modified_time")) return PASS;
      return fail("No dateModified, <time datetime> or article:modified_time");
    },
  },
].map((r) => ({ group: "aeo", source: SRC, ...r }));

export { NA };
