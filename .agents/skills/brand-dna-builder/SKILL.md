---
name: brand-dna-builder
description: Build or update a concise, design-first Brand DNA from available websites, decks, guidelines, logos, images, or a minimal designer brief. Use when starting a visual identity from zero, extracting a practical brand system from existing materials, filling this template, revising public/brand/brand-dna.json, or preparing usable guidelines for people and AI agents.
---

# Brand DNA Builder

Create one practical visual source of truth with the least possible ceremony.

## Work from what exists

1. Read `START-HERE.md` and `public/brand/brand-dna.json`.
2. Inspect every useful file under `references/`. If it is empty, continue from scratch without asking the user to choose a mode.
3. Separate findings into four kinds:
   - **Evidence**: directly supported by a reference; record its file or URL.
   - **Decision**: explicitly supplied or chosen by the designer.
   - **Proposal**: a creative recommendation from the agent.
   - **Missing**: information or assets still required.
4. Never present an inference or proposal as evidence.

## Ask only for blocking design decisions

Use the references and conversation to prefill everything that is genuinely known. Treat every brand asset and explicit decision in the reference material as something to preserve. Do not ask the user to confirm it.

Do not run a fixed questionnaire. Ask at most these two short questions, together, and only when their answers are not already available:

1. **Desired direction** — What should the identity look and feel like? References, links, or a few visual qualities are enough.
2. **Avoided direction** — What should the identity not look or feel like?

Skip any question that does not affect the first usable version. When the references are sufficient, ask nothing and build directly.

Do not ask about existing assets, applications, the offer, audience, positioning, brand perception, purpose, or personality. Extract brand information when explicit, or mark concise proposals when the guide needs it. Ask about voice only when the Voice & Tone section cannot be usefully inferred or proposed from existing language samples.

Always design the Applications section for these four formats: web pages, presentations, BI dashboards, and social media cards/posts.

Accept short answers, links, filenames, or “propose it.” Do not add follow-up questions unless a missing asset or decision blocks a coherent visual system.

## Build the first usable version

1. Update only `public/brand/brand-dna.json` for brand content and tokens.
2. Keep its existing shape unless a real requirement cannot fit it.
3. Replace placeholders when answers exist. Keep unresolved paths in `provenance.missing`.
4. Record field paths under `provenance.evidence`, `decisions`, `proposals`, or `missing`. An evidence item must name its source.
5. Make proposals specific enough for a designer to react to, but label them clearly.
6. Prioritize the ten guide sections: Principles, Logo, Typography, Color, Layout, Imagery, Iconography, Motion, Voice & Tone, and Applications.
7. Prefer three strong principles, concrete usage rules, and a small token set over strategy prose or exhaustive guidelines.
8. Keep UI components outside the Brand DNA. Document application behavior, not component libraries.

The website imports the JSON directly, so do not duplicate brand content in another YAML, Markdown, or token file.

For color, keep Signal, Accent, Success, Warning, and Error as bases under `visual.colors`, in that order. Set Signal to `mode: "source"` and treat it as stop 500. Default Accent to `mode: "complementary"` (Signal hue + 180°). Default Success, Warning, and Error to `mode: "derived"`, with HSL targets at 120°, 45°, and 0°. Harmonize each target toward Signal using `delta = ((brandHue - targetHue + 180) mod 360) - 180` and `semanticHue = targetHue + semanticHueHarmonization * delta`; default `semanticHueHarmonization` to `0.12` and never exceed `0.2`. Inherit clamped saturation and lightness from Signal. Use `mode: "custom"` for explicit manual choices and keep `value` as the fallback. Store Paper/background, Ink/foreground, and Border under `visual.semanticColors`: Paper and Ink derive from Signal; Border defaults to `mode: "ink-alpha"` with Ink at `opacity: 0.2`, and supports `mode: "custom"`. Apply Paper, Ink, and Border to the guideline content canvas, but keep the editor and application chrome brand-agnostic. Keep generator settings under `visual.colorScale`, including `hueFlip`, `saturationFlip`, and `semanticHueHarmonization`. Set `contrastColorMode` to `"highest-contrast-endpoint"`: for each base, compare stops 0 and 1000 against stop 500 and select the endpoint with the higher WCAG contrast ratio. Do not persist calculated Contrast values or derived tones; recalculate them whenever inputs change.

## Apply visual editor requests

The website's Edit mode can produce either a copied prompt or a `brand-dna-change-request.json` file. When the user supplies one:

1. Verify that its target is `public/brand/brand-dna.json` and inspect the current file before editing.
2. Treat every item under **Exact designer decisions** or `changes` as an explicit decision. Apply its `after` value at the stated field path.
3. Preserve every unlisted field and every referenced asset. Never replace the canonical JSON with the change-request file.
4. Use **Desired direction** and **Avoided direction** only to guide supporting proposals that are genuinely required; they do not authorize unrelated rewrites.
5. Record changed paths under `provenance.decisions`, keep any agent additions under `provenance.proposals`, validate the JSON against its schema, and run the project checks.

If an exact change conflicts with the current schema or a newer source value, explain the conflict instead of silently coercing or discarding it.

## Finish

Run the project checks. Summarize only:

- what is now solid;
- what was inferred or proposed;
- the shortest list of missing assets or decisions.

Do not create approval flows, owners, deadlines, review cadences, governance stages, or extra documentation unless the user explicitly requests them.
