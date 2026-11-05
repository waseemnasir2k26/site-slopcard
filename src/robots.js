// Minimal robots.txt parser (groups, Allow/Disallow, * and $ wildcards, longest match wins).

export function parseRobots(txt = "") {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  const sitemaps = [];
  for (const rawLine of String(txt).split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (!current) continue;
    if (key === "allow" || key === "disallow")
      current.rules.push({ allow: key === "allow", path: value });
  }
  return { groups, sitemaps };
}

function groupFor(parsed, ua) {
  const name = ua.toLowerCase();
  let best = null;
  let bestLen = -1;
  for (const g of parsed.groups) {
    for (const a of g.agents) {
      if (a !== "*" && name.includes(a) && a.length > bestLen) {
        best = g;
        bestLen = a.length;
      }
    }
  }
  if (best) return best;
  return parsed.groups.find((g) => g.agents.includes("*")) || null;
}

function patternToRegex(p) {
  const anchored = p.endsWith("$");
  const body = (anchored ? p.slice(0, -1) : p)
    .replace(/[.+?^{}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + body + (anchored ? "$" : ""));
}

export function isAllowed(parsed, ua, path = "/") {
  if (!parsed) return true;
  const g = groupFor(parsed, ua);
  if (!g) return true;
  let verdict = true;
  let len = -1;
  for (const r of g.rules) {
    if (r.path === "") {
      if (!r.allow && len < 0) {
        verdict = true;
      }
      continue;
    }
    if (patternToRegex(r.path).test(path) && r.path.length >= len) {
      if (r.path.length > len || r.allow) verdict = r.allow;
      len = r.path.length;
    }
  }
  return verdict;
}
