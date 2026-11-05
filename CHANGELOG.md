# Changelog

## 1.0.0 (2026-11-05)

- First release.
- 53 deterministic rules in five groups: design (AI-slop tells), SEO, AEO, security headers, lead capture.
- A-F grade (weights 30/20/20/15/15) and top 5 fixes ranked by impact and effort.
- Printable one-page HTML report card with `--client` and `--brand-color` white-labelling, plus Markdown and JSON.
- `compare <before.json> <after.json>` before/after card.
- Offline `--file` mode reading sibling robots.txt, llms.txt, sitemap.xml, headers.json and local CSS.
- Optional adapters: impeccable (called via `npx --no-install`) and hallmark sloplint (from your checkout).
- Polite fetch layer: GET/HEAD only, same-origin, robots.txt respected, 1 request per second, 10 s timeout.
- Secret-shaped strings redacted to 4 chars plus length in every output.
- Claude Code skill in `skill/site-slopcard/`.
