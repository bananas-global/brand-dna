import { describe, expect, it } from "vitest";
import { createBrandStylesheet } from "../lib/generated-assets.mjs";
import defaultBrandDna from "../public/brand/brand-dna.json";
import { getColorAtStop, type ColorScaleSettings } from "./color-scale";

type ShadowToken = typeof defaultBrandDna.visual.shadows.base;

// The brandbook formula from src/App.tsx (getDerivedShadow + getShadowCss).
const brandbookShadow = (base: ShadowToken, multiplier: number, size: "sm" | "md" | "lg", signal: string, settings: ColorScaleSettings) => {
  const factor = size === "sm" ? 1 / multiplier : size === "lg" ? multiplier : 1;
  const scale = (value: number) => Math.round(value * factor * 10) / 10;
  const distance = scale(base.distance);
  const radians = base.angle * Math.PI / 180;
  const x = Math.round(Math.cos(radians) * distance * 100) / 100;
  const y = Math.round(Math.sin(radians) * distance * 100) / 100;
  const hex = getColorAtStop(signal, settings, base.colorStop).replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `${x}px ${y}px ${scale(base.blur)}px ${scale(base.spread)}px rgba(${red}, ${green}, ${blue}, ${base.opacity})`;
};

const shadowTokens = (css: string) => Object.fromEntries([...css.matchAll(/--brand-shadow-(sm|md|lg): ([^;]+);/g)].map(([, size, value]) => [size, value]));

const bloomyLike = {
  ...defaultBrandDna,
  visual: {
    ...defaultBrandDna.visual,
    colors: defaultBrandDna.visual.colors.map((color) => color.name === "Signal" ? { ...color, value: "#58BADA" } : color),
    colorScale: { ...defaultBrandDna.visual.colorScale, hueMultiplier: 1.04, hueFlip: false, saturationMultiplier: 1.15, saturationFlip: false, contrast: 1 },
    shadows: { base: { distance: 14, angle: 90, blur: 17, spread: -2, colorStop: 750, opacity: 0.48 }, multiplier: 1.4 },
  },
};

describe("brand.css shadows", () => {
  it.each([["default", defaultBrandDna], ["bloomy-like", bloomyLike]])("match the brandbook formula for the %s Brand DNA", (_, brandDna) => {
    const signal = brandDna.visual.colors.find((color) => color.name === "Signal")!.value;
    const tokens = shadowTokens(createBrandStylesheet({ brandDna }));
    for (const size of ["sm", "md", "lg"] as const) {
      expect(tokens[size]).toBe(brandbookShadow(brandDna.visual.shadows.base, brandDna.visual.shadows.multiplier, size, signal, brandDna.visual.colorScale));
    }
  });

  it("colours the shadow from the Signal scale at colorStop", () => {
    const tokens = shadowTokens(createBrandStylesheet({ brandDna: bloomyLike }));
    expect(tokens.md).toBe("0px 14px 17px -2px rgba(27, 109, 140, 0.48)");
    expect(tokens.sm).toBe("0px 10px 12.1px -1.4px rgba(27, 109, 140, 0.48)");
    expect(tokens.lg).toBe("0px 19.6px 23.8px -2.8px rgba(27, 109, 140, 0.48)");
  });
});
