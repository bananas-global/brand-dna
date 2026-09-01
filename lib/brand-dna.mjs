import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
export { createBrandStylesheet, createDesignMarkdown, createEvalScenarios } from "./generated-assets.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const defaultConfig = {
  sourceDir: "public/brand",
  outputDir: "dist",
  basePath: "/brand-dna/",
  siteUrl: "https://bananas-global.github.io/brand-dna/",
};

export const normalizeBasePath = (value = "/brand-dna/") => {
  const withStart = value.startsWith("/") ? value : `/${value}`;
  return withStart.endsWith("/") ? withStart : `${withStart}/`;
};

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function loadBrandProject({ cwd = process.cwd(), configPath } = {}) {
  const resolvedConfigPath = path.resolve(cwd, configPath ?? process.env.BRAND_DNA_CONFIG ?? "brand-dna.config.json");
  let config = defaultConfig;
  try {
    config = { ...defaultConfig, ...await readJson(resolvedConfigPath) };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    if (path.resolve(cwd) !== packageRoot) {
      throw new Error(`Brand DNA configuration not found: ${resolvedConfigPath}`);
    }
  }

  const sourceDir = path.resolve(cwd, process.env.BRAND_DNA_SOURCE_DIR ?? config.sourceDir);
  const outputDir = path.resolve(cwd, process.env.BRAND_DNA_OUTPUT_DIR ?? config.outputDir);
  const basePath = normalizeBasePath(process.env.BRAND_DNA_BASE_PATH ?? config.basePath);
  const siteUrl = process.env.BRAND_DNA_SITE_URL ?? config.siteUrl ?? "";
  const brandFile = path.join(sourceDir, "brand-dna.json");
  const schemaFile = path.join(sourceDir, "brand-dna.schema.json");
  const brandDna = await readJson(brandFile);

  return {
    cwd: path.resolve(cwd),
    configPath: resolvedConfigPath,
    sourceDir,
    sourceLabel: path.relative(cwd, sourceDir) || ".",
    outputDir,
    basePath,
    siteUrl,
    brandFile,
    schemaFile,
    brandDna,
  };
}

const formatErrors = (errors = []) => errors.map((error) => {
  const location = error.instancePath || "/";
  return `${location} ${error.message}`;
});

export async function validateBrandProject(project) {
  const schema = await readJson(project.schemaFile);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const errors = validate(project.brandDna) ? [] : formatErrors(validate.errors);

  const requiredLogoFiles = ["default.svg", "icon.svg", "wordmark.svg", "black.svg", "white.svg"];
  const referencedAssets = [
    ...requiredLogoFiles.map((file) => path.join(project.sourceDir, "logo", file)),
    ...(project.brandDna.imagery?.directions ?? []).map(({ asset }) => path.join(project.sourceDir, "imagery", asset)),
  ];
  const missingAssets = [];
  await Promise.all(referencedAssets.map(async (file) => {
    try {
      await access(file);
    } catch {
      missingAssets.push(`Missing referenced asset: ${path.relative(project.cwd, file)}`);
    }
  }));

  const provenance = project.brandDna.provenance ?? {};
  const provenanceErrors = [];
  for (const category of ["evidence", "decisions", "proposals", "missing"]) {
    const values = provenance[category] ?? [];
    values.forEach((value, index) => {
      if (typeof value !== "string" || value.trim() === "") {
        provenanceErrors.push(`/provenance/${category}/${index} must be a non-empty string`);
      }
    });
  }
  const categorized = new Map();
  for (const category of ["evidence", "decisions", "proposals", "missing"]) {
    for (const value of provenance[category] ?? []) {
      if (typeof value !== "string") continue;
      const previous = categorized.get(value);
      if (previous && previous !== category) {
        provenanceErrors.push(`/provenance path "${value}" appears in both ${previous} and ${category}`);
      } else {
        categorized.set(value, category);
      }
    }
  }

  return [...errors, ...missingAssets.sort(), ...provenanceErrors];
}

export function createPublicManifest(project) {
  const { brandDna } = project;
  return {
    kind: "brand-dna-manifest",
    version: 1,
    brand: {
      name: brandDna.meta.brandName,
      language: brandDna.meta.language,
      version: brandDna.meta.version,
      schemaVersion: brandDna.meta.schemaVersion,
    },
    brandbook: "./",
    data: "./brand-dna.json",
    schema: "./brand-dna.schema.json",
    guidance: "./design.md",
    stylesheet: "./brand.css",
    evals: "./evals/scenarios.json",
    assets: {
      logos: "./logo/",
      imagery: "./imagery/",
      references: "./references/",
    },
  };
}

export { packageRoot };
