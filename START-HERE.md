# Start here

Brand DNA turns public brand assets and explicit design decisions into one source that works as a human brandbook and an AI-readable contract.

## Inside an existing repository

Initialize the Bananas example, keep it as a working reference, then replace its decisions and assets with the client's brand:

```bash
npx brand-dna@latest init
npm install --save-dev brand-dna
npx brand-dna dev
```

Open the local URL, select **Edit**, and work through About, Logo, Typography, Color, Borders, Shadows, Imagery, Iconography, Voice & Tone, and Applications.

Changes remain in the browser. Use **Copy** to generate an exact prompt for the AI of your choice, **Changes** to download a structured change request, or **JSON** to download the complete updated Brand DNA.

The AI should update `brand-dna/brand-dna.json`, preserve every unlisted field and asset, update provenance, validate the file, and run the project checks.

```bash
npx brand-dna validate
npx brand-dna build
```

The default build goes to `public/brand-dna/`, where the existing website can publish it at `/brand-dna/`.

## Without an existing repository

Create a repository from the Brand DNA GitHub template. The included GitHub Pages workflow publishes the same static brandbook automatically.

No backend or setup questionnaire is required. Everything in the Brand DNA source directory is public and the Bananas identity remains the default example until it is deliberately replaced.
