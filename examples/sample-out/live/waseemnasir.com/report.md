# Site Report Card: https://www.waseemnasir.com/

**Grade A (92/100)** · generated 2026-11-05 · site-slopcard 1.0.0

| Area | Weight | Score | Grade | Passed | Failed | n/a |
|---|---:|---:|:---:|---:|---:|---:|
| Design (AI-slop tells) | 30 | 90 | A | 8 | 3 | 0 |
| SEO basics | 20 | 100 | A | 14 | 0 | 0 |
| AEO / AI answers | 20 | 95 | A | 7 | 1 | 0 |
| Security headers | 15 | 100 | A | 11 | 0 | 0 |
| Lead capture | 15 | 75 | C | 3 | 1 | 5 |

## Top 5 fixes

1. **Em dashes are not overused in copy** (design, low): 31 em dashes in 1696 words
   Fix: Rewrite most em dashes as full stops or commas; heavy em-dash use reads as machine-written.
2. **No default glassmorphism blur panels** (design, low): CSS uses backdrop-filter: blur
   Fix: Use solid surfaces with a clear border instead of frosted blur cards.
3. **No tracked all-caps "eyebrow" labels** (design, low): uppercase + letter-spacing .18em
   Fix: Drop the small uppercase eyebrow above each heading, or keep one, at most, with normal letter spacing.
4. **Lead form on the page** (leads, medium): No <form> on the page
   Fix: Add a short lead form (name, email or phone, one question) where the main CTA lands.
5. **Freshness signal (dateModified or <time>)** (aeo, low): No dateModified, <time datetime> or article:modified_time
   Fix: Expose a last-updated date: dateModified in JSON-LD or a visible <time datetime>.

## All findings

### Design (AI-slop tells) (3)

- [low] `design.tracked-eyebrow` No tracked all-caps "eyebrow" labels: uppercase + letter-spacing .18em
  - Fix: Drop the small uppercase eyebrow above each heading, or keep one, at most, with normal letter spacing.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.glassmorphism` No default glassmorphism blur panels: CSS uses backdrop-filter: blur
  - Fix: Use solid surfaces with a clear border instead of frosted blur cards.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.em-dash-density` Em dashes are not overused in copy: 31 em dashes in 1696 words
  - Fix: Rewrite most em dashes as full stops or commas; heavy em-dash use reads as machine-written.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)

### SEO basics (0)

No issues found.

### AEO / AI answers (1)

- [low] `aeo.freshness` Freshness signal (dateModified or <time>): No dateModified, <time datetime> or article:modified_time
  - Fix: Expose a last-updated date: dateModified in JSON-LD or a visible <time datetime>.
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented

### Security headers (0)

No issues found.

### Lead capture (1)

- [medium] `leads.form-present` Lead form on the page: No <form> on the page
  - Fix: Add a short lead form (name, email or phone, one question) where the main CTA lands.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)

## Notes

- design: partial (impeccable not available or produced no JSON, exit 1). Install it with npm i -g impeccable to add its 62 rules.

---

Generated with [site-slopcard](https://github.com/waseemnasir2k26/site-slopcard). Only scan sites you own or have permission to audit.
