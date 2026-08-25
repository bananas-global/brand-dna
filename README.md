# Brand DNA

An opinionated, open-source source of truth for a brand — structured for AI, presented as a useful brandbook for people.

Brand DNA keeps one public set of brand decisions and assets behind two views:

```text
brand-dna.json + assets → public brandbook for people
                        → stable JSON + manifest for AI agents
```

The starter ships with the Bananas studio identity. It is a real working example, not an empty questionnaire: every value and asset can be replaced, while the minimum system remains useful from the first run.

Live example: [bananas-global.github.io/brand-dna](https://bananas-global.github.io/brand-dna/)

## What it enables

The minimum Brand DNA covers the decisions needed to create presentations, campaign materials, social posts, documents, web pages, data interfaces, and new imagery with a recognizable look and feel:

- purpose, positioning, audiences, voice, and channel rules;
- a required core palette plus optional additional colors;
- three required type roles plus optional additional typefaces;
- semantic colors, deterministic scales, borders, radius, and shadows;
- logo variants, imagery directions and reusable generation prompts;
- icon source, data-visualization principles, accessibility, and provenance.

The format is opinionated at the core and extensible at the edges. Extra colors and typefaces never silently replace structural or semantic roles.

## Add it to an existing repository

Brand DNA is designed to live inside the repository a client already has. After the npm package is published:

```bash
npx brand-dna@latest init
npm install --save-dev brand-dna
npx brand-dna dev
```

`init` creates:

```text
brand-dna/
├── brand-dna.json
├── brand-dna.schema.json
├── favicon.svg
├── og.png
├── logo/
├── imagery/
└── references/

brand-dna.config.json
```

The package is a development dependency so the local editor and CI use the same version. `npx brand-dna@latest init` is only the one-time initializer.

Useful scripts for the host repository:

```json
{
  "scripts": {
    "brand-dna:dev": "brand-dna dev",
    "brand-dna:validate": "brand-dna validate",
    "brand-dna:build": "brand-dna build"
  }
}
```

Run `brand-dna build` before the host website build. By default it writes a complete static brandbook to `public/brand-dna/`, ready for frameworks that copy their public directory into production.

## Public contract

The default deployment exposes:

```text
/brand-dna/                    public brandbook and prompt editor
/brand-dna/brand-dna.json      canonical machine-readable data
/brand-dna/brand-dna.schema.json
/brand-dna/manifest.json       discovery map for AI agents
/brand-dna/logo/
/brand-dna/imagery/
/brand-dna/references/
```

The HTML declares the canonical JSON and manifest with alternate links. Humans and AI agents consume the same versioned source; the brandbook contains no duplicate brand content.

Everything inside the Brand DNA source directory is treated as public branding material.

## Editor workflow

The **Edit** button is intentionally available on the public brandbook. Editing creates a local browser draft only; it never writes to the repository or published site.

The editor can:

- compare the local draft with the published source;
- copy a precise update prompt for any AI;
- download a machine-readable change request;
- download the complete updated `brand-dna.json`.

The generated prompt tells the AI which file to update, preserves unlisted decisions and assets, updates provenance, validates the schema, and runs project checks. Draft storage is namespaced by brand and schema version so different clients do not share browser state.

## Commands

```bash
brand-dna init [directory]  # copy the Bananas starter into a repository
brand-dna dev               # open the brandbook and editor locally
brand-dna validate          # validate schema, provenance, and referenced assets
brand-dna build             # build the static public brandbook
```

Configuration lives in `brand-dna.config.json`:

```json
{
  "$schema": "./node_modules/brand-dna/brand-dna.config.schema.json",
  "sourceDir": "brand-dna",
  "outputDir": "public/brand-dna",
  "basePath": "/brand-dna/",
  "siteUrl": "https://example.com/brand-dna/"
}
```

`siteUrl` can remain empty during local setup. It controls canonical and social metadata when published.

## Standalone repository

When a client has no existing repository or website, create a repository from this project and enable GitHub Pages. The included workflow validates, tests, builds, and deploys the static brandbook on every push to `main`.

## Develop this project

Requires Node.js `20.19+` or `22.12+`.

```bash
npm install
npm run dev
npm test
npm run lint
```

Maintainers can verify the exact public package before a release with `npm run release:check`. The same check runs automatically before `npm publish`.

The repository itself uses `public/brand/` as its Bananas source directory and `dist/` as its standalone Pages output. No backend, account, database, or application server is required.

## License

[MIT](LICENSE). See [TRADEMARKS.md](TRADEMARKS.md) for the distinction between the open-source project and the Bananas identity included as the default example.
