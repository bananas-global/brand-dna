# Start here

Brand DNA turns public brand assets and explicit design decisions into one source that works as a human brandbook and an AI-readable contract.

## Inside an existing repository

Initialize the Bananas example, keep it as a working reference, then replace its decisions and assets with the client's brand:

```bash
npx brand-dna@latest init
npm install --save-dev brand-dna
npx brand-dna dev
```

Open the URL printed in the terminal, select **Edit**, and work through About, Logo, Typography, Color, Borders, Shadows, Imagery, Iconography, Voice & Tone, and Use cases.

Changes remain in the browser. Use **Copy** to generate an exact prompt for the AI of your choice, **Changes** to download a structured change request, or **JSON** to download the complete updated Brand DNA.

The AI should update `brand-dna/brand-dna.json`, preserve every unlisted field and asset, update provenance, validate the file, and run the project checks. If you download the complete JSON instead, replace that file manually.

```bash
npx brand-dna validate
npx brand-dna build
```

The build publishes `design.md` for agent guidance, `brand.css` for reusable mechanics, and `evals/scenarios.json` for fixed comparisons. These files are generated from `brand-dna.json`; do not edit them directly.

To evaluate generated HTML, save one first-attempt file for each published scenario and run `npx brand-dna eval brand-dna-evals`. Keep the generated report, model metadata, viewport, and screenshot together so later guidance changes can be compared against the same inputs.

Before publishing, set `siteUrl` in `brand-dna.config.json` to the final public URL. The default build goes to `public/brand-dna/`, where the existing website can publish it at `/brand-dna/`. Make the website build run the Brand DNA build first, then commit `brand-dna/` and `brand-dna.config.json`.

## Without an existing repository

Select **Use this template** on the Brand DNA repository and create a public repository. In **Settings → Pages**, choose **GitHub Actions** as the source. The included workflow then publishes the same static brandbook automatically.

No backend or setup questionnaire is required. Everything in the Brand DNA source directory is public and the Bananas identity remains the default example until it is deliberately replaced.
