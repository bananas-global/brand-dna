import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { createEvalScenarios } from "./generated-assets.mjs";

const exists = async (file) => access(file).then(() => true, () => false);
const finding = (id, level, message) => ({ id, level, message });

export function evaluateHtmlArtifact(html, project) {
  const findings = [];
  const brandDna = project.brandDna;

  if (!/<!doctype html>/i.test(html)) findings.push(finding("document-doctype", "error", "Add an HTML doctype."));
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) findings.push(finding("document-language", "error", "Set the document language on <html>."));
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) findings.push(finding("responsive-viewport", "error", "Add a responsive viewport meta tag."));
  if (!/<main\b/i.test(html)) findings.push(finding("main-landmark", "error", "Use a <main> landmark."));
  if (!/<h1\b/i.test(html)) findings.push(finding("primary-heading", "error", "Give the artifact one <h1>."));
  if (!/<link\b[^>]*href=["'][^"']*brand\.css(?:[?#][^"']*)?["']/i.test(html)) {
    findings.push(finding("brand-stylesheet", "error", "Load the generated brand.css stylesheet."));
  }
  if (!/class=["'][^"']*\bbd-/i.test(html)) findings.push(finding("brand-primitives", "warning", "Use bd-* primitives for repeatable mechanics."));

  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  images.forEach((tag, index) => {
    if (!/\balt=["'][^"']*["']/i.test(tag)) findings.push(finding(`image-alt-${index + 1}`, "error", "Every image needs an alt attribute; use alt=\"\" for decorative images."));
  });

  const unnamedButtons = (html.match(/<button\b[^>]*>\s*(?:<[^>]+>\s*)*<\/button>/gi) ?? []).length;
  if (unnamedButtons) findings.push(finding("button-name", "error", `${unnamedButtons} button${unnamedButtons === 1 ? " has" : "s have"} no accessible text.`));

  const approvedColors = new Set([
    ...brandDna.visual.colors.map(({ value }) => value.toUpperCase()),
    ...(brandDna.visual.additionalColors ?? []).map(({ value }) => value.toUpperCase()),
    brandDna.visual.semanticColors.border.value.toUpperCase(),
  ]);
  const authoredCss = [
    ...(html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? []),
    ...(html.match(/\bstyle=["'][^"']*["']/gi) ?? []),
  ].join("\n");
  const rawColors = [...new Set((authoredCss.match(/#[0-9a-f]{6}\b/gi) ?? []).map((value) => value.toUpperCase()))];
  const unapproved = rawColors.filter((value) => !approvedColors.has(value));
  if (unapproved.length) findings.push(finding("unapproved-colors", "warning", `Page CSS introduces colors outside Brand DNA: ${unapproved.join(", ")}.`));

  const fontFamilies = [...authoredCss.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map((match) => match[1].trim());
  if (fontFamilies.some((value) => !value.startsWith("var(--brand-font"))) {
    findings.push(finding("unapproved-font-family", "warning", "Page CSS declares a font family outside the public Brand DNA tokens."));
  }

  return findings;
}

export async function runEvalDirectory(project, directory) {
  const definition = createEvalScenarios(project);
  const scenarioResults = [];

  for (const scenario of definition.scenarios) {
    const htmlFile = path.resolve(directory, scenario.expectedFile);
    const metadataFile = path.resolve(directory, `${scenario.id}.run.json`);
    const screenshotFile = path.resolve(directory, `${scenario.id}.png`);
    if (!await exists(htmlFile)) {
      scenarioResults.push({
        id: scenario.id,
        name: scenario.name,
        status: "missing",
        htmlFile,
        prompt: scenario.prompt,
        viewport: scenario.viewport,
        findings: [finding("artifact-missing", "error", `Expected ${scenario.expectedFile}.`)],
      });
      continue;
    }

    const html = await readFile(htmlFile, "utf8");
    const findings = evaluateHtmlArtifact(html, project);
    const metadata = await exists(metadataFile) ? JSON.parse(await readFile(metadataFile, "utf8")) : null;
    if (!metadata?.model) findings.push(finding("run-model", "warning", `Record the model in ${scenario.id}.run.json.`));
    if (!metadata?.guidanceVersion) findings.push(finding("run-guidance-version", "warning", `Record the guidance version in ${scenario.id}.run.json.`));
    if (!await exists(screenshotFile)) findings.push(finding("run-screenshot", "warning", `Save the first-attempt screenshot as ${scenario.id}.png.`));

    scenarioResults.push({
      id: scenario.id,
      name: scenario.name,
      status: findings.some(({ level }) => level === "error") ? "failed" : "passed",
      htmlFile,
      prompt: scenario.prompt,
      viewport: scenario.viewport,
      rubric: scenario.rubric,
      metadata,
      screenshot: await exists(screenshotFile) ? screenshotFile : null,
      findings,
    });
  }

  return {
    kind: "brand-dna-eval-report",
    version: 1,
    createdAt: new Date().toISOString(),
    brand: project.brandDna.meta.brandName,
    brandVersion: project.brandDna.meta.version,
    passed: scenarioResults.every(({ status }) => status === "passed"),
    summary: {
      passed: scenarioResults.filter(({ status }) => status === "passed").length,
      failed: scenarioResults.filter(({ status }) => status === "failed").length,
      missing: scenarioResults.filter(({ status }) => status === "missing").length,
      errors: scenarioResults.flatMap(({ findings }) => findings).filter(({ level }) => level === "error").length,
      warnings: scenarioResults.flatMap(({ findings }) => findings).filter(({ level }) => level === "warning").length,
    },
    scenarios: scenarioResults,
  };
}
