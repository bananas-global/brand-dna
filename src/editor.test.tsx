import { describe, expect, it } from "vitest";
import { buildChangeRequest, buildUpdatePrompt, diffBrandDna, rebaseDraft, reconcileColorBases, setAtPath } from "./editor";

describe("Brand DNA editor contract", () => {
  it("updates nested paths immutably and reports only exact changes", () => {
    const source = { visual: { colors: [{ value: "#000000" }] }, untouched: "keep" };
    const draft = setAtPath(source, "visual.colors[0].value", "#FFFFFF");

    expect(source.visual.colors[0].value).toBe("#000000");
    expect(diffBrandDna(source, draft)).toEqual([
      { path: "visual.colors[0].value", before: "#000000", after: "#FFFFFF" },
    ]);
  });

  it("builds a preservation-first prompt and machine-readable request", () => {
    const source = { voice: { say: "Old" }, asset: "logo.svg" };
    const draft = { voice: { say: "Direct" }, asset: "logo.svg" };
    const prompt = buildUpdatePrompt(source, draft);
    const request = buildChangeRequest(source, draft);

    expect(prompt).toContain("Preserve every unlisted field and every referenced asset.");
    expect(prompt).toContain('voice.say: "Old" -> "Direct"');
    expect(prompt).not.toContain("Desired direction");
    expect(request).toMatchObject({
      kind: "brand-dna-editor-change-request",
      target: "public/brand/brand-dna.json",
      preserveUnlistedFields: true,
    });
  });

  it("migrates legacy voice drafts to the five-dimension model", () => {
    const source = {
      voice: {
        dimensions: [{ name: "Playfulness", left: "Literal", right: "Playful", value: 75, description: "Use humor deliberately." }],
        say: "Use concrete verbs.",
        dontSay: "Avoid hype.",
      },
      visual: { colors: [{ name: "Signal", value: "#FFCA0D", role: "Emphasis" }] },
    };
    const saved = {
      voice: { intent: "Legacy voice", preferredVocabulary: ["clear"] },
      expressionPrinciples: [{ name: "Legacy principle" }],
      visual: { colors: [{ name: "Signal", value: "#FFCA0D", role: "Emphasis" }] },
    };

    const migrated = reconcileColorBases(saved, source);
    expect(migrated.voice).toEqual(source.voice);
    expect("expressionPrinciples" in migrated).toBe(false);
  });

  it("preserves the intent of the retired Playful-to-Serious axis", () => {
    const source = {
      voice: {
        dimensions: [{ name: "Playfulness", left: "Literal", right: "Playful", value: 75, description: "Use humor deliberately." }],
        say: "Use concrete verbs.",
        dontSay: "Avoid hype.",
      },
      visual: { colors: [{ name: "Signal", value: "#FFCA0D", role: "Emphasis" }] },
    };
    const saved = {
      voice: {
        dimensions: [{ name: "Energy", left: "Playful", right: "Serious", value: 20 }],
        say: "Saved say.",
        dontSay: "Saved avoid.",
      },
      visual: { colors: [{ name: "Signal", value: "#FFCA0D", role: "Emphasis" }] },
    };

    expect(reconcileColorBases(saved, source).voice.dimensions[0].value).toBe(80);
  });

  it("replaces a legacy neutral palette with semantic states without discarding Signal and Accent", () => {
    const source = {
      visual: { colors: [
        { name: "Signal", value: "#FF5C35", role: "Emphasis" },
        { name: "Accent", value: "#6657FF", role: "Highlight" },
        { name: "Success", value: "#2E9B58", role: "Positive state", mode: "derived" as const },
        { name: "Warning", value: "#D99A16", role: "Caution", mode: "derived" as const },
        { name: "Error", value: "#D94332", role: "Critical state", mode: "derived" as const },
      ] },
    };
    const saved = {
      visual: { colors: [
        { name: "Signal", value: "#32C365", role: "Old signal role" },
        { name: "Field", value: "#87C4B6", role: "Old field role" },
        { name: "Accent", value: "#C759C9", role: "Old accent role" },
      ] },
    };

    expect(reconcileColorBases(saved, source).visual.colors).toEqual([
      { name: "Signal", value: "#32C365", role: "Emphasis" },
      { name: "Accent", value: "#C759C9", role: "Highlight" },
      { name: "Success", value: "#2E9B58", role: "Positive state", mode: "derived" },
      { name: "Warning", value: "#D99A16", role: "Caution", mode: "derived" },
      { name: "Error", value: "#D94332", role: "Critical state", mode: "derived" },
    ]);
  });

  it("adds new semantic color and scale defaults to an existing local draft", () => {
    const source = {
      visual: {
        colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }],
        semanticColors: {
          paper: { source: "Signal", stop: 50 },
          ink: { source: "Signal", stop: 900 },
          border: { source: "Ink", mode: "ink-alpha", opacity: 0.2, value: "#182126" },
        },
        colorScale: { hueMultiplier: 1.1, hueFlip: false },
      },
    };
    const saved = {
      visual: {
        colors: [{ name: "Signal", value: "#32C365", role: "Old role" }],
        semanticColors: {
          paper: { source: "Signal", stop: 150 },
          ink: { source: "Signal", stop: 850 },
        },
        colorScale: { hueMultiplier: 1.7 },
      },
    };

    const migrated = reconcileColorBases(saved, source);
    expect(migrated.visual.semanticColors).toEqual({
      paper: { source: "Signal", stop: 150 },
      ink: { source: "Signal", stop: 850 },
      border: { source: "Ink", mode: "ink-alpha", opacity: 0.2, value: "#182126" },
    });
    expect(migrated.visual.colorScale).toEqual({ hueMultiplier: 1.7, hueFlip: false });
  });

  it("adds imagery assets and prompts to a legacy local draft without losing its copy", () => {
    const source = {
      imagery: {
        principle: "Show relationships.",
        directions: [{ name: "Presence", asset: "presence.svg", description: "Source description", prompt: "Source prompt" }],
        do: "Show context.",
        avoid: "Avoid stock.",
      },
      visual: { colors: [{ name: "Signal", value: "#FFCA0D", role: "Emphasis" }] },
    };
    const saved = {
      imagery: {
        principle: "Saved principle.",
        directions: [{ name: "Human presence", description: "Saved description" }],
        do: "Saved do.",
        avoid: "Saved avoid.",
      },
      visual: { colors: [{ name: "Signal", value: "#FFCA0D", role: "Emphasis" }] },
    };

    expect(reconcileColorBases(saved, source).imagery).toEqual({
      principle: "Saved principle.",
      directions: [{ name: "Human presence", asset: "presence.svg", description: "Saved description", prompt: "Source prompt" }],
      do: "Saved do.",
      avoid: "Saved avoid.",
    });
  });

  it("removes legacy base-position choices and restores a fixed 10/10 scale", () => {
    const source = {
      visual: {
        colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }],
        colorScale: { lightSteps: 10, darkSteps: 10, hueMultiplier: 1.1 },
      },
    };
    const saved = {
      visual: {
        colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }],
        colorScale: { lightSteps: 8, darkSteps: 12, basePosition: 400, semanticHueHarmonization: 0.2, hueMultiplier: 1.7 },
      },
    };

    expect(reconcileColorBases(saved, source).visual.colorScale).toEqual({
      lightSteps: 10, darkSteps: 10, hueMultiplier: 1.7,
    });
  });

  it("migrates typography links and removes application-level spacing controls", () => {
    const source = {
      visual: {
        colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }],
        typography: {
          headings: { family: "Georgia", source: "", weight: 400 },
          body: { family: "Geist Sans", source: "", weight: 400 },
          utility: { family: "Geist Mono", source: "", weight: 500 },
        },
      },
    };
    const saved = {
      visual: {
        colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }],
        typography: {
          display: { family: "Fraunces", weight: 400, letterSpacing: "-0.04em" },
          body: { family: "Inter", weight: 400, lineHeight: 1.55 },
          utility: { family: "Roboto Mono", weight: 500 },
        },
      },
    };

    expect(reconcileColorBases(saved, source).visual.typography).toEqual({
      headings: { family: "Fraunces", source: "", weight: 400 },
      body: { family: "Inter", source: "", weight: 400 },
      utility: { family: "Roboto Mono", source: "", weight: 500 },
    });
  });

  it("adopts source typography the designer never edited and keeps the fonts they chose", () => {
    const base = {
      visual: {
        typography: {
          headings: { family: "Sedgwick Ave Display", source: "https://fonts.google.com/specimen/Sedgwick+Ave+Display", weight: 400 },
          body: { family: "Inter", source: "https://fonts.google.com/specimen/Inter", weight: 400 },
        },
      },
    };
    const source = {
      visual: {
        typography: {
          headings: { family: "Space Grotesk", source: "https://fonts.google.com/specimen/Space+Grotesk", weight: 700 },
          body: { family: "Inter", source: "https://fonts.google.com/specimen/Inter", weight: 400 },
        },
      },
    };
    const untouched = structuredClone(base);
    const edited = setAtPath(structuredClone(base), "visual.typography.body.family", "Fraunces");

    expect(rebaseDraft(untouched, base, source).visual.typography).toEqual(source.visual.typography);
    expect(rebaseDraft(edited, base, source).visual.typography).toEqual({
      headings: source.visual.typography.headings,
      body: { ...base.visual.typography.body, family: "Fraunces" },
    });
    expect(diffBrandDna(base, rebaseDraft(untouched, base, base))).toEqual([]);
  });

  it("delivers new source fields and added array entries to an existing draft", () => {
    const base = { visual: { borders: { thickness: "thin" } }, channels: [{ name: "Web" }] };
    const source = {
      visual: { borders: { thickness: "thin", buttonPill: true } },
      channels: [{ name: "Web" }, { name: "Email" }],
    };
    const draft = setAtPath(structuredClone(base), "visual.borders.thickness", "bold");

    expect(rebaseDraft(draft, base, source)).toEqual({
      visual: { borders: { thickness: "bold", buttonPill: true } },
      channels: [{ name: "Web" }, { name: "Email" }],
    });
  });

  it("replaces legacy layout tokens and numeric borders with semantic border decisions", () => {
    const source = {
      visual: {
        colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }],
        borders: { thickness: "thin", radius: 3, buttonPill: false },
        shadows: {
          base: { distance: 8, angle: 90, blur: 18, spread: 0, colorStop: 900, opacity: 0.2 },
          multiplier: 2,
        },
      },
    };
    const saved = {
      visual: {
        colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }],
        borders: { thickness: 2, radius: 16 },
        spacing: { 1: "4px", 2: "8px" },
        radii: { small: "4px", medium: "12px", full: "999px" },
        shadows: { soft: "0 5px 18px rgba(0,0,0,.18)" },
      },
    };

    const migrated = reconcileColorBases(saved, source);
    expect(migrated.visual.borders).toEqual({ thickness: "medium", radius: 1, buttonPill: false });
    expect(migrated.visual).not.toHaveProperty("spacing");
    expect(migrated.visual).not.toHaveProperty("radii");
    expect(migrated.visual.shadows).toEqual({
      base: { distance: 8, angle: 90, blur: 18, spread: 0, colorStop: 900, opacity: 0.2 },
      multiplier: 2,
    });
  });

  it("replaces legacy icon drawing controls with a validated library source", () => {
    const source = {
      iconography: {
        principle: "Bring your own icons.",
        library: "Lucide",
        variant: "Outline",
        source: "https://lucide.dev/icons/",
      },
      visual: { colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }] },
    };
    const legacy = {
      iconography: { principle: "Old", grid: "24 × 24", stroke: "1.5 px", corners: "2 px", style: "Outline" },
      visual: { colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }] },
    };
    const saved = {
      iconography: { principle: "Old", library: "Phosphor", variant: "Duotone", source: "wrong" },
      motionAndSound: { principle: "Legacy motion" },
      visual: { colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }] },
    };

    expect(reconcileColorBases(legacy, source).iconography).toEqual(source.iconography);
    const migrated = reconcileColorBases(saved, source);
    expect(migrated.iconography).toEqual({
      principle: "Bring your own icons.",
      library: "Phosphor",
      variant: "Duotone",
      source: "https://phosphoricons.com/",
    });
    expect(migrated).not.toHaveProperty("motionAndSound");
  });

  it("replaces a legacy Neutrals-stop Border with the current Ink-opacity model", () => {
    const source = {
      visual: {
        colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }],
        semanticColors: { border: { source: "Ink", mode: "ink-alpha", opacity: 0.2, value: "#182126" } },
      },
    };
    const saved = {
      visual: {
        colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }],
        semanticColors: { border: { source: "Neutrals", stop: 350 } },
      },
    };

    expect(reconcileColorBases(saved, source).visual.semanticColors?.border).toEqual({
      source: "Ink", mode: "ink-alpha", opacity: 0.2, value: "#182126",
    });
  });

  it("normalizes a saved custom Border back to editable Ink opacity", () => {
    const source = {
      visual: {
        colors: [{ name: "Signal", value: "#FF5C35", role: "Emphasis" }],
        semanticColors: { border: { source: "Ink", mode: "ink-alpha", opacity: 0.2, value: "#182126" } },
      },
    };
    const saved = {
      visual: {
        colors: [{ name: "Signal", value: "#32C365", role: "Emphasis" }],
        semanticColors: { border: { source: "Ink", mode: "custom", opacity: 0.35, value: "#FF00FF" } },
      },
    };

    expect(reconcileColorBases(saved, source).visual.semanticColors?.border).toEqual({
      source: "Ink", mode: "ink-alpha", opacity: 0.35, value: "#182126",
    });
  });
});
