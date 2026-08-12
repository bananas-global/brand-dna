export type GoogleFontLink = {
  source: string;
  family: string;
  stylesheet: string;
};

const canonicalWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const weightCache = new Map<string, number[]>();

const emptyResult = (source: string): GoogleFontLink => ({ source, family: "", stylesheet: "" });

export function parseGoogleFontLink(input?: string): GoogleFontLink {
  const trimmed = input?.trim() ?? "";
  const href = trimmed.match(/href=["']([^"']+)["']/i)?.[1];
  const source = (href ?? trimmed).replaceAll("&amp;", "&");
  if (!source) return emptyResult("");

  try {
    const url = new URL(source);
    if (url.hostname !== "fonts.google.com" && url.hostname !== "fonts.googleapis.com") {
      return emptyResult(source);
    }

    const specimenFamily = url.pathname.match(/^\/specimen\/([^/]+)/)?.[1];
    const cssFamily = url.searchParams.get("family")?.split(":")[0];
    const encodedFamily = specimenFamily ?? cssFamily;
    const family = encodedFamily
      ? decodeURIComponent(encodedFamily.replaceAll("+", " "))
      : "";
    const stylesheet = url.hostname === "fonts.googleapis.com"
      ? source
      : family
        ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replaceAll("%20", "+")}&display=swap`
        : "";

    return { source, family, stylesheet };
  } catch {
    return emptyResult(source);
  }
}

const familyQuery = (family: string) => encodeURIComponent(family).replaceAll("%20", "+");

export function buildGoogleFontStylesheet(input: string | undefined, weight: number) {
  const font = parseGoogleFontLink(input);
  return font.family
    ? `https://fonts.googleapis.com/css2?family=${familyQuery(font.family)}:wght@${weight}&display=swap`
    : font.stylesheet;
}

function weightsFromCssLink(source: string) {
  try {
    const url = new URL(source);
    if (url.hostname !== "fonts.googleapis.com") return [];
    const family = url.searchParams.get("family") ?? "";
    const axisDefinition = family.split(":")[1];
    if (!axisDefinition?.includes("@")) return [];
    const [axisNames, axisValues] = axisDefinition.split("@");
    const weightIndex = axisNames.split(",").indexOf("wght");
    if (weightIndex < 0) return [];

    const values = axisValues.split(";").flatMap((tuple) => {
      const weight = tuple.split(",")[weightIndex];
      if (!weight) return [];
      if (weight.includes("..")) {
        const [min, max] = weight.split("..").map(Number);
        return canonicalWeights.filter((candidate) => candidate >= min && candidate <= max);
      }
      const numeric = Number(weight);
      return Number.isFinite(numeric) ? [numeric] : [];
    });
    return [...new Set(values)].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export async function detectGoogleFontWeights(
  input: string | undefined,
  options: { signal?: AbortSignal; fetcher?: typeof fetch } = {},
) {
  const font = parseGoogleFontLink(input);
  if (!font.family) return [];
  const declaredWeights = weightsFromCssLink(font.source);
  if (declaredWeights.length) return declaredWeights;
  const cached = weightCache.get(font.family);
  if (cached) return cached;

  const fetcher = options.fetcher ?? fetch;
  const results = await Promise.all(canonicalWeights.map(async (weight) => {
    try {
      const response = await fetcher(buildGoogleFontStylesheet(font.source, weight), { signal: options.signal });
      return response.ok ? weight : null;
    } catch {
      return null;
    }
  }));
  const weights = results.filter((weight): weight is number => weight !== null);
  if (options.fetcher === undefined && weights.length) weightCache.set(font.family, weights);
  return weights;
}
