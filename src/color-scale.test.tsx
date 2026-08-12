import { describe, expect, it } from "vitest";
import {
  generateColorScale,
  getColorAtStop,
  getComplementaryColor,
  getContrastColor,
  getContrastRatio,
  getScaleTones,
  getSemanticStateColor,
  getSemanticStateHue,
  isHexColor,
  resolveBaseColors,
} from "./color-scale";

const settings = {
  lightSteps: 10,
  darkSteps: 10,
  hueMultiplier: 1.1,
  saturationMultiplier: 1.1,
  contrast: 1,
};

describe("generated color scales", () => {
  it("creates ten valid light tones and ten valid dark tones around the unchanged base", () => {
    const scale = generateColorScale("#FF5C35", settings);

    expect(scale.light).toHaveLength(10);
    expect(scale.dark).toHaveLength(10);
    expect(scale.base).toBe("#FF5C35");
    expect([...scale.light, ...scale.dark].every(isHexColor)).toBe(true);
    expect(scale.light[0]).not.toBe(scale.dark[0]);
  });

  it("changes the generated tones when a multiplier changes without changing the base", () => {
    const restrained = generateColorScale("#6657FF", settings);
    const expressive = generateColorScale("#6657FF", { ...settings, hueMultiplier: 2, saturationMultiplier: 2, contrast: 1.2 });

    expect(expressive.light).not.toEqual(restrained.light);
    expect(expressive.dark).not.toEqual(restrained.dark);
    expect(expressive.base).toBe(restrained.base);
  });

  it("flips the hue drift direction without changing the base or lightness progression", () => {
    const standard = generateColorScale("#FF5C35", { ...settings, hueMultiplier: 1.6, hueFlip: false });
    const flipped = generateColorScale("#FF5C35", { ...settings, hueMultiplier: 1.6, hueFlip: true });

    expect(flipped.light).not.toEqual(standard.light);
    expect(flipped.dark).not.toEqual(standard.dark);
    expect(flipped.base).toBe(standard.base);
    expect(flipped.light).toHaveLength(standard.light.length);
    expect(flipped.dark).toHaveLength(standard.dark.length);
  });

  it("flips the saturation drift direction without changing the base or tone count", () => {
    const standard = generateColorScale("#FF5C35", { ...settings, saturationMultiplier: 1.8, saturationFlip: false });
    const flipped = generateColorScale("#FF5C35", { ...settings, saturationMultiplier: 1.8, saturationFlip: true });

    expect(flipped.light).not.toEqual(standard.light);
    expect(flipped.dark).not.toEqual(standard.dark);
    expect(flipped.base).toBe(standard.base);
    expect(flipped.light).toHaveLength(standard.light.length);
    expect(flipped.dark).toHaveLength(standard.dark.length);
  });

  it("maps the 21 tones to stops from 0 through 1000 with the base fixed at 500", () => {
    const tones = getScaleTones("#FF5C35", settings);

    expect(tones).toHaveLength(21);
    expect(getColorAtStop("#FF5C35", settings, 0)).toBe(tones[0]);
    expect(getColorAtStop("#FF5C35", settings, 500)).toBe("#FF5C35");
    expect(getColorAtStop("#FF5C35", settings, 900)).toBe(tones[18]);
  });

  it("derives complementary Accent and recognizable semantic states from Signal", () => {
    expect(getComplementaryColor("#FF5C35")).toBe("#35D8FF");
    expect(getSemanticStateHue("#FF5C35", "Success")).toBeCloseTo(106.99, 2);
    expect(getSemanticStateHue("#FF5C35", "Warning")).toBeCloseTo(40.99, 2);
    expect(getSemanticStateHue("#FF5C35", "Error")).toBeCloseTo(1.39, 2);
    expect(getSemanticStateColor("#FF5C35", "Success")).toBe("#51ED26");
    expect(getSemanticStateColor("#FF5C35", "Warning")).toBe("#EFB539");
    expect(getSemanticStateColor("#FF5C35", "Error")).toBe("#ED2B26");
    expect(resolveBaseColors([
      { name: "Signal", value: "#FF5C35" },
      { name: "Accent", value: "#6657FF", mode: "complementary" },
      { name: "Success", value: "#2E9B58", mode: "derived" },
      { name: "Warning", value: "#D99A16", mode: "derived" },
      { name: "Error", value: "#D94332", mode: "derived" },
    ]).map(({ value }) => value)).toEqual(["#FF5C35", "#35D8FF", "#51ED26", "#EFB539", "#ED2B26"]);
  });

  it("uses stored values when a derived color switches to custom", () => {
    expect(resolveBaseColors([
      { name: "Signal", value: "#FF5C35" },
      { name: "Accent", value: "#6657FF", mode: "custom" },
      { name: "Success", value: "#2E9B58", mode: "custom" },
    ]).map(({ value }) => value)).toEqual(["#FF5C35", "#6657FF", "#2E9B58"]);
  });

  it("defines Contrast as the scale endpoint with the higher ratio against the base", () => {
    for (const base of ["#FFCA0D", "#182126", "#8A8A8A"]) {
      const light = getColorAtStop(base, settings, 0);
      const dark = getColorAtStop(base, settings, 1000);
      const expected = getContrastRatio(base, light) >= getContrastRatio(base, dark)
        ? { stop: 0, value: light }
        : { stop: 1000, value: dark };
      const contrast = getContrastColor(base, settings);

      expect(contrast).toMatchObject(expected);
      expect(contrast.ratio).toBeCloseTo(getContrastRatio(base, expected.value), 8);
    }
  });
});
