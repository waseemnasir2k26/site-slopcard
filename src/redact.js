// Secret-shaped string detection + redaction.
// Rule: never print a full secret-like value. Keep 4 chars + the length.

export const KEY_PATTERNS = [
  {
    name: "OpenAI-style secret key",
    re: /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}/g,
  },
  { name: "Stripe secret key", re: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/g },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{30,}/g },
  { name: "Slack token", re: /\bxox[abposr]-[A-Za-z0-9-]{10,}/g },
  {
    name: "GitHub token",
    re: /\b(?:ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{20,}/g,
  },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    name: "Private key block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

export function redactValue(v) {
  const s = String(v);
  return `${s.slice(0, 4)}…(${s.length} chars)`;
}

/** Find secret-like strings. Returns [{ kind, redacted }] (never the raw value). */
export function findSecrets(text = "") {
  const hits = [];
  const seen = new Set();
  for (const { name, re } of KEY_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (seen.has(m[0])) continue;
      seen.add(m[0]);
      hits.push({ kind: name, redacted: redactValue(m[0]) });
    }
  }
  return hits;
}

/** Belt and braces: scrub any secret-shaped substring from an output string. */
export function scrub(text = "") {
  let out = String(text);
  for (const { re } of KEY_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, (m) => redactValue(m));
  }
  return out;
}
