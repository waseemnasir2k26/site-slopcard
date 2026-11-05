# Site Report Card: examples/bad-site/index.html

**Grade F (23/100)** · generated 2026-11-05 · site-slopcard 1.0.1

| Area | Weight | Score | Grade | Passed | Failed | n/a |
|---|---:|---:|:---:|---:|---:|---:|
| Design (AI-slop tells) | 30 | 0 | F | 0 | 11 | 0 |
| SEO basics | 20 | 29 | F | 2 | 11 | 0 |
| AEO / AI answers | 20 | 40 | F | 2 | 6 | 0 |
| Security headers | 15 | 10 | F | 1 | 3 | 7 |
| Lead capture | 15 | 50 | F | 3 | 5 | 1 |

## Top 5 fixes

1. **Headline copy is free of AI buzzwords** (design, high): Buzzwords in headings: unlock, elevate, seamless, supercharge, effortless, effortlessly
   Fix: Rewrite the headline as a concrete outcome for a named customer ("Plumber at your door in 60 minutes"), not "Unlock seamless..."
2. **No template placeholder copy left in** (design, high): Found "Lorem ipsum"
   Fix: Replace every placeholder (lorem ipsum, "Your Company", sample names) with real copy.
3. **Meta description present** (seo, high): No meta description
   Fix: Add <meta name="description"> with a one-sentence promise and a reason to click.
4. **Typeface is not the default AI pick** (design, medium): Only default fonts declared: inter
   Fix: Pick a typeface with a point of view (a characterful serif or grotesk) and keep Inter/Roboto for UI text only, if at all.
5. **Lists do not lead with emoji** (design, medium): 4 items start with emoji, e.g. "🚀 Blazing fast — out of the box"
   Fix: Replace emoji bullets with plain bullets, numbers or a real icon set used sparingly.

## All findings

### Design (AI-slop tells) (11)

- [medium] `design.default-font` Typeface is not the default AI pick: Only default fonts declared: inter
  - Fix: Pick a typeface with a point of view (a characterful serif or grotesk) and keep Inter/Roboto for UI text only, if at all.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [high] `design.purple-gradient` No purple/violet "AI gradient": gradient(135deg, #7c3aed 0%, #6366f1 50%, #06b6d4 100% ))
  - Fix: Replace the purple-to-blue gradient with a flat brand colour or a palette pulled from your product or photography.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [medium] `design.gradient-text` Headlines are not gradient-filled text: CSS uses background-clip: text
  - Fix: Set headline text in one solid colour; let weight, size and spacing carry emphasis.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.tracked-eyebrow` No tracked all-caps "eyebrow" labels: uppercase + letter-spacing 0.2em
  - Fix: Drop the small uppercase eyebrow above each heading, or keep one, at most, with normal letter spacing.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [medium] `design.emoji-bullets` Lists do not lead with emoji: 4 items start with emoji, e.g. "🚀 Blazing fast — out of the box"
  - Fix: Replace emoji bullets with plain bullets, numbers or a real icon set used sparingly.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [high] `design.hero-buzzwords` Headline copy is free of AI buzzwords: Buzzwords in headings: unlock, elevate, seamless, supercharge, effortless, effortlessly
  - Fix: Rewrite the headline as a concrete outcome for a named customer ("Plumber at your door in 60 minutes"), not "Unlock seamless..."
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.glassmorphism` No default glassmorphism blur panels: CSS uses backdrop-filter: blur
  - Fix: Use solid surfaces with a clear border instead of frosted blur cards.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [high] `design.placeholder-copy` No template placeholder copy left in: Found "Lorem ipsum"
  - Fix: Replace every placeholder (lorem ipsum, "Your Company", sample names) with real copy.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.em-dash-density` Em dashes are not overused in copy: 7 em dashes in 82 words
  - Fix: Rewrite most em dashes as full stops or commas; heavy em-dash use reads as machine-written.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [medium] `design.stock-phrases` Body copy avoids stock AI phrases: Stock phrases: in today's fast-paced, delve, tapestry, look no further
  - Fix: Cut stock phrases ("in today's fast-paced world", "delve", "look no further") and say the specific thing.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)
- [low] `design.default-palette` Accent colour is not the framework default indigo/violet: Default palette colour #7c3aed
  - Fix: Swap the stock indigo/violet accent for your own brand colour.
  - Source: site-slopcard heuristic (tell list informed by Nutlope/hallmark + Leonxlnx/taste-skill, MIT)

### SEO basics (11)

- [medium] `seo.title-length` Title is 30-65 characters: Title is 8 chars: "NovaFlow"
  - Fix: Rewrite the title to 30-65 characters so it is not truncated in results.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [high] `seo.meta-description` Meta description present: No meta description
  - Fix: Add <meta name="description"> with a one-sentence promise and a reason to click.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [low] `seo.meta-description-length` Meta description is 70-160 characters: No meta description to measure
  - Fix: Keep the description between 70 and 160 characters.
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
- [medium] `seo.img-alt` Images have alt text (90%+): 0/2 images have alt (0%)
  - Fix: Give every meaningful image a descriptive alt; use alt="" for pure decoration.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [low] `seo.html-lang` <html lang> set: No lang attribute on <html>
  - Fix: Add lang="en" (or your language) to the <html> tag.
  - Source: AgriciDaniel/claude-seo (MIT) seo-audit checklist, reimplemented
- [medium] `seo.viewport` Mobile viewport meta: No viewport meta
  - Fix: Add <meta name="viewport" content="width=device-width, initial-scale=1">.
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

### Security headers (3)

- [medium] `security.mixed-content` No mixed (http://) content: 1 http:// resource(s), e.g. http://images.example.com/hero-dashboard.png
  - Fix: Load every script, stylesheet, image and iframe over https://.
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented
- [high] `security.exposed-keys` No secret-shaped keys in page source: OpenAI-style secret key: sk-F…(38 chars); Google API key: AIza…(36 chars); Slack token: xoxb…(36 chars)
  - Fix: Move secrets server-side, rotate any exposed key now, and restrict public browser keys by referrer.
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented
- [low] `security.sri` Public CDN scripts use Subresource Integrity: 1 CDN script(s) without integrity, e.g. cdn.jsdelivr.net
  - Fix: Add integrity="sha384-..." crossorigin="anonymous" to scripts loaded from public CDNs.
  - Source: cloudflare/security-audit-skill (MIT) CLIENT-SIDE checklist, reimplemented

### Lead capture (5)

- [high] `leads.form-action` Forms point somewhere real: 1 form(s) with action="#"
  - Fix: Give every form a real action (your handler or form service), not "#" or javascript:.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [medium] `leads.input-labels` Form fields are labelled: 1/1 fields without a label
  - Fix: Give every field a <label for>, aria-label or wrapping <label> so screen readers and autofill work.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [low] `leads.email-type` Email fields use type="email": 1 email field(s) not type="email"
  - Fix: Set type="email" on email fields for validation and the right mobile keyboard.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [medium] `leads.primary-cta` A clear call-to-action exists: No button or link with an action verb
  - Fix: Add one primary button with a verb and an outcome ("Get my free quote").
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)
- [low] `leads.instant-channel` Instant channel (phone or WhatsApp): No tel: or WhatsApp link
  - Fix: Add a tap-to-call (tel:) or WhatsApp (wa.me) link for visitors ready to talk now.
  - Source: waseemnasir2k26/lead-leak-audit (MIT) form discovery, reimplemented (detection only)

## Notes

- offline file mode: header checks use headers.json when present, otherwise they are marked n/a
- design: partial (impeccable needs a URL; serve the file and scan http://localhost to add its rules)

---

Generated with [site-slopcard](https://github.com/waseemnasir2k26/site-slopcard). Only scan sites you own or have permission to audit.
