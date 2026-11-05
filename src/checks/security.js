// Passive, read-only client-side security checks. Items reimplemented from the ideas in
// cloudflare/security-audit-skill (MIT) CLIENT-SIDE.md checklist. No code copied.
// Nothing here sends anything: we only read the response headers and HTML we already have.
import { PASS, NA, fail, trunc } from "./util.js";
import { findSecrets } from "../redact.js";

const SRC =
  "cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented";
const CDN_HOSTS =
  /(^|\.)(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|code\.jquery\.com|stackpath\.bootstrapcdn\.com|maxcdn\.bootstrapcdn\.com)$/i;

const header = (ctx, name) => (ctx.headers ? ctx.headers[name] : undefined);
const metaCsp = (ctx) =>
  ctx.doc.metas.find(
    (m) => (m["http-equiv"] || "").toLowerCase() === "content-security-policy",
  );

function externalScripts(ctx) {
  const out = [];
  for (const s of ctx.doc.scriptTags) {
    if (!s.src) continue;
    let u;
    try {
      u = new URL(
        s.src,
        ctx.pageUrl ? ctx.pageUrl.href : "https://local.invalid/",
      );
    } catch {
      continue;
    }
    const pageHost =
      ctx.pageUrl && /^https?:$/.test(ctx.pageUrl.protocol)
        ? ctx.pageUrl.hostname
        : "local.invalid";
    if (u.hostname !== pageHost && /^https?:$/.test(u.protocol))
      out.push({ host: u.hostname, attrs: s });
  }
  return out;
}

export const securityRules = [
  {
    id: "security.https",
    severity: "high",
    effort: 2,
    title: "Served over HTTPS",
    fix: "Serve the site over HTTPS and redirect http:// to https://.",
    check(ctx) {
      if (ctx.mode !== "url") return NA;
      return ctx.pageUrl && ctx.pageUrl.protocol === "https:"
        ? PASS
        : fail(`Final URL is ${ctx.url}`);
    },
  },
  {
    id: "security.hsts",
    severity: "medium",
    effort: 1,
    title: "Strict-Transport-Security (6+ months)",
    fix: "Send Strict-Transport-Security: max-age=31536000; includeSubDomains",
    check(ctx) {
      if (!ctx.headers) return NA;
      const v = header(ctx, "strict-transport-security");
      if (!v) return fail("No Strict-Transport-Security header");
      const age = +(v.match(/max-age=(\d+)/i) || [])[1] || 0;
      return age >= 15552000 ? PASS : fail(`max-age=${age} (under 6 months)`);
    },
  },
  {
    id: "security.csp",
    severity: "medium",
    effort: 3,
    title: "Content-Security-Policy set",
    fix: "Add a Content-Security-Policy (start in Report-Only mode, then enforce).",
    check(ctx) {
      if (metaCsp(ctx)) return PASS;
      if (!ctx.headers) return NA;
      return header(ctx, "content-security-policy")
        ? PASS
        : fail("No Content-Security-Policy header or meta");
    },
  },
  {
    id: "security.nosniff",
    severity: "low",
    effort: 1,
    title: "X-Content-Type-Options: nosniff",
    fix: "Send X-Content-Type-Options: nosniff",
    check(ctx) {
      if (!ctx.headers) return NA;
      return /nosniff/i.test(header(ctx, "x-content-type-options") || "")
        ? PASS
        : fail("X-Content-Type-Options missing");
    },
  },
  {
    id: "security.referrer-policy",
    severity: "low",
    effort: 1,
    title: "Referrer-Policy set",
    fix: "Send Referrer-Policy: strict-origin-when-cross-origin",
    check(ctx) {
      if (ctx.doc.meta("name", "referrer")) return PASS;
      if (!ctx.headers) return NA;
      return header(ctx, "referrer-policy")
        ? PASS
        : fail("No Referrer-Policy header or meta");
    },
  },
  {
    id: "security.frame-protection",
    severity: "low",
    effort: 1,
    title: "Clickjacking protection",
    fix: "Send X-Frame-Options: SAMEORIGIN or CSP frame-ancestors 'self'.",
    check(ctx) {
      if (!ctx.headers) return NA;
      const csp = header(ctx, "content-security-policy") || "";
      return header(ctx, "x-frame-options") || /frame-ancestors/i.test(csp)
        ? PASS
        : fail("No X-Frame-Options or frame-ancestors");
    },
  },
  {
    id: "security.version-leak",
    severity: "low",
    effort: 1,
    title: "Server software version not advertised",
    fix: "Strip version numbers from the Server and X-Powered-By headers.",
    check(ctx) {
      if (!ctx.headers) return NA;
      const leaks = ["server", "x-powered-by"]
        .map((h) => [h, header(ctx, h)])
        .filter(([, v]) => v && /\d/.test(v));
      return leaks.length
        ? fail(leaks.map(([h, v]) => `${h}: ${trunc(v, 40)}`).join("; "))
        : PASS;
    },
  },
  {
    id: "security.mixed-content",
    severity: "medium",
    effort: 1,
    title: "No mixed (http://) content",
    fix: "Load every script, stylesheet, image and iframe over https://.",
    check(ctx) {
      if (
        ctx.mode === "url" &&
        ctx.pageUrl &&
        ctx.pageUrl.protocol !== "https:"
      )
        return NA;
      const hits = [];
      for (const m of ctx.doc.html.matchAll(
        /<(script|img|iframe|source|video|audio|link)\b[^>]*?\s(?:src|href)\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi,
      )) {
        if (/^http:\/\/(localhost|127\.0\.0\.1)/i.test(m[2])) continue;
        if (
          m[1].toLowerCase() === "link" &&
          !/stylesheet|preload|icon/i.test(m[0])
        )
          continue;
        hits.push(m[2]);
      }
      return hits.length
        ? fail(`${hits.length} http:// resource(s), e.g. ${trunc(hits[0], 60)}`)
        : PASS;
    },
  },
  {
    id: "security.exposed-keys",
    severity: "high",
    effort: 2,
    title: "No secret-shaped keys in page source",
    fix: "Move secrets server-side, rotate any exposed key now, and restrict public browser keys by referrer.",
    check(ctx) {
      const hits = findSecrets(ctx.doc.raw);
      return hits.length
        ? fail(hits.map((h) => `${h.kind}: ${h.redacted}`).join("; "))
        : PASS;
    },
  },
  {
    id: "security.third-party-scripts",
    severity: "low",
    effort: 2,
    title: "Third-party script hosts kept to 8 or fewer",
    fix: "Audit third-party tags; drop the ones nobody reads and self-host the rest.",
    check(ctx) {
      const hosts = [...new Set(externalScripts(ctx).map((s) => s.host))];
      return hosts.length > 8
        ? fail(`${hosts.length} third-party script hosts`)
        : PASS;
    },
  },
  {
    id: "security.sri",
    severity: "low",
    effort: 1,
    title: "Public CDN scripts use Subresource Integrity",
    fix: 'Add integrity="sha384-..." crossorigin="anonymous" to scripts loaded from public CDNs.',
    check(ctx) {
      const bad = externalScripts(ctx).filter(
        (s) => CDN_HOSTS.test(s.host) && !s.attrs.integrity,
      );
      return bad.length
        ? fail(
            `${bad.length} CDN script(s) without integrity, e.g. ${bad[0].host}`,
          )
        : PASS;
    },
  },
].map((r) => ({ group: "security", source: SRC, ...r }));
