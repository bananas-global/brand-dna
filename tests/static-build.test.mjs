import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const distRoot = new URL("../dist/", import.meta.url);

test("builds a static GitHub Pages document with repository-safe metadata", async () => {
  const html = await readFile(new URL("index.html", distRoot), "utf8");

  assert.match(html, /<html[^>]+lang="en-US"/i);
  assert.match(html, /<title>bananas — Brand DNA<\/title>/i);
  assert.match(html, /href="\/brand-dna\/favicon\.svg"/i);
  assert.match(html, /https:\/\/bananas-global\.github\.io\/brand-dna\/og\.png/i);
  assert.match(html, /src="\/brand-dna\/assets\/.+\.js"/i);
  assert.match(html, /href="\/brand-dna\/assets\/.+\.css"/i);

  await assert.rejects(access(new URL("server/index.js", distRoot)));
});

test("copies every public asset and emits self-hosted fonts", async () => {
  await Promise.all([
    access(new URL("favicon.svg", distRoot)),
    access(new URL("og.png", distRoot)),
    access(new URL("brand-dna.json", distRoot)),
    access(new URL("brand-dna.schema.json", distRoot)),
    access(new URL("manifest.json", distRoot)),
    access(new URL("logo/default.svg", distRoot)),
    access(new URL("logo/icon.svg", distRoot)),
    access(new URL("logo/wordmark.svg", distRoot)),
    access(new URL("logo/black.svg", distRoot)),
    access(new URL("logo/white.svg", distRoot)),
    access(new URL("imagery/21eb2840e0203c85520b0f9b5c7ee10090e56b9410e61918b7ace9886f9c6ca3.png", distRoot)),
    access(new URL("imagery/70cea2c28ef2026ed23351237ec1316a199714b806711238ad59dd4de8073977.png", distRoot)),
  ]);
  await assert.rejects(access(new URL("logo/small-use.svg", distRoot)));

  const assetFiles = await readdir(new URL("assets/", distRoot));
  assert.ok(assetFiles.some((file) => file.endsWith(".woff2")), "expected self-hosted font assets");
});

test("keeps one canonical Brand DNA file and a browser-guided setup", async () => {
  const [sourceDna, builtDna, start] = await Promise.all([
    readFile(new URL("public/brand/brand-dna.json", projectRoot), "utf8"),
    readFile(new URL("brand-dna.json", distRoot), "utf8"),
    readFile(new URL("START-HERE.md", projectRoot), "utf8"),
  ]);

  assert.deepEqual(JSON.parse(builtDna), JSON.parse(sourceDna));
  assert.match(start, /select \*\*Edit\*\*/);
  assert.match(start, /no backend or setup questionnaire is required/i);
  await assert.rejects(access(new URL(".agents/skills/brand-dna-builder/SKILL.md", projectRoot)));
  assert.equal(JSON.parse(sourceDna).meta.brandName, "bananas");
  assert.equal(JSON.parse(sourceDna).essence.purpose, "Great taste, awesome design, and affordable. It's bananas!");
  assert.equal("expressionPrinciples" in JSON.parse(sourceDna), false);
  assert.deepEqual(JSON.parse(sourceDna).voice.dimensions.map(({ left, right }) => [left, right]), [
    ["Literal", "Playful"],
    ["Casual", "Formal"],
    ["Warm", "Reserved"],
    ["Bold", "Subtle"],
    ["Concise", "Expressive"],
  ]);
  assert.ok(JSON.parse(sourceDna).voice.dimensions.every(({ description }) => description));
  assert.deepEqual(JSON.parse(sourceDna).channels.map(({ name }) => name), [
    "Web pages",
    "Presentations",
    "BI dashboards",
    "Social media cards/posts",
  ]);
  assert.deepEqual(JSON.parse(sourceDna).visual.colors, [
    { name: "Signal", value: "#FFCA0D", mode: "source", role: "Emphasis and action" },
    { name: "Accent", value: "#1B4AF3", mode: "custom", role: "Expressive highlight and secondary emphasis" },
    { name: "Success", value: "#2E9B58", mode: "derived", role: "Positive states, confirmation, and completed actions" },
    { name: "Warning", value: "#ED8026", mode: "custom", role: "Caution, attention, and pending conditions" },
    { name: "Error", value: "#B82350", mode: "custom", role: "Errors, destructive actions, and critical states" },
  ]);
  assert.deepEqual(JSON.parse(sourceDna).visual.additionalColors, []);
  assert.deepEqual(JSON.parse(sourceDna).visual.semanticColors, {
    paper: { source: "Signal", stop: 100, role: "Background: primary canvas and light surfaces" },
    ink: { source: "Signal", stop: 950, role: "Foreground: primary text, marks, and dark surfaces" },
    border: { source: "Ink", mode: "ink-alpha", opacity: 0.43, value: "#182126", role: "Borders, dividers, and structural lines" },
  });
  assert.equal(JSON.parse(sourceDna).visual.colorScale.hueFlip, true);
  assert.equal(JSON.parse(sourceDna).visual.colorScale.saturationFlip, false);
  assert.equal(JSON.parse(sourceDna).visual.colorScale.contrastColorMode, "highest-contrast-endpoint");
  assert.deepEqual(JSON.parse(sourceDna).visual.colorScales, {
    Accent: { mode: "custom", settings: { lightSteps: 10, darkSteps: 10, hueMultiplier: 1.04, hueFlip: false, saturationMultiplier: 1.2, saturationFlip: false, contrastColorMode: "highest-contrast-endpoint", contrast: 1.05 } },
    Success: { mode: "custom", settings: { lightSteps: 10, darkSteps: 10, hueMultiplier: 1.29, hueFlip: false, saturationMultiplier: 1.2, saturationFlip: false, contrastColorMode: "highest-contrast-endpoint", contrast: 1.05 } },
    Warning: { mode: "custom", settings: { lightSteps: 10, darkSteps: 10, hueMultiplier: 1.17, hueFlip: true, saturationMultiplier: 1, saturationFlip: false, contrastColorMode: "highest-contrast-endpoint", contrast: 0.9 } },
    Error: { mode: "custom", settings: { lightSteps: 10, darkSteps: 10, hueMultiplier: 1.22, hueFlip: true, saturationMultiplier: 1.05, saturationFlip: false, contrastColorMode: "highest-contrast-endpoint", contrast: 0.95 } },
  });
  assert.deepEqual(JSON.parse(sourceDna).visual.typography, {
    headings: {
      family: "Space Grotesk",
      source: "https://fonts.google.com/specimen/Space+Grotesk?preview.script=Latn",
      weight: 700,
    },
    body: { family: "Inter", source: "https://fonts.google.com/specimen/Inter", weight: 400 },
    utility: { family: "Space Mono", source: "https://fonts.google.com/specimen/Space+Mono?preview.script=Latn", weight: 400 },
    additional: [],
  });
  assert.deepEqual(JSON.parse(sourceDna).visual.borders, { thickness: "thin", radius: 0, buttonPill: false });
  assert.deepEqual(JSON.parse(sourceDna).visual.shadows, {
    base: { distance: 16, angle: 90, blur: 13, spread: -5, colorStop: 650, opacity: 0.84 },
    multiplier: 1.7,
  });
  assert.deepEqual(JSON.parse(sourceDna).iconography, {
    principle: "Bring your own icons. Choose one source and use it consistently.",
    library: "Lucide",
    variant: "Outline",
    source: "https://lucide.dev/icons/",
  });
  assert.deepEqual(JSON.parse(sourceDna).imagery.directions.map(({ name, asset }) => ({ name, asset })), [
    { name: "Focused Work", asset: "21eb2840e0203c85520b0f9b5c7ee10090e56b9410e61918b7ace9886f9c6ca3.png" },
    { name: "Deliberate Pause", asset: "70cea2c28ef2026ed23351237ec1316a199714b806711238ad59dd4de8073977.png" },
  ]);
  assert.ok(JSON.parse(sourceDna).imagery.directions.every(({ description, prompt }) => description && prompt));
  assert.equal("motionAndSound" in JSON.parse(sourceDna), false);
  assert.equal("spacing" in JSON.parse(sourceDna).visual, false);
  assert.equal("radii" in JSON.parse(sourceDna).visual, false);
  assert.equal("shadows" in JSON.parse(sourceDna).visual, true);
});

test("keeps the application shell independent from Brand DNA colors", async () => {
  const css = await readFile(new URL("src/styles.css", projectRoot), "utf8");
  const brandColorVariable = /var\(--(?:ink|paper|signal|accent|success|warning|error|line)\)/;
  const shellSelectors = [
    "body {", ":focus-visible", ".skip-link", ".topbar", ".wordmark", ".document-meta",
    ".mode-switch", ".rail", "footer", ".footer-mark", ".editor-",
  ];

  for (const line of css.split("\n")) {
    if (shellSelectors.some((selector) => line.includes(selector))) {
      assert.doesNotMatch(line, brandColorVariable, `shell rule leaked a Brand DNA color: ${line.trim()}`);
    }
  }
});

test("applies semantic colors only to the guideline content canvas", async () => {
  const css = await readFile(new URL("src/styles.css", projectRoot), "utf8");

  assert.match(css, /\.page \{[^}]*background: var\(--paper\);[^}]*color: var\(--ink\);/);
  assert.match(css, /\.about-statement[^\n]*var\(--line\)/);
});

test("uses discrete reusable specimen cards and shared borders where content remains contiguous", async () => {
  const css = await readFile(new URL("src/styles.css", projectRoot), "utf8");

  assert.match(css, /\.swatches \{[^}]*grid-template-columns: repeat\(auto-fill, 280px\);[^}]*gap: 12px;[^}]*justify-content: start;/);
  assert.doesNotMatch(css, /\.swatches-(?:brand|utility|semantic) \{[^}]*grid-template-columns/);
  assert.match(css, /\.specimen-card \{[^}]*display: grid;[^}]*border: var\(--content-border-width\) solid var\(--line\);[^}]*border-radius: var\(--content-radius\);[^}]*background: #fff;/);
  assert.match(css, /\.specimen-card-caption \{[^}]*min-height: 88px;[^}]*background: #fff;[^}]*color: var\(--ink\);[^}]*border-top: var\(--content-border-width\) solid var\(--line\);/);
  assert.match(css, /\.swatch \{[^}]*width: 280px;[^}]*height: 238px;[^}]*grid-template-rows: 150px 88px;/);
  assert.match(css, /\.logo-variant \{[^}]*grid-template-rows: minmax\(300px, 1fr\) 88px;/);
  assert.match(css, /\.voice-spectrum-track i \{[^}]*background: var\(--signal\);/);
  assert.match(css, /\.voice-language article:last-child \{[^}]*background: var\(--ink\);[^}]*color: var\(--paper\);/);
  assert.doesNotMatch(css, /\.color-scale-formula/);
  assert.doesNotMatch(css, /\.color-pairs/);
  assert.doesNotMatch(css, /--content-radius-compact/);
  assert.doesNotMatch(css, /border-radius: var\(--content-radius-compact\)/);
  assert.match(css, /\.editor-actions \{[^}]*grid-template-columns: repeat\(5, 1fr\);/);
  assert.match(css, /\.editor-derived-summary > i \{[^}]*width: 24px;[^}]*height: 24px;/);
  assert.match(css, /\.editor-semantic-harmony \{ margin-top: 0;/);
  assert.match(css, /\.editor-scale-controls\.is-signal \{ padding-top: 18px; \}/);
  assert.match(css, /\.editor-palette-label \{ padding: 10px 0 8px; \}/);
});
