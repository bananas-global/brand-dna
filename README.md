# Brand DNA — Minimum Viable Source of Truth

An open-source starter for turning a short designer brief and any available brand materials into a useful Brand DNA for people and AI agents.

Live site: [bananas-global.github.io/brand-dna](https://bananas-global.github.io/brand-dna/)

The project deliberately keeps the workflow small:

```text
references + 8 questions → brand-dna.json → website
```

Start with [START-HERE.md](START-HERE.md).

## What is included

- One project-local Codex skill: `$brand-dna-builder`
- One folder for optional source material: `references/`
- One canonical brand file: `public/brand/brand-dna.json`
- One navigable, responsive website that reads the canonical file directly
- One static Vite + React build with no application server or database
- Brand essence, expression, voice, visual identity, imagery, motion, data, accessibility, and channel behavior
- Basic color, typography, spacing, radius, shadow, and motion tokens
- Explicit provenance: evidence, decisions, proposals, and missing items

UI component libraries, approval workflows, ownership models, and review schedules are intentionally outside the scope.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Because the production site lives below the repository path, local navigation also uses `/brand-dna/`.

To preview the production build exactly as GitHub Pages serves it:

```bash
npm run build
npm run preview
```

## Validate

```bash
npm test
npm run lint
```

`npm test` creates `dist/index.html`, exercises the tab keyboard behavior, and verifies the static assets and canonical JSON copy.

## Deployment

Pushes to `main` run the GitHub Pages workflow in `.github/workflows/pages.yml`. It installs the locked dependencies, lints, builds, tests, uploads `dist/`, and deploys the static artifact to the live URL above.

The Vite base path is `/brand-dna/`, so bundled fonts, the favicon, the Open Graph image, and the downloadable JSON all resolve from the repository subpath.

## License

[MIT](LICENSE)
