import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const distRoot = new URL("../dist/", import.meta.url);

test("builds a static GitHub Pages document with repository-safe metadata", async () => {
  const html = await readFile(new URL("index.html", distRoot), "utf8");

  assert.match(html, /<html[^>]+lang="en-US"/i);
  assert.match(html, /<title>Brand DNA — Open Source Starter<\/title>/i);
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
    access(new URL("brand/brand-dna.json", distRoot)),
    access(new URL("brand/brand-dna.schema.json", distRoot)),
  ]);

  const assetFiles = await readdir(new URL("assets/", distRoot));
  assert.ok(assetFiles.some((file) => file.endsWith(".woff2")), "expected self-hosted font assets");
});

test("keeps one canonical Brand DNA file and a minimal design-first builder intake", async () => {
  const [sourceDna, builtDna, start, skill] = await Promise.all([
    readFile(new URL("public/brand/brand-dna.json", projectRoot), "utf8"),
    readFile(new URL("brand/brand-dna.json", distRoot), "utf8"),
    readFile(new URL("START-HERE.md", projectRoot), "utf8"),
    readFile(new URL(".agents/skills/brand-dna-builder/SKILL.md", projectRoot), "utf8"),
  ]);

  assert.deepEqual(JSON.parse(builtDna), JSON.parse(sourceDna));
  assert.match(start, /Use \$brand-dna-builder/);
  assert.match(skill, /Inspect every useful file under `references\/`/);
  assert.match(skill, /Ask at most these two short questions/);
  assert.match(skill, /Do not run a fixed questionnaire/);
  assert.doesNotMatch(skill, /What does the brand offer\?/);
  assert.doesNotMatch(skill, /Which logo, name, colors/);
  assert.match(skill, /web pages, presentations, BI dashboards, and social media cards\/posts/);
  assert.equal((start.match(/^\d+\. /gm) ?? []).length, 2);
  assert.deepEqual(JSON.parse(sourceDna).channels.map(({ name }) => name), [
    "Web pages",
    "Presentations",
    "BI dashboards",
    "Social media cards/posts",
  ]);
  assert.deepEqual(JSON.parse(sourceDna).visual.colors, [
    { name: "Signal", value: "#FF5C35", mode: "source", role: "Emphasis and action" },
    { name: "Accent", value: "#6657FF", mode: "complementary", role: "Expressive highlight and secondary emphasis" },
    { name: "Success", value: "#2E9B58", mode: "derived", role: "Positive states, confirmation, and completed actions" },
    { name: "Warning", value: "#D99A16", mode: "derived", role: "Caution, attention, and pending conditions" },
    { name: "Error", value: "#D94332", mode: "derived", role: "Errors, destructive actions, and critical states" },
  ]);
  assert.deepEqual(JSON.parse(sourceDna).visual.semanticColors, {
    paper: { source: "Signal", stop: 50, role: "Background: primary canvas and light surfaces" },
    ink: { source: "Signal", stop: 900, role: "Foreground: primary text, marks, and dark surfaces" },
    border: { source: "Ink", mode: "ink-alpha", opacity: 0.2, value: "#182126", role: "Borders, dividers, and structural lines" },
  });
  assert.equal(JSON.parse(sourceDna).visual.colorScale.hueFlip, false);
  assert.equal(JSON.parse(sourceDna).visual.colorScale.saturationFlip, false);
  assert.equal(JSON.parse(sourceDna).visual.colorScale.contrastColorMode, "highest-contrast-endpoint");
  assert.deepEqual(JSON.parse(sourceDna).visual.colorScales, {
    Accent: { mode: "linked" },
    Success: { mode: "linked" },
    Warning: { mode: "linked" },
    Error: { mode: "linked" },
  });
  assert.deepEqual(JSON.parse(sourceDna).visual.typography, {
    display: { family: "Georgia", source: "", weight: 400 },
    body: { family: "Geist Sans", source: "", weight: 400 },
    utility: { family: "Geist Mono", source: "", weight: 500 },
  });
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
  assert.match(css, /\.principle-lead[^\n]*var\(--line\)/);
});

test("uses single shared borders for contiguous content grids", async () => {
  const css = await readFile(new URL("src/styles.css", projectRoot), "utf8");

  assert.match(css, /\.swatches \{[^}]*gap: 1px;[^}]*padding: 1px;[^}]*background: var\(--line\);/);
  assert.match(css, /\.swatches-brand \{ grid-template-columns: repeat\(2, 1fr\); \}/);
  assert.match(css, /\.swatches-utility, \.swatches-semantic \{ grid-template-columns: repeat\(3, 1fr\); \}/);
  assert.match(css, /\.swatch \{[^}]*background: #fff;/);
  assert.doesNotMatch(css, /\.swatch \{[^}]*box-shadow/);
  assert.match(css, /\.swatch-color \{[^}]*box-shadow: inset 0 -1px var\(--line\);/);
  assert.match(css, /\.swatch-color \{[^}]*height: clamp\(90px, 12vw, 170px\);/);
  assert.match(css, /\.color-scale-formula \{[^}]*gap: 1px;[^}]*padding: 1px;[^}]*background: var\(--line\);/);
  assert.doesNotMatch(css, /\.color-scale-formula > div \{[^}]*box-shadow/);
  assert.match(css, /\.editor-actions \{[^}]*grid-template-columns: repeat\(4, 1fr\);/);
  assert.match(css, /\.editor-derived-summary > i \{[^}]*width: 24px;[^}]*height: 24px;/);
  assert.match(css, /\.editor-semantic-harmony \{ margin-top: 0;/);
  assert.match(css, /\.editor-scale-controls\.is-signal \{ padding-top: 18px; \}/);
  assert.match(css, /\.editor-palette-label \{ padding: 10px 0 8px; \}/);
});
