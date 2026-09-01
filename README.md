# Brand DNA

An opinionated, open-source source of truth for a brand — structured for AI, presented as a useful brandbook for people.

Brand DNA keeps one public set of brand decisions and assets behind two views:

```text
brand-dna.json + assets → public brandbook for people
                        → stable JSON + generated design.md for AI agents
                        → generated brand.css for repeatable mechanics
```

The starter ships with the Bananas studio identity. It is a real working example, not an empty questionnaire: every brand-specific decision and asset can be replaced, while the opinionated core structure keeps the system useful from the first run.

Live example: [bananas-global.github.io/brand-dna](https://bananas-global.github.io/brand-dna/)

npm package: [npmjs.com/package/brand-dna](https://www.npmjs.com/package/brand-dna)

## What it enables

The minimum Brand DNA covers the decisions needed to create presentations, campaign materials, social posts, documents, web pages, data interfaces, and new imagery with a recognizable look and feel:

- purpose, positioning, audiences, voice, and use-case rules;
- a required core palette plus optional additional colors;
- three required type roles plus optional additional typefaces;
- semantic colors, deterministic scales, borders, radius, and shadows;
- logo variants, imagery directions and reusable generation prompts;
- icon source, data-visualization principles, accessibility, and provenance.

The format is opinionated at the core and extensible at the edges. Extra colors and typefaces never silently replace structural or semantic roles.

## Add it to an existing repository

Brand DNA is designed to live inside the repository a client already has. From the root of that repository, run:

```bash
npx brand-dna@latest init
npm install --save-dev brand-dna
npx brand-dna dev
```

The first command copies the Bananas starter. The second pins the Brand DNA toolchain as a development dependency. The third starts the local editor and prints its URL.

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

The package is a development dependency so the local editor and CI use the same version. `npx brand-dna@latest init` is only the one-time initializer. It refuses to overwrite an existing `brand-dna/` directory or `brand-dna.config.json` file.

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

Run `npm run brand-dna:build` before the host website build. By default it writes a complete static brandbook to `public/brand-dna/`, ready for frameworks that copy their public directory into production.

## Public contract

The default deployment exposes:

```text
/brand-dna/                    public brandbook and prompt editor
/brand-dna/brand-dna.json      canonical machine-readable data
/brand-dna/brand-dna.schema.json
/brand-dna/manifest.json       discovery map for AI agents
/brand-dna/design.md           compiled guidance for AI agents
/brand-dna/brand.css           stable tokens and layout primitives
/brand-dna/evals/scenarios.json
/brand-dna/logo/
/brand-dna/imagery/
/brand-dna/references/
```

The HTML declares the canonical JSON, manifest, and generated guidance with alternate links. Humans and AI agents consume the same versioned source. `design.md`, `brand.css`, and the eval scenarios are compiled artifacts; `brand-dna.json` remains the only source of brand content.

Everything inside the Brand DNA source directory is treated as public branding material.

## Editor workflow

The **Edit** button is intentionally available on the public brandbook. Editing creates a local browser draft only; it never writes to the repository or published site.

The editor can:

- compare the local draft with the published source;
- copy a precise update prompt for any AI;
- download a machine-readable change request;
- download the complete updated `brand-dna.json`.

The generated prompt tells the AI which file to update, preserves unlisted decisions and assets, updates provenance, validates the schema, and runs project checks. Draft storage is namespaced by brand and schema version so different clients do not share browser state.

### First-use workflow

1. Start the local editor with `npm run brand-dna:dev` and open the printed URL.
2. Work through the guidelines in **Edit** mode.
3. Use **Copy** and give the generated prompt to an AI with access to the repository, or use **JSON** and replace `brand-dna/brand-dna.json` manually.
4. Replace the example assets in `brand-dna/` without changing referenced filenames unless the JSON is updated too.
5. Set `siteUrl` in `brand-dna.config.json` to the final public `/brand-dna/` URL.
6. Run `npm run brand-dna:validate` and `npm run brand-dna:build`.
7. Make the host website build run `npm run brand-dna:build` first, then commit the source directory and configuration file.
8. Publish the host website. People and AI agents can now use the same public Brand DNA.

## Commands

```bash
brand-dna init [directory]  # copy the Bananas starter into a repository
brand-dna dev               # start the local brandbook and editor
brand-dna validate          # validate schema, provenance, and referenced assets
brand-dna build             # build the static public brandbook
brand-dna eval [directory]  # check first-attempt HTML artifacts
```

## Agent guidance and portable CSS

Every build compiles two agent-facing artifacts from the canonical JSON:

- `design.md` turns structured brand decisions into an execution order, composition guidance, named anti-patterns, asset rules, and a documented CSS API;
- `brand.css` publishes stable `--brand-*` tokens and `bd-*` primitives for layout, typography, evidence, tables, surfaces, and actions.

Do not edit either output directly. Change `brand-dna.json` in the editor or repository and rebuild.

## Evaluation loop

The build also publishes one fixed scenario per Brand DNA use case in `evals/scenarios.json`. Generate the first attempt for each scenario and save it using the scenario's `expectedFile` inside an evaluation directory. Then run:

```bash
npx brand-dna eval brand-dna-evals
```

The command writes `eval-report.json` and checks deterministic failures such as a missing responsive viewport, language, main landmark, primary heading, Brand DNA stylesheet, or image alternatives. For a reproducible run, also save `<scenario>.run.json` with `model` and `guidanceVersion`, plus the first-attempt screenshot as `<scenario>.png`. Warnings keep subjective review human-owned; errors fail the command.

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

`siteUrl` can remain empty during local setup. Set it before publishing so canonical and social metadata point to the final public URL.

## Standalone repository

When a client has no existing repository or website, select **Use this template** on GitHub and create a public repository. In **Settings → Pages**, choose **GitHub Actions** as the source. The included workflow validates, tests, builds, and deploys the static brandbook on every push to `main`.

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
