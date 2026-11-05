# Before / after: examples/bad-site/index.html -> examples/good-site/index.html

**F 22 -> A 100 (+78)**

| Area | Before | After |
|---|---:|---:|
| Design (AI-slop tells) | 0 | 100 |
| SEO basics | 25 | 100 |
| AEO / AI answers | 40 | 100 |
| Security headers | 10 | 100 |
| Lead capture | 50 | 100 |

## Fixed (37)

- `design.default-font` Typeface is not the default AI pick
- `design.purple-gradient` No purple/violet "AI gradient"
- `design.gradient-text` Headlines are not gradient-filled text
- `design.tracked-eyebrow` No tracked all-caps "eyebrow" labels
- `design.emoji-bullets` Lists do not lead with emoji
- `design.hero-buzzwords` Headline copy is free of AI buzzwords
- `design.glassmorphism` No default glassmorphism blur panels
- `design.placeholder-copy` No template placeholder copy left in
- `design.em-dash-density` Em dashes are not overused in copy
- `design.stock-phrases` Body copy avoids stock AI phrases
- `design.default-palette` Accent colour is not the framework default indigo/violet
- `seo.title-length` Title is 30-65 characters
- `seo.meta-description` Meta description present
- `seo.meta-description-length` Meta description is 70-160 characters
- `seo.single-h1` Exactly one <h1>
- `seo.canonical` Canonical URL declared
- `seo.open-graph` Open Graph title, description and image
- `seo.twitter-card` Twitter/X card meta
- `seo.structured-data` Valid JSON-LD structured data
- `seo.img-alt` Images have alt text (90%+)
- `seo.html-lang` <html lang> set
- `seo.viewport` Mobile viewport meta
- `seo.sitemap` sitemap.xml reachable
- `aeo.llms-txt` /llms.txt published
- `aeo.robots-txt` robots.txt present
- `aeo.faq-schema` Answer-ready schema (FAQPage / HowTo / QAPage)
- `aeo.entity-schema` Entity schema (Organization / LocalBusiness / Person)
- `aeo.question-headings` At least one question-style heading
- `aeo.freshness` Freshness signal (dateModified or <time>)
- `security.mixed-content` No mixed (http://) content
- `security.exposed-keys` No secret-shaped keys in page source
- `security.sri` Public CDN scripts use Subresource Integrity
- `leads.form-action` Forms point somewhere real
- `leads.input-labels` Form fields are labelled
- `leads.email-type` Email fields use type="email"
- `leads.primary-cta` A clear call-to-action exists
- `leads.instant-channel` Instant channel (phone or WhatsApp)

---

Generated with [site-slopcard](https://github.com/waseemnasir2k26/site-slopcard).
