# Start here

This template turns a short brief—and whatever brand material already exists—into one usable Brand DNA.

## 1. Add what you have

Drop websites, decks, PDFs, logos, screenshots, images, or notes into `references/`. Leave the folder empty if you are starting from zero.

## 2. Start the builder

Open the project in Codex and send:

> Use $brand-dna-builder to build my Brand DNA.

The builder detects the available material automatically. There is no setup mode to choose.

## 3. Answer only what is missing

Everything supplied as reference material is treated as something to preserve. There is no fixed questionnaire. After reading the material, the builder asks at most two questions when needed:

1. What should the identity look and feel like?
2. What should the identity not look or feel like?

Questions already answered by reliable references are skipped. If the material is sufficient, the builder starts without asking anything.

Applications are always designed for web pages, presentations, BI dashboards, and social media cards/posts.

## 4. Review the result

The builder updates `public/brand/brand-dna.json`. The website reads that file directly and shows the result as a navigable Brand DNA.

Every field is treated as **evidence**, **decision**, **proposal**, or **missing**, so an AI recommendation never silently becomes a brand fact.

Use **Edit** in the website header for visual fine-tuning. Controls update a browser-only draft and the live preview. Compare it with the original, then use **Copy update prompt** and send that prompt back to Codex. The builder applies only the listed changes to `public/brand/brand-dna.json`; no backend is required.

To view it:

```bash
npm install
npm run dev
```

Open the exact local URL printed by Vite, including `/brand-dna/`.
