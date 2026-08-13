# Brand DNA — Minimum Viable Source of Truth

An open-source, browser-guided starter for building a useful Brand DNA for people and AI agents.

The starter ships with the Bananas studio identity as its working example. Its colors, typography, logo system, and visual decisions demonstrate the format in a real brand while every asset and token remains replaceable for another identity.

Live site: [bananas-global.github.io/brand-dna](https://bananas-global.github.io/brand-dna/)

The project deliberately keeps the workflow small:

```text
brand assets + browser editor → brand-dna.json → website
```

Start with [START-HERE.md](START-HERE.md).

## What is included

- One folder for optional source material: `references/`
- One canonical brand file: `public/brand/brand-dna.json`
- One replaceable minimum logo set in `public/brand/logo/`
- One file-based imagery reference set in `public/brand/imagery/`, with titles, descriptions, and reusable text prompts stored in the canonical JSON
- One navigable, responsive website that reads the canonical file directly
- A backend-free Edit mode with live controls, original/draft comparison, local browser persistence, and structured prompt export
- One static Vite + React build with no application server or database
- A design-first guide organized by about, logo, typography, color, borders, imagery, iconography, voice, and applications
- Signal-centered color tokens with derived Paper/Ink stops, an editable Ink-opacity Border, complementary Accent, dynamically harmonized Success/Warning/Error states (`k = 0.12`) with custom overrides, deterministic 10-light/10-dark scales, typography, semantic border thickness, a unified `0–3rem` radius dial, and an optional button-pill rule
- Bring-your-own iconography with five curated open-source sources and real Lucide examples instead of custom-drawn placeholders
- Explicit provenance: evidence, decisions, proposals, and missing items

UI component libraries, approval workflows, ownership models, and review schedules are intentionally outside the scope.

The editor never writes the repository itself. It keeps a temporary draft in the browser and turns the designer's exact changes into a prompt or change-request file that Codex can apply to the canonical JSON.

Logo artwork is file-based rather than edited in the browser. Replace the SVG placeholders in `public/brand/logo/` while preserving their filenames; the Logo page documents where and how each variant should be used.

Imagery works the same way: place reference files in `public/brand/imagery/` and link each filename from `imagery.directions[].asset`. Prompts remain plain text so they can be read, copied, and used directly with image-generation models; JSON is only the storage format.

Shadows use one base token for `md` plus a multiplier that derives `sm` and `lg`. The base defines distance, angle, blur, spread, opacity, and a color stop from the Signal scale, keeping the complete depth system consistent and connected to the brand palette.

Iconography is source-based. The editor records a library and variant; applying that change installs the selected package and updates the examples in code, so the browser never needs a package-download backend.

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
