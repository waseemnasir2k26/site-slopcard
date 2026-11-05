// Tiny, dependency-free HTML helpers. Good enough for audit heuristics,
// not a spec-compliant parser. Everything here is pure and synchronous.

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  copy: "©",
};

export function decodeEntities(s = "") {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code =
        e[1].toLowerCase() === "x"
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      try {
        return String.fromCodePoint(code);
      } catch {
        return m;
      }
    }
    const v = ENTITIES[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}

export function stripComments(html = "") {
  return String(html).replace(/<!--[\s\S]*?-->/g, "");
}

export function parseAttrs(src = "") {
  const attrs = {};
  const re = /([^\s=\/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1].toLowerCase();
    if (!(name in attrs))
      attrs[name] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

/** Opening tags only: [{ attrs, index, raw }] */
export function findTags(html, name) {
  const out = [];
  const re = new RegExp(`<${name}\\b([^>]*)>`, "gi");
  let m;
  while ((m = re.exec(html)))
    out.push({ attrs: parseAttrs(m[1]), index: m.index, raw: m[0] });
  return out;
}

/** Elements with inner content (non-nested match): [{ attrs, inner, index }] */
export function findElements(html, name) {
  const out = [];
  const re = new RegExp(
    `<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}\\s*>`,
    "gi",
  );
  let m;
  while ((m = re.exec(html)))
    out.push({ attrs: parseAttrs(m[1]), inner: m[2], index: m.index });
  return out;
}

export function removeNonVisible(html = "") {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, " ")
    .replace(/<template\b[\s\S]*?<\/template\s*>/gi, " ");
}

export function textOf(fragment = "") {
  return decodeEntities(removeNonVisible(fragment).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(text = "") {
  const t = String(text).trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Parse <script type="application/ld+json"> blocks. Returns { blocks, types, invalid } */
export function parseJsonLd(html) {
  const blocks = [];
  let invalid = 0;
  for (const el of findElements(html, "script")) {
    if (!/ld\+json/i.test(el.attrs.type || "")) continue;
    try {
      blocks.push(JSON.parse(el.inner.trim()));
    } catch {
      invalid++;
    }
  }
  const types = new Set();
  const nodes = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    nodes.push(n);
    const t = n["@type"];
    if (Array.isArray(t)) t.forEach((x) => types.add(String(x)));
    else if (t) types.add(String(t));
    for (const v of Object.values(n)) if (v && typeof v === "object") walk(v);
  };
  walk(blocks);
  return { blocks, types: [...types], nodes, invalid };
}
