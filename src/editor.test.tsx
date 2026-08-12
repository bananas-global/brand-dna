import { describe, expect, it } from "vitest";
import { buildChangeRequest, buildUpdatePrompt, diffBrandDna, reconcileColorBases, setAtPath } from "./editor";

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
    const source = { voice: { intent: "Old" }, asset: "logo.svg" };
    const draft = { voice: { intent: "Direct" }, asset: "logo.svg" };
    const directions = { desired: "Precise", avoided: "Corporate" };
    const prompt = buildUpdatePrompt(source, draft, directions);
    const request = buildChangeRequest(source, draft, directions);

    expect(prompt).toContain("Preserve every unlisted field and every referenced asset.");
    expect(prompt).toContain('voice.intent: "Old" -> "Direct"');
    expect(request).toMatchObject({
      kind: "brand-dna-editor-change-request",
      target: "public/brand/brand-dna.json",
      preserveUnlistedFields: true,
      directions,
    });
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
          display: { family: "Georgia", source: "", weight: 400 },
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
      display: { family: "Fraunces", source: "", weight: 400 },
      body: { family: "Inter", source: "", weight: 400 },
      utility: { family: "Roboto Mono", source: "", weight: 500 },
    });
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
