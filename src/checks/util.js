// Shared rule helpers.
export const PASS = true;
export const NA = "na";
export const fail = (evidence) => ({ evidence: String(evidence) });

export const SEVERITY_WEIGHT = { high: 5, medium: 3, low: 1 };

export function trunc(s, n = 90) {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

// ---- colour helpers (design checks) ----
const NAMED = {
  purple: "#800080",
  violet: "#ee82ee",
  indigo: "#4b0082",
  fuchsia: "#ff00ff",
  magenta: "#ff00ff",
  blueviolet: "#8a2be2",
  mediumpurple: "#9370db",
  darkviolet: "#9400d3",
  rebeccapurple: "#663399",
  orchid: "#da70d6",
  plum: "#dda0dd",
};

export function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4)
    h = h
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Extract colours from a CSS value string as HSL triples. */
export function colorsIn(value) {
  const out = [];
  const v = String(value).toLowerCase();
  for (const m of v.matchAll(/#[0-9a-f]{3,8}\b/g)) {
    const rgb = hexToRgb(m[0]);
    if (rgb) out.push(rgbToHsl(rgb));
  }
  for (const m of v.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g))
    out.push(rgbToHsl([+m[1], +m[2], +m[3]]));
  for (const m of v.matchAll(
    /hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/g,
  ))
    out.push([((+m[1] % 360) + 360) % 360, +m[2] / 100, +m[3] / 100]);
  for (const [name, hex] of Object.entries(NAMED))
    if (new RegExp(`\\b${name}\\b`).test(v)) out.push(rgbToHsl(hexToRgb(hex)));
  return out;
}

export const isPurple = ([h, s, l]) =>
  h >= 250 && h <= 315 && s >= 0.3 && l > 0.12 && l < 0.9;

/** CSS rule bodies: ['color:red; ...', ...] */
export function cssBlocks(css) {
  return [...String(css).matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
}

export function classList(html) {
  const out = [];
  for (const m of String(html).matchAll(
    /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
  ))
    out.push(m[1] ?? m[2]);
  return out;
}

export function sameHost(a, b) {
  const strip = (h) => h.replace(/^www\./, "");
  return strip(a) === strip(b);
}
