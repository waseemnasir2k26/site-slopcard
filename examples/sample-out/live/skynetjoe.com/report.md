# Site Report Card: https://skynetjoe.com/

**Grade B (89/100)** · generated 2026-11-05 · site-slopcard 1.0.0

| Area | Weight | Score | Grade | Passed | Failed | n/a |
|---|---:|---:|:---:|---:|---:|---:|
| Design (AI-slop tells) | 30 | 81 | B | 7 | 4 | 0 |
| SEO basics | 20 | 100 | A | 14 | 0 | 0 |
| AEO / AI answers | 20 | 90 | A | 6 | 2 | 0 |
| Security headers | 15 | 100 | A | 11 | 0 | 0 |
| Lead capture | 15 | 75 | C | 3 | 1 | 5 |

## Top 5 fixes

1. **Headlines are not gradient-filled text** (design, medium): CSS uses background-clip: text
   Fix: Set headline text in one solid colour; let weight, size and spacing carry emphasis.
2. **Em dashes are not overused in copy** (design, low): 21 em dashes in 941 words
   Fix: Rewrite most em dashes as full stops or commas; heavy em-dash use reads as machine-written.
3. **No default glassmorphism blur panels** (design, low): CSS uses backdrop-filter: blur
   Fix: Use solid surfaces with a clear border instead of frosted blur cards.
4. **No tracked all-caps "eyebrow" labels** (design, low): uppercase + letter-spacing 0.16em
   Fix: Drop the small uppercase eyebrow above each heading, or keep one, at most, with normal letter spacing.
5. **Lead form on the page** (leads, medium): No <form> on the page
   Fix: Add a short lead form (name, email or phone, one question) where the main CTA lands.

## All findings

### Design (AI-slop tells) (4)

- [medium] `design.gradient-text` Headlines are not gradient-filled text: CSS uses background-clip: text
  - Fix: Set headline text in one solid colour; let weight, size and spacing carry emphasis.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.tracked-eyebrow` No tracked all-caps "eyebrow" labels: uppercase + letter-spacing 0.16em
  - Fix: Drop the small uppercase eyebrow above each heading, or keep one, at most, with normal letter spacing.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.glassmorphism` No default glassmorphism blur panels: CSS uses backdrop-filter: blur
  - Fix: Use solid surfaces with a clear border instead of frosted blur cards.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.em-dash-density` Em dashes are not overused in copy: 21 em dashes in 941 words
  - Fix: Rewrite most em dashes as full stops or commas; heavy em-dash use reads as machine-written.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)

### SEO basics (0)

No issues found.

### AEO / AI answers (2)

- [low] `aeo.question-headings` At least one question-style heading: No H2/H3 phrased as a question
  - Fix: Phrase one or two H2/H3s as the questions buyers actually ask ("How much does X cost?").
  - Source: AgriciDaniel/claude-seo (MIT) seo-agentic checklist, reimplemented
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
