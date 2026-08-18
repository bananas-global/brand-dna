export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type BrandChange = {
  path: string;
  before: JsonValue;
  after: JsonValue;
};

export const draftStorageKey = "brand-dna-editor-draft-v3";

type ColorBase = { name: string; value: string; role: string; mode?: "source" | "complementary" | "derived" | "custom" };
type IconographyDraft = { principle?: string; library?: string; variant?: string; source?: string; [key: string]: unknown };
type ImageryDirectionDraft = { name?: string; asset?: string; description?: string; prompt?: string; [key: string]: unknown };
type ImageryDraft = { principle?: string; directions?: ImageryDirectionDraft[]; do?: string; avoid?: string; [key: string]: unknown };
type VoiceDimensionDraft = { name?: string; left?: string; right?: string; value?: number; description?: string; [key: string]: unknown };
type VoiceDraft = { dimensions?: VoiceDimensionDraft[]; say?: string; dontSay?: string; [key: string]: unknown };
type ColorDraft = {
  meta?: Record<string, unknown>;
  essence?: Record<string, unknown>;
  voice?: VoiceDraft;
  iconography?: IconographyDraft;
  imagery?: ImageryDraft;
  visual: {
    colors: ColorBase[];
    semanticColors?: Record<string, unknown>;
    colorScale?: Record<string, unknown>;
    colorScales?: Record<string, unknown>;
    typography?: Record<string, Record<string, unknown>>;
    borders?: Record<string, unknown>;
    spacing?: Record<string, unknown>;
    radii?: Record<string, unknown>;
    shadows?: Record<string, unknown>;
  };
};

const iconographyLibraries = {
  Lucide: { source: "https://lucide.dev/icons/", variants: ["Outline"] },
  Phosphor: { source: "https://phosphoricons.com/", variants: ["Thin", "Light", "Regular", "Bold", "Fill", "Duotone"] },
  "Material Symbols": { source: "https://fonts.google.com/icons", variants: ["Outlined", "Rounded", "Sharp"] },
  Heroicons: { source: "https://heroicons.com/", variants: ["Outline", "Solid", "Mini", "Micro"] },
  "Font Awesome Free": { source: "https://fontawesome.com/search?o=r&m=free", variants: ["Solid", "Regular", "Brands"] },
} as const;

const normalizeScale = (scale: Record<string, unknown>) => {
  const settings = { ...scale };
  const hasToneStructure = "lightSteps" in settings || "darkSteps" in settings || "basePosition" in settings;
  delete settings.basePosition;
  delete settings.semanticHueHarmonization;
  return hasToneStructure ? { ...settings, lightSteps: 10, darkSteps: 10 } : settings;
};

const normalizeColorScales = (scales: Record<string, unknown>) => Object.fromEntries(
  Object.entries(scales).map(([name, entry]) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [name, entry];
    const record = entry as Record<string, unknown>;
    const settings = record.settings;
    return [name, {
      ...record,
      ...(settings && typeof settings === "object" && !Array.isArray(settings)
        ? { settings: normalizeScale(settings as Record<string, unknown>) }
        : {}),
    }];
  }),
);

const normalizeTypography = (
  source: Record<string, Record<string, unknown>>,
  saved: Record<string, Record<string, unknown>>,
) => Object.fromEntries(["headings", "body", "utility"].map((role) => {
  const legacyFont = role === "headings" ? saved.display : undefined;
  const font = { ...(source[role] ?? {}), ...(legacyFont ?? {}), ...(saved[role] ?? {}) };
  delete font.letterSpacing;
  delete font.lineHeight;
  return [role, font];
}));

const normalizeShadows = (
  source: Record<string, unknown>,
  saved: Record<string, unknown>,
) => {
  const sourceToken = source.base as Record<string, unknown> | undefined;
  const savedToken = (saved.base ?? saved.md) as Record<string, unknown> | undefined;
  const token = { ...(sourceToken ?? {}) };
  for (const key of ["distance", "angle", "blur", "spread", "colorStop", "opacity"] as const) {
    if (typeof savedToken?.[key] === "number") token[key] = savedToken[key];
  }
  const savedMultiplier = typeof saved.multiplier === "number"
    ? saved.multiplier
    : typeof (saved.lg as Record<string, unknown> | undefined)?.distance === "number"
      && typeof savedToken?.distance === "number"
      && savedToken.distance > 0
      ? Number(((saved.lg as Record<string, number>).distance / savedToken.distance).toFixed(1))
      : undefined;
  return {
    base: token,
    multiplier: typeof savedMultiplier === "number" && savedMultiplier >= 1 && savedMultiplier <= 3
      ? savedMultiplier
      : source.multiplier,
  };
};

export function reconcileColorBases<T extends ColorDraft>(draft: ColorDraft, source: T): T {
  const savedColors = draft.visual.colors;
  const colors = source.visual.colors.map((sourceColor) => {
    const savedColor = savedColors.find(({ name }) => name === sourceColor.name)
      ?? (sourceColor.name === "Accent" ? savedColors.find(({ name }) => name === "Pulse") : undefined);
    return savedColor
      ? { ...sourceColor, value: savedColor.value, ...(savedColor.mode ? { mode: savedColor.mode } : {}) }
      : structuredClone(sourceColor);
  });
  const sourceSemanticColors = structuredClone(source.visual.semanticColors ?? {});
  const savedSemanticColors = structuredClone(draft.visual.semanticColors ?? {});
  const savedBorder = savedSemanticColors.border as Record<string, unknown> | undefined;
  const sourceBorder = sourceSemanticColors.border as Record<string, unknown> | undefined;
  const border = sourceBorder
    ? {
      ...sourceBorder,
      ...(typeof savedBorder?.opacity === "number" ? { opacity: savedBorder.opacity } : {}),
      mode: "ink-alpha",
    }
    : undefined;
  const typography = source.visual.typography
    ? normalizeTypography(source.visual.typography, draft.visual.typography ?? {})
    : undefined;
  const sourceBorders = source.visual.borders;
  const savedBorders = draft.visual.borders;
  const thickness = savedBorders?.thickness;
  const radius = savedBorders?.radius;
  const migratedThickness = typeof thickness === "string"
    ? (({ sm: "thin", md: "medium", lg: "bold" } as Record<string, string>)[thickness] ?? thickness)
    : typeof thickness === "number"
      ? thickness <= 1 ? "thin" : thickness <= 2 ? "medium" : "bold"
      : undefined;
  const migratedRadius = typeof radius === "string"
    ? (({ none: 0, sm: 0, hard: 0, sharp: 0, md: 1, medium: 1, lg: 3, soft: 3 } as Record<string, number>)[radius])
    : typeof radius === "number"
      ? radius <= 3 ? Math.round(Math.max(0, radius) * 10) / 10 : radius <= 8 ? 0 : radius <= 16 ? 1 : 3
      : undefined;
  const borders = sourceBorders
    ? {
      ...structuredClone(sourceBorders),
      ...(migratedThickness && ["thin", "medium", "bold"].includes(migratedThickness) ? { thickness: migratedThickness } : {}),
      ...(typeof migratedRadius === "number" ? { radius: migratedRadius } : {}),
      ...(typeof savedBorders?.buttonPill === "boolean" ? { buttonPill: savedBorders.buttonPill } : {}),
    }
    : undefined;
  const shadows = source.visual.shadows
    ? normalizeShadows(source.visual.shadows, draft.visual.shadows ?? {})
    : undefined;
  const sourceIconography = source.iconography;
  const savedIconography = draft.iconography;
  const savedLibrary = savedIconography?.library;
  const librarySettings = typeof savedLibrary === "string"
    ? iconographyLibraries[savedLibrary as keyof typeof iconographyLibraries]
    : undefined;
  const iconography = sourceIconography
    ? librarySettings && savedLibrary
      ? {
        ...structuredClone(sourceIconography),
        library: savedLibrary,
        variant: typeof savedIconography?.variant === "string" && (librarySettings.variants as readonly string[]).includes(savedIconography.variant)
          ? savedIconography.variant
          : librarySettings.variants[0],
        source: librarySettings.source,
      }
      : structuredClone(sourceIconography)
    : undefined;
  const sourceImagery = source.imagery;
  const savedImagery = draft.imagery;
  const imagery = sourceImagery
    ? {
      ...structuredClone(sourceImagery),
      ...(typeof savedImagery?.principle === "string" ? { principle: savedImagery.principle } : {}),
      ...(typeof savedImagery?.do === "string" ? { do: savedImagery.do } : {}),
      ...(typeof savedImagery?.avoid === "string" ? { avoid: savedImagery.avoid } : {}),
      directions: (sourceImagery.directions ?? []).map((sourceDirection, index) => {
        const exactSavedDirection = savedImagery?.directions?.find(({ asset }) => asset === sourceDirection.asset);
        const legacySavedDirection = savedImagery?.directions?.[index];
        const savedDirection = exactSavedDirection
          ?? (legacySavedDirection?.asset === undefined ? legacySavedDirection : undefined);
        return {
          ...structuredClone(sourceDirection),
          ...(typeof savedDirection?.name === "string" ? { name: savedDirection.name } : {}),
          ...(typeof savedDirection?.description === "string" ? { description: savedDirection.description } : {}),
          ...(typeof savedDirection?.prompt === "string" ? { prompt: savedDirection.prompt } : {}),
        };
      }),
    }
    : undefined;
  const sourceVoice = source.voice;
  const savedVoice = draft.voice;
  const voice = sourceVoice
    ? {
      ...structuredClone(sourceVoice),
      dimensions: (sourceVoice.dimensions ?? []).map((sourceDimension) => {
        const savedDimension = savedVoice?.dimensions?.find(({ name }) =>
          name === sourceDimension.name || (sourceDimension.name === "Playfulness" && name === "Energy"),
        );
        const savedValue = typeof savedDimension?.value === "number"
          ? savedDimension.name === "Energy" ? 100 - savedDimension.value : savedDimension.value
          : undefined;
        return {
          ...structuredClone(sourceDimension),
          ...(typeof savedValue === "number" ? { value: savedValue } : {}),
        };
      }),
      ...(typeof savedVoice?.say === "string" ? { say: savedVoice.say } : {}),
      ...(typeof savedVoice?.dontSay === "string" ? { dontSay: savedVoice.dontSay } : {}),
    }
    : undefined;

  const visual = {
    ...structuredClone(draft.visual),
    colors,
    semanticColors: {
      ...sourceSemanticColors,
      ...savedSemanticColors,
      ...(border ? { border } : {}),
    },
    colorScale: normalizeScale({
      ...structuredClone(source.visual.colorScale ?? {}),
      ...structuredClone(draft.visual.colorScale ?? {}),
    }),
    colorScales: normalizeColorScales({
      ...structuredClone(source.visual.colorScales ?? {}),
      ...structuredClone(draft.visual.colorScales ?? {}),
    }),
    ...(typography ? { typography } : {}),
    ...(borders ? { borders } : {}),
    ...(shadows ? { shadows } : {}),
  };
  if (borders) {
    delete visual.spacing;
    delete visual.radii;
  }

  const reconciled = {
    ...structuredClone(draft),
    meta: {
      ...structuredClone(source.meta ?? {}),
      ...(typeof draft.meta?.brandName === "string" && !/^\s*\[.+\]\s*$/.test(draft.meta.brandName)
        ? { brandName: draft.meta.brandName }
        : {}),
    },
    essence: structuredClone(source.essence ?? draft.essence ?? {}),
    ...(voice ? { voice } : {}),
    ...(iconography ? { iconography } : {}),
    ...(imagery ? { imagery } : {}),
    visual,
  } as T;
  if (!("motionAndSound" in source)) {
    delete (reconciled as T & { motionAndSound?: unknown }).motionAndSound;
  }
  delete (reconciled as T & { expressionPrinciples?: unknown }).expressionPrinciples;
  return reconciled;
}

const isRecord = (value: JsonValue): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function diffBrandDna(before: JsonValue, after: JsonValue, path = ""): BrandChange[] {
  if (Object.is(before, after)) return [];

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    return Array.from({ length }, (_, index) =>
      diffBrandDna(before[index] ?? null, after[index] ?? null, `${path}[${index}]`),
    ).flat();
  }

  if (isRecord(before) && isRecord(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) =>
      diffBrandDna(before[key] ?? null, after[key] ?? null, path ? `${path}.${key}` : key),
    );
  }

  return [{ path, before, after }];
}

const pathParts = (path: string) => path.replace(/\[(\d+)\]/g, ".$1").split(".");

const getAtPath = (root: JsonValue, path: string) => pathParts(path).reduce<JsonValue | undefined>(
  (cursor, part) => (cursor && typeof cursor === "object"
    ? (cursor as { [key: string]: JsonValue })[part]
    : undefined),
  root,
);

const containerAt = (root: JsonValue, path: string) => {
  const parts = pathParts(path);
  return parts.length === 1 ? root : getAtPath(root, parts.slice(0, -1).join("."));
};

const sameValue = (left: JsonValue | undefined, right: JsonValue | undefined) =>
  diffBrandDna(left ?? null, right ?? null).length === 0;

export function rebaseDraft<T extends JsonValue>(draft: T, base: JsonValue, source: JsonValue): T {
  return diffBrandDna(base, source).reduce((result, { path, before, after }) => {
    const container = containerAt(result, path);
    if (!container || typeof container !== "object") return result;
    // The draft still carries the value it was saved against, so the newer source owns this path.
    return sameValue(getAtPath(result, path), before) ? setAtPath(result, path, after) : result;
  }, draft);
}

export function setAtPath<T>(source: T, path: string, value: JsonValue): T {
  const result = structuredClone(source) as Record<string, unknown>;
  const parts = pathParts(path);
  let cursor: Record<string, unknown> | unknown[] = result;

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      if (Array.isArray(cursor)) cursor[Number(part)] = value;
      else cursor[part] = value;
      return;
    }
    cursor = Array.isArray(cursor)
      ? cursor[Number(part)] as Record<string, unknown> | unknown[]
      : cursor[part] as Record<string, unknown> | unknown[];
  });

  return result as T;
}

export function buildChangeRequest(
  before: JsonValue,
  after: JsonValue,
) {
  return {
    kind: "brand-dna-editor-change-request",
    version: 1,
    createdAt: new Date().toISOString(),
    target: "public/brand/brand-dna.json",
    preserveUnlistedFields: true,
    changes: diffBrandDna(before, after),
  };
}

const printable = (value: JsonValue) => JSON.stringify(value);

export function buildUpdatePrompt(
  before: JsonValue,
  after: JsonValue,
) {
  const request = buildChangeRequest(before, after);
  const changes = request.changes.length
    ? request.changes.map(({ path, before: oldValue, after: newValue }) =>
      `- ${path}: ${printable(oldValue)} -> ${printable(newValue)}`,
    ).join("\n")
    : "- No token or content changes yet.";

  return `Apply this Brand DNA editor change request.

Target: public/brand/brand-dna.json
Preserve every unlisted field and every referenced asset.

Exact designer decisions:
${changes}

Treat the exact changes above as designer decisions. Update provenance.decisions for changed paths, keep proposals clearly labeled, validate the JSON against its schema, and run the project checks.`;
}
