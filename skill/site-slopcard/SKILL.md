---
name: site-slopcard
description: Grade a website A-F (AI-slop design tells, SEO, AEO, security headers, lead forms) with the site-slopcard CLI, then fix the findings in the user's OWN local repo and re-grade to show before/after. Trigger on "/site-slopcard <url>", "grade this site", "site report card", "slop check this page", "why does my site look AI-made". Do NOT use to scan sites the user does not own or have permission to audit, and never edit a live server.
---

# site-slopcard

Turn a URL into a one-page report card, then fix what it finds in code the user owns.

## Rules (hard)

1. **Permission first.** Only scan sites the user owns or has written permission to audit. If unclear, ask once.
2. **Read-only scanning.** The CLI only sends GET/HEAD, respects robots.txt, stays on one origin and waits 1 s between requests. Never add flags or scripts that submit forms or crawl further.
3. **Edit only a local repo the user owns.** Confirm the working directory is the site's source (git remote, package name or domain in config). Never edit a production server, CMS or third-party repo.
4. **Secrets.** If `security.exposed-keys` fires, do not print the key. Tell the user to rotate it, then move it server-side.
5. **Do not invent results.** Every claim you make comes from `report.json`.

## Procedure

1. Run the scan:
   ```bash
   npx site-slopcard <url> --out slopcard-out
   # offline, against the repo's built HTML:
   npx site-slopcard --file dist/index.html --out slopcard-out
   ```
   Optional: `--client "Name" --brand-color #hex` for a white-label card; `--hallmark <dir>` if the user has a hallmark checkout. impeccable is used automatically when it is installed.
2. Read `slopcard-out/report.json`. Start with `topFixes` (already ranked by impact and effort), then `findings`. Each finding has `id`, `group`, `severity`, `evidence`, `fix`, `source`.
3. Propose a short plan (max 5 items) and wait for a yes before multi-file edits.
4. Apply fixes in the local repo. Mapping guide:
   | Finding id | Where to fix |
   |---|---|
   | `design.*` | global CSS / Tailwind config / hero component copy |
   | `seo.*` | `<head>` template, layout component, metadata API |
   | `aeo.*` | `public/llms.txt`, `public/robots.txt`, JSON-LD component, first paragraph copy |
   | `security.*` | host config (`vercel.json`, `_headers`, `netlify.toml`, `.htaccess`, nginx) |
   | `leads.*` | contact/quote form component and its handler |
5. Re-run the scan (on a local build or `http://localhost:<port>`), then:
   ```bash
   npx site-slopcard compare before/report.json slopcard-out/report.json --out slopcard-out
   ```
   Report the headline (`F 22 -> A 94`) and what is still open.

## Fix vocabulary for design findings

Paraphrased and inspired by Leonxlnx/taste-skill (MIT) and the FAIL / REFLEX / WARN tiers of Nutlope/hallmark (MIT). No text is quoted from either project.

- **Commit to a point of view.** One display face with character plus one quiet text face beats Inter everywhere.
- **Colour from the brand, not the framework.** Pull the accent from the logo, product or photography; drop default indigo/violet and purple-to-cyan gradients.
- **Emphasis through hierarchy.** Size, weight and spacing carry a headline; gradient-filled text and glow do not.
- **Concrete copy.** Name the customer and the outcome ("Plumber at your door in 60 minutes"). Cut "unlock", "seamless", "elevate", "supercharge".
- **Fewer ornaments.** Remove emoji bullets, tracked all-caps eyebrows above every heading, and frosted blur cards unless they serve the content.
- **Rhythm over decoration.** Consistent spacing scale, real content widths, one primary CTA per view.

## Output to the user

- Grade and score before and after, the five fixes made (file + one line each), and anything left for them (DNS, host headers, copy decisions).
- Path to `report.html` (printable, send-to-client ready) and `compare.html`.
