import { describe, expect, it } from "vitest";
import { buildGoogleFontStylesheet, detectGoogleFontWeights, parseGoogleFontLink } from "./google-fonts";

describe("Google Fonts links", () => {
  it("treats a legacy missing source as an empty selection", () => {
    expect(parseGoogleFontLink(undefined)).toEqual({ source: "", family: "", stylesheet: "" });
  });

  it("turns a specimen link into a preview stylesheet", () => {
    expect(parseGoogleFontLink("https://fonts.google.com/specimen/DM+Serif+Display")).toEqual({
      source: "https://fonts.google.com/specimen/DM+Serif+Display",
      family: "DM Serif Display",
      stylesheet: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
    });
  });

  it("accepts the stylesheet link copied from Google Fonts", () => {
    expect(parseGoogleFontLink("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap")).toMatchObject({
      family: "Inter",
      stylesheet: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
    });
  });

  it("extracts the URL from a copied link tag", () => {
    expect(parseGoogleFontLink('<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&amp;display=swap" rel="stylesheet">')).toMatchObject({
      family: "Roboto Mono",
      stylesheet: "https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap",
    });
  });

  it("reads selected weights directly from a Google Fonts CSS link", async () => {
    await expect(detectGoogleFontWeights(
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
    )).resolves.toEqual([400, 500, 700]);
  });

  it("expands a variable-font weight range into simple preferred-weight choices", async () => {
    await expect(detectGoogleFontWeights(
      "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
    )).resolves.toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
  });

  it("probes canonical weights when a specimen link has no style metadata", async () => {
    const fetcher = (async (input: RequestInfo | URL) => ({
      ok: String(input).includes("wght@400") || String(input).includes("wght@700"),
    })) as typeof fetch;

    await expect(detectGoogleFontWeights(
      "https://fonts.google.com/specimen/Space+Mono",
      { fetcher },
    )).resolves.toEqual([400, 700]);
  });

  it("builds a stylesheet for the selected preferred weight", () => {
    expect(buildGoogleFontStylesheet("https://fonts.google.com/specimen/Lora", 600)).toBe(
      "https://fonts.googleapis.com/css2?family=Lora:wght@600&display=swap",
    );
  });
});
