// Static "AI-slop" design tells, read from fetched HTML + CSS.
// Own heuristics. The tell catalogue is informed by Nutlope/hallmark (MIT, gate tiers)
// and Leonxlnx/taste-skill (MIT, design-intent vocabulary). No code copied.
import {
  PASS,
  NA,
  fail,
  trunc,
  colorsIn,
  isPurple,
  cssBlocks,
  classList,
} from "./util.js";

const SRC =
  "site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)";

const SLOP_FONTS = new Set([
  "inter",
  "roboto",
  "poppins",
  "open sans",
  "montserrat",
  "lato",
  "inter var",
  "inter tight",
]);
const GENERIC_FONTS = new Set([
  "sans-serif",
  "serif",
  "monospace",
  "system-ui",
  "-apple-system",
  "blinkmacsystemfont",
  "segoe ui",
  "helvetica",
  "helvetica neue",
  "arial",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "noto sans",
  "apple color emoji",
  "segoe ui emoji",
  "segoe ui symbol",
  "noto color emoji",
  "inherit",
  "initial",
  "unset",
  "cursive",
  "fantasy",
  "emoji",
  "math",
  "fangsong",
  "sf pro text",
  "sf pro display",
]);

export function declaredFonts(ctx) {
  const fams = new Set();
  for (const m of ctx.css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    for (const part of m[1].split(",")) {
      const f = part
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .replace(/\s*!important$/, "")
        .toLowerCase();
      if (f && !f.startsWith("var(")) fams.add(f);
    }
  }
  for (const l of ctx.doc.links) {
    const href = l.href || "";
    if (!/fonts\.googleapis\.com|fonts\.bunny\.net/.test(href)) continue;
    for (const m of href.matchAll(/family=([^&:]+)/g)) {
      for (const fam of decodeURIComponent(m[1]).split("|"))
        fams.add(fam.replace(/\+/g, " ").split(":")[0].trim().toLowerCase());
    }
  }
  return [...fams];
}

const BUZZ = [
  "unlock",
  "elevate",
  "seamless",
  "seamlessly",
  "supercharge",
  "revolutionize",
  "revolutionise",
  "empower",
  "unleash",
  "next-level",
  "game-changer",
  "game-changing",
  "effortless",
  "effortlessly",
  "leverage",
  "transform your",
  "skyrocket",
  "cutting-edge",
  "reimagine",
  "harness the power",
];
const STOCK = [
  "in today's fast-paced",
  "in today’s fast-paced",
  "delve",
  "tapestry",
  "look no further",
  "take it to the next level",
  "whether you’re a",
  "whether you're a",
  "it’s not just",
  "it's not just",
  "navigate the complexities",
  "ever-evolving",
  "unlock the full potential",
  "a testament to",
  "embark on",
];
const PLACEHOLDER = [
  /lorem ipsum/i,
  /\byour company\b/i,
  /\bcompany name\b/i,
  /\[your [a-z ]+\]/i,
  /example@example\.com/i,
  /\bjohn doe\b/i,
  /\bacme (inc|corp)\b/i,
  /\btestimonial goes here\b/i,
];
const TW_SLOP =
  /\b(?:bg|text|from|via|to|border|ring|shadow)-(?:indigo|violet|purple|fuchsia)-(?:300|400|500|600|700)\b/;
const DEFAULT_PALETTE =
  /#(?:6366f1|8b5cf6|a855f7|7c3aed|4f46e5|9333ea|a78bfa|c084fc|818cf8)\b/i;
const EMOJI_START = /^\p{Extended_Pictographic}/u;

function countOccurrences(text, needle) {
  let n = 0,
    i = 0;
  const t = text.toLowerCase();
  while ((i = t.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

export const designRules = [
  {
    id: "design.default-font",
    group: "design",
    severity: "medium",
    effort: 1,
    title: "Typeface is not the default AI pick",
    fix: "Pick a typeface with a point of view (a characterful serif or grotesk) and keep Inter/Roboto for UI text only, if at all.",
    check(ctx) {
      const fams = declaredFonts(ctx);
      if (!fams.length) return PASS;
      const slop = fams.filter((f) => SLOP_FONTS.has(f));
      const distinct = fams.filter(
        (f) => !SLOP_FONTS.has(f) && !GENERIC_FONTS.has(f),
      );
      if (slop.length && !distinct.length)
        return fail(`Only default fonts declared: ${slop.join(", ")}`);
      return PASS;
    },
  },
  {
    id: "design.purple-gradient",
    group: "design",
    severity: "high",
    effort: 2,
    title: 'No purple/violet "AI gradient"',
    fix: "Replace the purple-to-blue gradient with a flat brand colour or a palette pulled from your product or photography.",
    check(ctx) {
      for (const m of ctx.css.matchAll(
        /(?:linear|radial|conic)-gradient\(([^;{}]*)/gi,
      )) {
        if (colorsIn(m[1]).some(isPurple))
          return fail(`gradient(${trunc(m[1], 70)})`);
      }
      for (const cls of classList(ctx.doc.html)) {
        if (
          /\bbg-gradient-to-|\bbg-linear-to-/.test(cls) &&
          /\b(?:from|via|to)-(?:purple|violet|indigo|fuchsia)-\d/.test(cls)
        )
          return fail(`class="${trunc(cls, 70)}"`);
      }
      return PASS;
    },
  },
  {
    id: "design.gradient-text",
    group: "design",
    severity: "medium",
    effort: 1,
    title: "Headlines are not gradient-filled text",
    fix: "Set headline text in one solid colour; let weight, size and spacing carry emphasis.",
    check(ctx) {
      if (/background-clip\s*:\s*text/i.test(ctx.css))
        return fail("CSS uses background-clip: text");
      const cls = classList(ctx.doc.html).find(
        (c) => /\bbg-clip-text\b/.test(c) && /\btext-transparent\b/.test(c),
      );
      if (cls) return fail(`class="${trunc(cls, 70)}"`);
      return PASS;
    },
  },
  {
    id: "design.tracked-eyebrow",
    group: "design",
    severity: "low",
    effort: 1,
    title: 'No tracked all-caps "eyebrow" labels',
    fix: "Drop the small uppercase eyebrow above each heading, or keep one, at most, with normal letter spacing.",
    check(ctx) {
      for (const b of cssBlocks(ctx.css)) {
        if (!/text-transform\s*:\s*uppercase/i.test(b)) continue;
        const ls = b.match(/letter-spacing\s*:\s*([\d.]+)(em|rem|px)/i);
        if (
          ls &&
          ((ls[2] !== "px" && +ls[1] >= 0.1) || (ls[2] === "px" && +ls[1] >= 2))
        )
          return fail(`uppercase + letter-spacing ${ls[1]}${ls[2]}`);
      }
      const cls = classList(ctx.doc.html).find(
        (c) =>
          /\buppercase\b/.test(c) &&
          /\btracking-(?:wider|widest|\[0?\.[1-9])/.test(c),
      );
      if (cls) return fail(`class="${trunc(cls, 70)}"`);
      return PASS;
    },
  },
  {
    id: "design.emoji-bullets",
    group: "design",
    severity: "medium",
    effort: 1,
    title: "Lists do not lead with emoji",
    fix: "Replace emoji bullets with plain bullets, numbers or a real icon set used sparingly.",
    check(ctx) {
      const items = [
        ...ctx.doc.listItems,
        ...ctx.doc.h3,
        ...ctx.doc.paragraphs,
      ].filter((t) => EMOJI_START.test(t));
      if (items.length >= 3)
        return fail(
          `${items.length} items start with emoji, e.g. "${trunc(items[0], 50)}"`,
        );
      return PASS;
    },
  },
  {
    id: "design.hero-buzzwords",
    group: "design",
    severity: "high",
    effort: 1,
    title: "Headline copy is free of AI buzzwords",
    fix: 'Rewrite the headline as a concrete outcome for a named customer ("Plumber at your door in 60 minutes"), not "Unlock seamless..."',
    check(ctx) {
      const h1 = ctx.doc.h1.join(" ").toLowerCase();
      const heads = [h1, ...ctx.doc.h2.map((t) => t.toLowerCase())].join(" | ");
      const inH1 = BUZZ.filter((w) => new RegExp(`\\b${w}`).test(h1));
      const all = BUZZ.filter((w) => new RegExp(`\\b${w}`).test(heads));
      if (inH1.length || all.length >= 2)
        return fail(
          `Buzzwords in headings: ${[...new Set([...inH1, ...all])].join(", ")}`,
        );
      return PASS;
    },
  },
  {
    id: "design.glassmorphism",
    group: "design",
    severity: "low",
    effort: 1,
    title: "No default glassmorphism blur panels",
    fix: "Use solid surfaces with a clear border instead of frosted blur cards.",
    check(ctx) {
      if (/backdrop-filter\s*:\s*blur/i.test(ctx.css))
        return fail("CSS uses backdrop-filter: blur");
      const cls = classList(ctx.doc.html).find((c) =>
        /\bbackdrop-blur(?:-\w+)?\b/.test(c),
      );
      if (cls) return fail(`class="${trunc(cls, 70)}"`);
      return PASS;
    },
  },
  {
    id: "design.placeholder-copy",
    group: "design",
    severity: "high",
    effort: 1,
    title: "No template placeholder copy left in",
    fix: 'Replace every placeholder (lorem ipsum, "Your Company", sample names) with real copy.',
    check(ctx) {
      const hit = PLACEHOLDER.map((re) => ctx.doc.text.match(re)).find(Boolean);
      return hit ? fail(`Found "${hit[0]}"`) : PASS;
    },
  },
  {
    id: "design.em-dash-density",
    group: "design",
    severity: "low",
    effort: 1,
    title: "Em dashes are not overused in copy",
    fix: "Rewrite most em dashes as full stops or commas; heavy em-dash use reads as machine-written.",
    check(ctx) {
      const n = (ctx.doc.text.match(/—/g) || []).length;
      const words = ctx.doc.text.split(/\s+/).length || 1;
      if (n >= 6 && n / words > 1 / 150)
        return fail(`${n} em dashes in ${words} words`);
      return PASS;
    },
  },
  {
    id: "design.stock-phrases",
    group: "design",
    severity: "medium",
    effort: 2,
    title: "Body copy avoids stock AI phrases",
    fix: 'Cut stock phrases ("in today\'s fast-paced world", "delve", "look no further") and say the specific thing.',
    check(ctx) {
      const text = ctx.doc.text.toLowerCase();
      const hits = STOCK.filter((p) => countOccurrences(text, p) > 0);
      const uniq = [...new Set(hits.map((h) => h.replace("’", "'")))];
      if (uniq.length >= 2) return fail(`Stock phrases: ${uniq.join(", ")}`);
      return PASS;
    },
  },
  {
    id: "design.default-palette",
    group: "design",
    severity: "low",
    effort: 1,
    title: "Accent colour is not the framework default indigo/violet",
    fix: "Swap the stock indigo/violet accent for your own brand colour.",
    check(ctx) {
      const hex = ctx.css.match(DEFAULT_PALETTE);
      if (hex) return fail(`Default palette colour ${hex[0]}`);
      const cls = classList(ctx.doc.html).find((c) => TW_SLOP.test(c));
      if (cls) return fail(`class uses ${cls.match(TW_SLOP)[0]}`);
      return PASS;
    },
  },
].map((r) => ({ source: SRC, ...r }));

export { NA };
