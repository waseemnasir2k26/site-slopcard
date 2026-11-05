# Site Report Card: https://example.com/

**Grade F (56/100)** · generated 2026-11-05 · site-slopcard 1.0.0

| Area | Weight | Score | Grade | Passed | Failed | n/a |
|---|---:|---:|:---:|---:|---:|---:|
| Design (AI-slop tells) | 30 | 100 | A | 11 | 0 | 0 |
| SEO basics | 20 | 43 | F | 5 | 9 | 0 |
| AEO / AI answers | 20 | 40 | F | 2 | 6 | 0 |
| Security headers | 15 | 64 | D | 6 | 5 | 0 |
| Lead capture | 15 | 0 | F | 0 | 4 | 5 |

## Top 5 fixes

1. **Meta description present** (seo, high): No meta description
   Fix: Add <meta name="description"> with a one-sentence promise and a reason to click.
2. **Visitors have a way to contact you** (leads, high): No form, mailto:, tel:, WhatsApp or /contact link found
   Fix: Add at least one contact path on the page: a form, a mailto:, a tel: or a WhatsApp link.
3. **Entity schema (Organization / LocalBusiness / Person)** (aeo, medium): No Organization/LocalBusiness/Person entity
   Fix: Add Organization or LocalBusiness JSON-LD with name, url, logo and sameAs profiles.
4. **/llms.txt published** (aeo, medium): No usable /llms.txt
   Fix: Publish /llms.txt: a short markdown map of who you are, what you offer and your key pages.
5. **Canonical URL declared** (seo, medium): No rel=canonical link
   Fix: Add <link rel="canonical" href="https://your-domain/page"> to stop duplicate-URL dilution.

## All findings

### Design (AI-slop tells) (0)

No issues found.

### SEO basics (9)

- [medium] `seo.title-length` Title is 30-65 characters: Title is 14 chars: "Example Domain"
  - Fix: Rewrite the title to 30-65 characters so it is not truncated in results.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [high] `seo.meta-description` Meta description present: No meta description
  - Fix: Add <meta name="description"> with a one-sentence promise and a reason to click.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [low] `seo.meta-description-length` Meta description is 70-160 characters: No meta description to measure
  - Fix: Keep the description between 70 and 160 characters.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [medium] `seo.single-h1` Exactly one <h1>: 0 <h1> elements
  - Fix: Use one <h1> for the page topic; demote the others to <h2>.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [medium] `seo.canonical` Canonical URL declared: No rel=canonical link
  - Fix: Add <link rel="canonical" href="https://your-domain/page"> to stop duplicate-URL dilution.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [medium] `seo.open-graph` Open Graph title, description and image: Missing og:title, og:description, og:image
  - Fix: Add og:title, og:description and og:image so shared links render a proper card.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [low] `seo.twitter-card` Twitter/X card meta: No twitter:card meta
  - Fix: Add <meta name="twitter:card" content="summary_large_image">.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [medium] `seo.structured-data` Valid JSON-LD structured data: No JSON-LD structured data
  - Fix: Add a JSON-LD block (Organization or LocalBusiness at minimum) and make sure it parses.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [low] `seo.sitemap` sitemap.xml reachable: No sitemap.xml found
  - Fix: Publish /sitemap.xml and reference it from robots.txt.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented

### AEO / AI answers (6)

- [medium] `aeo.llms-txt` /llms.txt published: No usable /llms.txt
  - Fix: Publish /llms.txt: a short markdown map of who you are, what you offer and your key pages.
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented
- [low] `aeo.robots-txt` robots.txt present: No /robots.txt
  - Fix: Publish /robots.txt with your sitemap line and explicit rules for AI crawlers.
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented
- [medium] `aeo.faq-schema` Answer-ready schema (FAQPage / HowTo / QAPage): No FAQPage/HowTo/QAPage schema
  - Fix: Mark up your real customer questions with FAQPage JSON-LD (only questions shown on the page).
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented
- [medium] `aeo.entity-schema` Entity schema (Organization / LocalBusiness / Person): No Organization/LocalBusiness/Person entity
  - Fix: Add Organization or LocalBusiness JSON-LD with name, url, logo and sameAs profiles.
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented
- [low] `aeo.question-headings` At least one question-style heading: No H2/H3 phrased as a question
  - Fix: Phrase one or two H2/H3s as the questions buyers actually ask ("How much does X cost?").
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented
- [low] `aeo.freshness` Freshness signal (dateModified or <time>): No dateModified, <time datetime> or article:modified_time
  - Fix: Expose a last-updated date: dateModified in JSON-LD or a visible <time datetime>.
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented

### Security headers (5)

- [medium] `security.hsts` Strict-Transport-Security (6+ months): No Strict-Transport-Security header
  - Fix: Send Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented
- [medium] `security.csp` Content-Security-Policy set: No Content-Security-Policy header or meta
  - Fix: Add a Content-Security-Policy (start in Report-Only mode, then enforce).
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented
- [low] `security.nosniff` X-Content-Type-Options: nosniff: X-Content-Type-Options missing
  - Fix: Send X-Content-Type-Options: nosniff
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented
- [low] `security.referrer-policy` Referrer-Policy set: No Referrer-Policy header or meta
  - Fix: Send Referrer-Policy: strict-origin-when-cross-origin
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented
- [low] `security.frame-protection` Clickjacking protection: No X-Frame-Options or frame-ancestors
  - Fix: Send X-Frame-Options: SAMEORIGIN or CSP frame-ancestors 'self'.
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented

### Lead capture (4)

- [high] `leads.contact-path` Visitors have a way to contact you: No form, mailto:, tel:, WhatsApp or /contact link found
  - Fix: Add at least one contact path on the page: a form, a mailto:, a tel: or a WhatsApp link.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [medium] `leads.form-present` Lead form on the page: No <form> on the page
  - Fix: Add a short lead form (name, email or phone, one question) where the main CTA lands.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [medium] `leads.primary-cta` A clear call-to-action exists: No button or link with an action verb
  - Fix: Add one primary button with a verb and an outcome ("Get my free quote").
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [low] `leads.instant-channel` Instant channel (phone or WhatsApp): No tel: or WhatsApp link
  - Fix: Add a tap-to-call (tel:) or WhatsApp (wa.me) link for visitors ready to talk now.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)

## Notes

- design: partial (impeccable not available or produced no JSON, exit 1). Install it with npm i -g impeccable to add its 62 rules.

---

Generated with [site-slopcard](https://github.com/waseemnasir2k26/site-slopcard). Only scan sites you own or have permission to audit.
