export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type BrandChange = {
  path: string;
  before: JsonValue;
  after: JsonValue;
};

export type EditorDirections = {
  desired: string;
  avoided: string;
};

export const draftStorageKey = "brand-dna-editor-draft-v3";

type ColorBase = { name: string; value: string; role: string; mode?: "source" | "complementary" | "derived" | "custom" };
type ColorDraft = {
  visual: {
    colors: ColorBase[];
    semanticColors?: Record<string, unknown>;
    colorScale?: Record<string, unknown>;
    colorScales?: Record<string, unknown>;
    typography?: Record<string, Record<string, unknown>>;
  };
};

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
) => Object.fromEntries(["display", "body", "utility"].map((role) => {
  const font = { ...(source[role] ?? {}), ...(saved[role] ?? {}) };
  delete font.letterSpacing;
  delete font.lineHeight;
  return [role, font];
}));

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

  return {
    ...structuredClone(draft),
    visual: {
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
    },
  } as T;
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

export function setAtPath<T>(source: T, path: string, value: JsonValue): T {
  const result = structuredClone(source) as Record<string, unknown>;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
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
  directions: EditorDirections,
) {
  return {
    kind: "brand-dna-editor-change-request",
    version: 1,
    createdAt: new Date().toISOString(),
    target: "public/brand/brand-dna.json",
    preserveUnlistedFields: true,
    directions,
    changes: diffBrandDna(before, after),
  };
}

const printable = (value: JsonValue) => JSON.stringify(value);

export function buildUpdatePrompt(
  before: JsonValue,
  after: JsonValue,
  directions: EditorDirections,
) {
  const request = buildChangeRequest(before, after, directions);
  const changes = request.changes.length
    ? request.changes.map(({ path, before: oldValue, after: newValue }) =>
      `- ${path}: ${printable(oldValue)} -> ${printable(newValue)}`,
    ).join("\n")
    : "- No token or content changes yet.";

  return `Apply this Brand DNA editor change request.

Target: public/brand/brand-dna.json
Preserve every unlisted field and every referenced asset.

Desired direction:
${directions.desired || "Not specified."}

Avoided direction:
${directions.avoided || "Not specified."}

Exact designer decisions:
${changes}

Treat the exact changes above as designer decisions. Use the two directions only to guide any necessary supporting proposals. Update provenance.decisions for changed paths, keep proposals clearly labeled, validate the JSON against its schema, and run the project checks.`;
}
