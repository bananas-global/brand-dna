# Brand DNA — Master Template

An editorial, reusable source-of-truth template for documenting how a brand thinks, speaks, looks, moves, and adapts across channels.

The project serves two audiences:

- People use the tabbed website to understand the brand system and its decision logic.
- AI agents use the structured files under `public/brand/` to generate and validate brand-aligned materials.

The content is intentionally fictional and neutral. Replace the placeholders with approved client decisions; do not treat the example values as a real brand.

## What is included

- Brand essence, positioning, audiences, and decision priorities
- Expression principles and voice guidelines
- Visual, imagery, motion, sound, and data foundations
- Accessibility and ethical boundaries
- Profiles for presentations, proposals, social, web, and BI
- Machine-readable Brand DNA, tokens, channel profiles, asset manifest, and validation checklist
- Governance, status, ownership, and exception handling

The project intentionally does not include an extensive UI component library. Channel-specific components belong in their respective implementation systems.

## Run locally

Requirements: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run build
npm run lint
node --test tests/rendered-html.test.mjs
```

## Structured brand package

```text
public/brand/
├── brand-dna.yaml
├── tokens.json
├── channel-profiles.yaml
├── assets-manifest.json
└── validation-checklist.yaml
```

Keep the human-facing documentation and machine-readable files synchronized. In a conflict, truth and accessibility outrank expression; invariants outrank preferences; channel profiles may modify only properties explicitly marked as flexible.

## License

Add the open-source license selected by the project owner before redistributing the repository.
