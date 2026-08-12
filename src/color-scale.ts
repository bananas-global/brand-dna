export type ColorScaleSettings = {
  lightSteps: number;
  darkSteps: number;
  hueMultiplier: number;
  hueFlip?: boolean;
  saturationMultiplier: number;
  saturationFlip?: boolean;
  contrast: number;
};

type Hsl = { h: number; s: number; l: number };
type BaseColor = { name: string; value: string; mode?: "source" | "complementary" | "derived" | "custom" };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrapHue = (value: number) => (value % 360 + 360) % 360;

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function getComplementaryColor(baseHex: string) {
  const base = hexToHsl(baseHex);
  return hslToHex({ ...base, h: base.h + 180 });
}

export function getSemanticStateHue(baseHex: string, name: string) {
  const base = hexToHsl(baseHex);
  const target = name === "Success" ? 120 : name === "Warning" ? 45 : 0;
  const delta = ((base.h - target + 180) % 360 + 360) % 360 - 180;
  return wrapHue(target + 0.12 * delta);
}

export function getSemanticStateColor(baseHex: string, name: string) {
  const base = hexToHsl(baseHex);
  const hue = getSemanticStateHue(baseHex, name);
  const saturation = clamp(base.s * 0.85, 55, 85);
  const lightness = name === "Warning" ? clamp(base.l, 48, 58) : clamp(base.l, 42, 54);
  return hslToHex({ h: hue, s: saturation, l: lightness });
}

export function resolveBaseColorValue(color: BaseColor, signalHex: string) {
  if (color.name === "Accent" && color.mode === "complementary") return getComplementaryColor(signalHex);
  if (["Success", "Warning", "Error"].includes(color.name) && color.mode === "derived") return getSemanticStateColor(signalHex, color.name);
  return isHexColor(color.value) ? color.value.toUpperCase() : "#000000";
}

export function resolveBaseColors<T extends BaseColor>(colors: T[]) {
  const signal = colors.find(({ name }) => name === "Signal") ?? colors[0];
  const signalHex = isHexColor(signal?.value) ? signal.value : "#000000";
  return colors.map((color) => ({ ...color, value: resolveBaseColorValue(color, signalHex) }));
}

function hexToHsl(hex: string): Hsl {
  const safeHex = isHexColor(hex) ? hex : "#000000";
  const red = Number.parseInt(safeHex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(safeHex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(safeHex.slice(5, 7), 16) / 255;
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
}

function hslToHex({ h, s, l }: Hsl) {
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
}

export function generateColorScale(baseHex: string, settings: ColorScaleSettings) {
  const base = hexToHsl(baseHex);
  const hueRange = (settings.hueMultiplier - 1) * 100;
  const saturationRange = settings.saturationMultiplier - 1;

  const makeTone = (step: number, total: number, direction: "light" | "dark") => {
    const progress = step / (total + 1);
    const contrastProgress = clamp(progress * settings.contrast, 0, 0.98);
    const light = direction === "light"
      ? base.l + (100 - base.l) * contrastProgress
      : base.l * (1 - contrastProgress);
    const saturationDirection = settings.saturationFlip ? -1 : 1;
    const saturation = direction === "light"
      ? base.s * (1 - progress * saturationRange * saturationDirection)
      : base.s * (1 + progress * saturationRange * saturationDirection);
    const hueDirection = settings.hueFlip ? -1 : 1;
    const hue = direction === "light"
      ? base.h - progress * hueRange * hueDirection
      : base.h + progress * hueRange * hueDirection;
    return hslToHex({ h: hue, s: saturation, l: light });
  };

  return {
    light: Array.from({ length: settings.lightSteps }, (_, index) => makeTone(index + 1, settings.lightSteps, "light")),
    base: isHexColor(baseHex) ? baseHex.toUpperCase() : "#000000",
    dark: Array.from({ length: settings.darkSteps }, (_, index) => makeTone(index + 1, settings.darkSteps, "dark")),
  };
}

export function getScaleTones(baseHex: string, settings: ColorScaleSettings) {
  const scale = generateColorScale(baseHex, settings);
  return [...scale.light].reverse().concat(scale.base, scale.dark);
}

export function getColorAtStop(baseHex: string, settings: ColorScaleSettings, stop: number) {
  const normalizedStop = clamp(Math.round(stop / 50) * 50, 0, 1000);
  return getScaleTones(baseHex, settings)[normalizedStop / 50];
}

function relativeLuminance(hex: string) {
  const safeHex = isHexColor(hex) ? hex : "#000000";
  const channels = [1, 3, 5].map((start) => Number.parseInt(safeHex.slice(start, start + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export function getContrastRatio(firstHex: string, secondHex: string) {
  const first = relativeLuminance(firstHex);
  const second = relativeLuminance(secondHex);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function getContrastColor(baseHex: string, settings: ColorScaleSettings) {
  const candidates = [0, 1000].map((stop) => {
    const value = getColorAtStop(baseHex, settings, stop);
    return { stop, value, ratio: getContrastRatio(baseHex, value) };
  });
  return candidates[0].ratio >= candidates[1].ratio ? candidates[0] : candidates[1];
}
