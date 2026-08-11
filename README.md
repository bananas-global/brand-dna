# Brand DNA — Minimum Viable Source of Truth

An open-source starter for turning a short designer brief and any available brand materials into a useful Brand DNA for people and AI agents.

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

Open `http://localhost:3000`.

## Validate

```bash
npm test
npm run lint
```

## License

[MIT](LICENSE)
