const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrapHue = (value) => (value % 360 + 360) % 360;
const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(value ?? "");

const hexToHsl = (hex) => {
  const safe = isHexColor(hex) ? hex : "#000000";
  const [red, green, blue] = [1, 3, 5].map((start) => Number.parseInt(safe.slice(start, start + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { h: wrapHue(hue), s: saturation * 100, l: lightness * 100 };
};

const hslToHex = ({ h, s, l }) => {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = wrapHue(h) / 60;
  const second = chroma * (1 - Math.abs(segment % 2 - 1));
  const [r1, g1, b1] = segment < 1 ? [chroma, second, 0]
    : segment < 2 ? [second, chroma, 0]
      : segment < 3 ? [0, chroma, second]
        : segment < 4 ? [0, second, chroma]
          : segment < 5 ? [second, 0, chroma]
            : [chroma, 0, second];
  const match = lightness - chroma / 2;
  return `#${[r1, g1, b1].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};

const makeTone = (base, settings, step, total, direction) => {
  const progress = step / (total + 1);
  const contrastProgress = clamp(progress * settings.contrast, 0, 0.98);
  const light = direction === "light"
    ? base.l + (100 - base.l) * contrastProgress
    : base.l * (1 - contrastProgress);
  const saturationDirection = settings.saturationFlip ? -1 : 1;
  const saturation = direction === "light"
    ? base.s * (1 - progress * (settings.saturationMultiplier - 1) * saturationDirection)
    : base.s * (1 + progress * (settings.saturationMultiplier - 1) * saturationDirection);
  const hueDirection = settings.hueFlip ? -1 : 1;
  const hueRange = (settings.hueMultiplier - 1) * 100;
  const hue = direction === "light"
    ? base.h - progress * hueRange * hueDirection
    : base.h + progress * hueRange * hueDirection;
  return hslToHex({ h: hue, s: saturation, l: light });
};

const getColorAtStop = (baseHex, settings, stop) => {
  const base = hexToHsl(baseHex);
  const light = Array.from({ length: settings.lightSteps }, (_, index) => makeTone(base, settings, index + 1, settings.lightSteps, "light")).reverse();
  const dark = Array.from({ length: settings.darkSteps }, (_, index) => makeTone(base, settings, index + 1, settings.darkSteps, "dark"));
  const tones = [...light, baseHex.toUpperCase(), ...dark];
  return tones[clamp(Math.round(stop / 50), 0, 20)];
};

const rgba = (hex, opacity) => {
  const safe = isHexColor(hex) ? hex : "#000000";
  const channels = [1, 3, 5].map((start) => Number.parseInt(safe.slice(start, start + 2), 16));
  return `rgba(${channels.join(", ")}, ${opacity})`;
};

const resolveBaseColor = (color, signal) => {
  const base = hexToHsl(signal);
  if (color.name === "Accent" && color.mode === "complementary") return hslToHex({ ...base, h: base.h + 180 });
  if (["Success", "Warning", "Error"].includes(color.name) && color.mode === "derived") {
    const target = color.name === "Success" ? 120 : color.name === "Warning" ? 45 : 0;
    const delta = ((base.h - target + 180) % 360 + 360) % 360 - 180;
    return hslToHex({
      h: wrapHue(target + 0.12 * delta),
      s: clamp(base.s * 0.85, 55, 85),
      l: color.name === "Warning" ? clamp(base.l, 48, 58) : clamp(base.l, 42, 54),
    });
  }
  return isHexColor(color.value) ? color.value.toUpperCase() : "#000000";
};

const resolveColors = (brandDna) => {
  const signalColor = brandDna.visual.colors.find(({ name }) => name === "Signal") ?? brandDna.visual.colors[0];
  const signal = isHexColor(signalColor?.value) ? signalColor.value.toUpperCase() : "#000000";
  const colors = Object.fromEntries(brandDna.visual.colors.map((color) => [color.name.toLowerCase(), resolveBaseColor(color, signal)]));
  const settings = brandDna.visual.colorScale;
  const ink = getColorAtStop(signal, settings, brandDna.visual.semanticColors.ink.stop);
  const paper = getColorAtStop(signal, settings, brandDna.visual.semanticColors.paper.stop);
  return { ...colors, ink, paper, border: rgba(ink, brandDna.visual.semanticColors.border.opacity) };
};

const borderWidth = { thin: 1, medium: 2, bold: 4 };
const list = (values) => values.map((value) => `- ${value}`).join("\n");
const numbered = (values) => values.map((value, index) => `${index + 1}. ${value}`).join("\n");
const googleFontStylesheet = ({ family, source, weight }) => {
  try {
    const url = new URL(source);
    if (url.hostname === "fonts.googleapis.com") return url.toString();
    if (url.hostname === "fonts.google.com") {
      const encodedFamily = encodeURIComponent(family).replaceAll("%20", "+");
      return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weight}&display=swap`;
    }
  } catch {
    return "";
  }
  return "";
};

export const defaultAgentGuidance = {
  priorities: [
    "Preserve supplied facts, constraints, qualifiers, and accessibility requirements.",
    "Make the reader's job and the strongest supported message clear before styling.",
    "Use the published Brand DNA assets, tokens, and primitives before inventing new ones.",
    "Adapt composition to the material while preserving a recognizable brand system.",
  ],
  compositionRules: [
    "Give each artifact one dominant idea and an obvious reading path.",
    "Use hierarchy, alignment, and spacing before adding containers or decoration.",
    "Keep exact evidence, units, sources, and caveats close to the claims they qualify.",
    "Make responsive behavior part of the composition, not a cleanup step.",
  ],
  avoidPatterns: [
    "Generic dashboard reflex — do not turn every artifact into a grid of interchangeable cards.",
    "Decoration as evidence — do not use charts, icons, gradients, or surfaces without an informational job.",
    "Equal-weight hierarchy — do not give every section, metric, or action the same visual emphasis.",
    "Brand by color alone — preserve typography, composition, imagery, voice, and asset rules together.",
    "Unsupported confidence — do not invent claims, urgency, certainty, proof, or calls to action.",
  ],
};

const guidanceFor = (brandDna) => ({ ...defaultAgentGuidance, ...(brandDna.agentGuidance ?? {}) });

export function createDesignMarkdown(project) {
  const { brandDna } = project;
  const guidance = guidanceFor(brandDna);
  const colors = resolveColors(brandDna);
  const colorLines = brandDna.visual.colors.map(({ name, role }) => `- **${name}:** ${colors[name.toLowerCase()]} — ${role}`);
  const useCases = brandDna.useCases.map(({ name, job, rule }) => `### ${name}\n\nReader job: ${job}\n\nRule: ${rule}`).join("\n\n");
  const imagery = brandDna.imagery.directions.map(({ name, asset, description }) => `- **${name}:** [${asset}](./imagery/${asset}) — ${description}`).join("\n");
  const provenanceLabel = (path) => {
    if (brandDna.provenance.proposals.includes(path)) return "proposal, not confirmed";
    if (brandDna.provenance.missing.includes(path)) return "missing";
    if (brandDna.provenance.evidence.includes(path)) return "evidence";
    return "decision";
  };

  return `---
name: ${slugify(brandDna.meta.brandName)}-brand-guidance
description: Build artifacts that follow the public ${brandDna.meta.brandName} Brand DNA.
brandVersion: ${brandDna.meta.version}
schemaVersion: ${brandDna.meta.schemaVersion}
---

# Build like ${brandDna.meta.brandName}

This file is compiled from [brand-dna.json](./brand-dna.json), the canonical source. Use it for decisions and use [brand.css](./brand.css) for repeatable mechanics. Do not edit generated files directly.

## Brand context

Purpose: ${brandDna.essence.purpose}

Positioning (${provenanceLabel("positioning.statement")}): ${brandDna.positioning.statement}

Primary audience (${provenanceLabel("positioning.primaryAudience")}): ${brandDna.positioning.primaryAudience}

Influencing audience (${provenanceLabel("positioning.influencingAudience")}): ${brandDna.positioning.influencingAudience}

## Priority order

${numbered(guidance.priorities)}

## Work from the reader's job

Before composing, identify who opens the artifact, what they need to understand or decide, the strongest supported message, the evidence that earns it, and the caveat that could change it. Preserve supplied facts and distinguish observation, proposal, and missing information using the provenance in the canonical JSON.

${list(guidance.compositionRules)}

## Voice and copy

Say: ${brandDna.voice.say}.

Do not say: ${brandDna.voice.dontSay}

Voice dimensions:

${list(brandDna.voice.dimensions.map(({ name, left, right, value }) => `${name}: ${value}/100 from ${left} to ${right}.`))}

## Visual system

Signature rule: ${brandDna.visual.signatureRule}

${colorLines.join("\n")}
- **Paper:** ${colors.paper} — ${brandDna.visual.semanticColors.paper.role}
- **Ink:** ${colors.ink} — ${brandDna.visual.semanticColors.ink.role}
- **Border:** ${colors.border} — ${brandDna.visual.semanticColors.border.role}

Typography:

- Headings: ${brandDna.visual.typography.headings.family}, weight ${brandDna.visual.typography.headings.weight}, source ${brandDna.visual.typography.headings.source}
- Body: ${brandDna.visual.typography.body.family}, weight ${brandDna.visual.typography.body.weight}, source ${brandDna.visual.typography.body.source}
- Utility: ${brandDna.visual.typography.utility.family}, weight ${brandDna.visual.typography.utility.weight}, source ${brandDna.visual.typography.utility.source}

Use borders at ${brandDna.visual.borders.thickness} weight with ${brandDna.visual.borders.radius}rem radius. ${brandDna.visual.borders.buttonPill ? "Buttons may use pill geometry." : "Do not default buttons to pill geometry."}

## Use the published CSS API

Load the stylesheet once:

\`\`\`html
<link rel="stylesheet" href="./brand.css">
\`\`\`

Use its \`--brand-*\` tokens and these primitives instead of recreating common mechanics:

- Layout: \`.bd-page\`, \`.bd-shell\`, \`.bd-grid\`, \`.bd-stack\`, \`.bd-cluster\`
- Type: \`.bd-display\`, \`.bd-title\`, \`.bd-heading\`, \`.bd-body\`, \`.bd-label\`, \`.bd-meta\`
- Evidence: \`.bd-stat-grid\`, \`.bd-stat\`, \`.bd-table-wrap\`, \`.bd-table\`
- Surfaces and actions: \`.bd-card\`, \`.bd-band\`, \`.bd-button\`

Page-specific CSS may define the unique composition, but it should consume the public tokens and must not override the behavior of a \`.bd-*\` primitive.

## Assets and imagery

Logo assets: [default](./logo/default.svg), [wordmark](./logo/wordmark.svg), [icon](./logo/icon.svg), [black](./logo/black.svg), [white](./logo/white.svg).

Imagery principle: ${brandDna.imagery.principle}

${imagery}

Do: ${brandDna.imagery.do}

Avoid: ${brandDna.imagery.avoid}

Iconography: ${brandDna.iconography.principle} Use ${brandDna.iconography.library} ${brandDna.iconography.variant} from ${brandDna.iconography.source}.

## Information, data, and accessibility

${brandDna.informationAndData.principle}

${list(brandDna.informationAndData.rules)}

${brandDna.accessibility.principle}

${list([...brandDna.accessibility.rules, ...brandDna.accessibility.boundaries])}

## Use cases

${useCases}

## Reject generated-design reflexes

${list(guidance.avoidPatterns)}

## Provenance and uncertainty

Confirmed evidence paths:

${brandDna.provenance.evidence.length ? list(brandDna.provenance.evidence) : "- None recorded."}

Proposals must remain visibly provisional:

${brandDna.provenance.proposals.length ? list(brandDna.provenance.proposals) : "- None recorded."}

Missing decisions must not be invented:

${brandDna.provenance.missing.length ? list(brandDna.provenance.missing) : "- None recorded."}

## Inspect before delivery

Check the first viewport, reading order, responsive behavior, overflow, focus visibility, image alternatives, exact facts, asset use, and whether the artifact follows its use-case rule. Run the Brand DNA eval when an HTML artifact is available.
`;
}

const shadow = (token, multiplier = 1) => {
  const radians = token.angle * Math.PI / 180;
  const round = (value) => Math.round(value * 100) / 100;
  const x = round(Math.cos(radians) * token.distance * multiplier);
  const y = round(Math.sin(radians) * token.distance * multiplier);
  return `${x}px ${y}px ${round(token.blur * multiplier)}px ${round(token.spread * multiplier)}px rgba(0, 0, 0, ${token.opacity})`;
};

export function createBrandStylesheet(project) {
  const { brandDna } = project;
  const colors = resolveColors(brandDna);
  const border = borderWidth[brandDna.visual.borders.thickness] ?? 1;
  const radius = `${brandDna.visual.borders.radius}rem`;
  const buttonRadius = brandDna.visual.borders.buttonPill ? "999px" : `${Math.min(brandDna.visual.borders.radius, 1)}rem`;
  const baseShadow = brandDna.visual.shadows.base;
  const multiplier = brandDna.visual.shadows.multiplier;
  const variables = brandDna.visual.colors.map(({ name }) => `  --brand-${name.toLowerCase()}: ${colors[name.toLowerCase()]};`).join("\n");
  const fontImports = [...new Set([
    brandDna.visual.typography.headings,
    brandDna.visual.typography.body,
    brandDna.visual.typography.utility,
  ].map(googleFontStylesheet).filter(Boolean))].map((url) => `@import url("${url}");`).join("\n");

  return `${fontImports}${fontImports ? "\n\n" : ""}/* Generated from brand-dna.json. Stable public API; do not edit directly. */
:root {
${variables}
  --brand-paper: ${colors.paper};
  --brand-ink: ${colors.ink};
  --brand-border: ${colors.border};
  --brand-font-heading: "${brandDna.visual.typography.headings.family}", system-ui, sans-serif;
  --brand-font-body: "${brandDna.visual.typography.body.family}", system-ui, sans-serif;
  --brand-font-utility: "${brandDna.visual.typography.utility.family}", ui-monospace, monospace;
  --brand-heading-weight: ${brandDna.visual.typography.headings.weight};
  --brand-body-weight: ${brandDna.visual.typography.body.weight};
  --brand-utility-weight: ${brandDna.visual.typography.utility.weight};
  --brand-border-width: ${border}px;
  --brand-radius: ${radius};
  --brand-button-radius: ${buttonRadius};
  --brand-shadow-sm: ${shadow(baseShadow, 1 / multiplier)};
  --brand-shadow-md: ${shadow(baseShadow)};
  --brand-shadow-lg: ${shadow(baseShadow, multiplier)};
  --brand-space-1: .25rem;
  --brand-space-2: .5rem;
  --brand-space-3: .75rem;
  --brand-space-4: 1rem;
  --brand-space-6: 1.5rem;
  --brand-space-8: 2rem;
  --brand-space-12: 3rem;
  --brand-space-16: 4rem;
  color-scheme: light;
}

.bd-page { margin: 0; background: var(--brand-paper); color: var(--brand-ink); font: var(--brand-body-weight) 1rem/1.6 var(--brand-font-body); -webkit-font-smoothing: antialiased; }
.bd-page *, .bd-page *::before, .bd-page *::after { box-sizing: border-box; }
.bd-shell { width: min(100% - 2rem, 75rem); margin-inline: auto; }
.bd-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--brand-space-6); }
.bd-stack { display: flex; flex-direction: column; gap: var(--brand-space-6); }
.bd-cluster { display: flex; flex-wrap: wrap; align-items: center; gap: var(--brand-space-3); }
.bd-display, .bd-title, .bd-heading { margin: 0; font-family: var(--brand-font-heading); font-weight: var(--brand-heading-weight); text-wrap: balance; }
.bd-display { font-size: clamp(3rem, 8vw, 7.5rem); line-height: .92; letter-spacing: -.05em; }
.bd-title { font-size: clamp(2.25rem, 5vw, 4.5rem); line-height: 1; letter-spacing: -.035em; }
.bd-heading { font-size: clamp(1.5rem, 3vw, 2.25rem); line-height: 1.1; letter-spacing: -.02em; }
.bd-body { max-width: 68ch; margin: 0; }
.bd-label, .bd-meta { font-family: var(--brand-font-utility); font-weight: var(--brand-utility-weight); }
.bd-label { font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; }
.bd-meta { font-size: .8125rem; }
.bd-card { padding: var(--brand-space-6); border: var(--brand-border-width) solid var(--brand-border); border-radius: var(--brand-radius); }
.bd-band { padding-block: var(--brand-space-12); background: var(--brand-ink); color: var(--brand-paper); }
.bd-button { display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; padding: .7rem 1rem; border: var(--brand-border-width) solid var(--brand-ink); border-radius: var(--brand-button-radius); background: var(--brand-ink); color: var(--brand-paper); font: 600 .875rem/1 var(--brand-font-body); text-decoration: none; }
.bd-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: var(--brand-space-6); }
.bd-stat { display: grid; gap: var(--brand-space-2); align-content: start; }
.bd-stat > strong { font: var(--brand-heading-weight) clamp(2rem, 5vw, 4rem)/1 var(--brand-font-heading); font-variant-numeric: tabular-nums; }
.bd-table-wrap { width: 100%; overflow-x: auto; }
.bd-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.bd-table th, .bd-table td { padding: .75rem; border-bottom: var(--brand-border-width) solid var(--brand-border); text-align: left; vertical-align: top; }
.bd-table th { font-family: var(--brand-font-utility); font-size: .75rem; letter-spacing: .04em; text-transform: uppercase; }
.bd-skip-link { position: fixed; z-index: 100; top: .5rem; left: .5rem; padding: .6rem .8rem; background: var(--brand-ink); color: var(--brand-paper); transform: translateY(-200%); }
.bd-skip-link:focus { transform: translateY(0); }
.bd-page :focus-visible { outline: 3px solid var(--brand-accent); outline-offset: 3px; }

@media (max-width: 48rem) {
  .bd-shell { width: min(100% - 1.25rem, 75rem); }
  .bd-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--brand-space-4); }
  .bd-card { padding: var(--brand-space-4); }
}

@media (prefers-reduced-motion: reduce) {
  .bd-page *, .bd-page *::before, .bd-page *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
`;
}

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function createEvalScenarios(project) {
  const { brandDna } = project;
  const viewportFor = (name) => /presentation/i.test(name) ? { width: 1280, height: 720 }
    : /social/i.test(name) ? { width: 1080, height: 1080 }
      : { width: 1440, height: 1000 };
  return {
    kind: "brand-dna-eval-scenarios",
    version: 1,
    brand: brandDna.meta.brandName,
    brandVersion: brandDna.meta.version,
    guidance: "../design.md",
    stylesheet: "../brand.css",
    scenarios: brandDna.useCases.map(({ name, job, rule }) => ({
      id: slugify(name),
      name,
      prompt: `Create a ${name.toLowerCase()} artifact for ${brandDna.meta.brandName}. The reader's job is: ${job} Follow this use-case rule: ${rule} Use only supplied facts and assets.`,
      viewport: viewportFor(name),
      rubric: [
        "Supplied facts, qualifiers, and sources are preserved.",
        "The reader's job and dominant message are clear.",
        `The use-case rule is observable: ${rule}`,
        "The artifact loads brand.css and uses the bd-* primitives where applicable.",
        "The artifact remains legible, accessible, and free of horizontal overflow.",
      ],
      expectedFile: `${slugify(name)}.html`,
    })),
  };
}
