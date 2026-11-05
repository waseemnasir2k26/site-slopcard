# Third-party notices

site-slopcard is MIT-licensed (see `LICENSE`). It stands on the work below. Licences were checked on 2026-11-05 against each upstream repository.

**No third-party code is vendored in this repository.** Optional tools are _called_ at runtime only if you have installed them, and checklist ideas are _reimplemented_ in our own code and words. Each rule's `source` field in the report names the checklist it came from.

| Project                                                                               | Licence    | Copyright                                | How site-slopcard uses it                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | ---------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable)                           | Apache-2.0 | Copyright 2025 Paul Bakaus               | **Called**, never copied. When installed, we run `npx --no-install impeccable detect <url> --json` and map its JSON findings into the design group. We never download it for you.                                            |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark)                               | MIT        | Copyright (c) 2026 Hallmark contributors | **Called** from a checkout you supply (`--hallmark <dir>`): we run its `skills/hallmark/scripts/sloplint.mjs --json` on a temporary HTML snapshot. Its FAIL / REFLEX / WARN tiers inform our severity mapping. Not vendored. |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)                       | MIT        | Copyright (c) 2026 Leonxlnx              | **Inspiration** for the design-fix vocabulary in `skill/site-slopcard/SKILL.md`. Paraphrased in our own words; no text or code copied.                                                                                       |
| [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo)                 | MIT        | Copyright (c) 2026 agricidaniel          | **Reimplemented**: SEO and AEO checklist ideas (title/meta, canonical, Open Graph, schema, llms.txt, robots rules for AI crawlers) rebuilt as our own deterministic checks in `src/checks/seo.js` and `src/checks/aeo.js`.   |
| [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | MIT        | Copyright (c) 2025-2026 Cloudflare, Inc. | **Reimplemented**: client-side checklist ideas (HSTS, CSP, mixed content, keys exposed in page JS, third-party scripts) rebuilt as passive header and HTML checks in `src/checks/security.js`.                               |
| [waseemnasir2k26/lead-leak-audit](https://github.com/waseemnasir2k26/lead-leak-audit) | MIT        | Copyright (c) 2026 SkynetLabs             | Own project. Form-discovery idea reimplemented in `src/checks/leads.js`, detection only (no form is ever submitted).                                                                                                         |

## impeccable upstream credits

impeccable's `NOTICE.md` credits [ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills) (MIT, by ehmo) for its iOS and Android platform reference files. site-slopcard does not include or redistribute any of that material; we note it so the credit chain stays visible. Because impeccable is invoked and not copied, no Apache-2.0 NOTICE file is redistributed here.

## Trademarks and naming

Project names above belong to their owners. site-slopcard "works with impeccable" and "works with hallmark"; it is not affiliated with or endorsed by either project, Cloudflare, or any other upstream.

## If you vendor anything later

Copy the file unmodified into `vendor/<project>/`, keep its original `LICENSE` file and copyright header beside it, record the source commit SHA in `vendor/<project>/SOURCE.md`, and add a row above.
