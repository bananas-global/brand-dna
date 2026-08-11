---
name: brand-dna-builder
description: Build or update a concise Brand DNA from a short designer brief and any available websites, decks, guidelines, logos, images, or other reference materials. Use when starting a brand from zero, extracting a brand system from existing materials, filling this template, revising public/brand/brand-dna.json, or preparing a reliable brand source of truth for people and AI agents.
---

# Brand DNA Builder

Create one useful source of truth with the least possible ceremony.

## Work from what exists

1. Read `START-HERE.md` and `public/brand/brand-dna.json`.
2. Inspect every useful file under `references/`. If it is empty, continue from scratch without asking the user to choose a mode.
3. Separate findings into four kinds:
   - **Evidence**: directly supported by a reference; record its file or URL.
   - **Decision**: explicitly supplied or chosen by the designer.
   - **Proposal**: a creative recommendation from the agent.
   - **Missing**: information or assets still required.
4. Never present an inference or proposal as evidence.

## Ask only what is unanswered

Use the references and conversation to prefill what is genuinely known. Ask the remaining questions together in one short message:

1. What does the brand offer?
2. Who is it for?
3. What perception should it build?
4. Which three characteristics should define it?
5. What must it never feel like?
6. How should it speak?
7. Which visual references feel relevant?
8. Where will the identity be used most?

Do not add follow-up questions unless an answer is necessary to produce a coherent first version. Accept short, imperfect answers.

## Build the first usable version

1. Update only `public/brand/brand-dna.json` for brand content and tokens.
2. Keep its existing shape unless a real requirement cannot fit it.
3. Replace placeholders when answers exist. Keep unresolved paths in `provenance.missing`.
4. Record field paths under `provenance.evidence`, `decisions`, `proposals`, or `missing`. An evidence item must name its source.
5. Make proposals specific enough for a designer to react to, but label them clearly.
6. Prefer three strong expression principles and a small token set over exhaustive guidelines.
7. Keep UI components outside the Brand DNA. Document channel behavior, not component libraries.

The website imports the JSON directly, so do not duplicate brand content in another YAML, Markdown, or token file.

## Finish

Run the project checks. Summarize only:

- what is now solid;
- what was inferred or proposed;
- the shortest list of missing assets or decisions.

Do not create approval flows, owners, deadlines, review cadences, governance stages, or extra documentation unless the user explicitly requests them.
