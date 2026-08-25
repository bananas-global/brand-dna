#!/usr/bin/env node
import { access, cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { loadBrandProject, packageRoot, validateBrandProject } from "../lib/brand-dna.mjs";

const require = createRequire(import.meta.url);
const [command = "help", ...args] = process.argv.slice(2);
const cwd = process.cwd();

const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const ensureMissing = async (target, label) => {
  try {
    await access(target);
    throw new Error(`${label} already exists: ${target}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};

const printHelp = () => console.log(`Brand DNA

Usage:
  brand-dna init [directory]        Add the Bananas starter to a repository
  brand-dna dev                     Open the local brandbook and prompt editor
  brand-dna validate                Validate the Brand DNA and referenced assets
  brand-dna build                   Build the public brandbook

Options:
  --config <file>                   Configuration file (default: brand-dna.config.json)
  --base <path>                     Public base path (default: /brand-dna/)
  --output <directory>              Build output directory
  --site-url <url>                  Canonical public URL
`);

const runVite = async (mode, project) => {
  const vitePackage = require.resolve("vite/package.json");
  const viteBin = path.join(path.dirname(vitePackage), "bin/vite.js");
  const viteConfig = path.join(packageRoot, "vite.config.ts");
  const viteArgs = [viteBin, "--config", viteConfig];
  if (mode === "build") viteArgs.push("build");
  const child = spawn(process.execPath, viteArgs, {
    cwd: packageRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      BRAND_DNA_SOURCE_DIR: project.sourceDir,
      BRAND_DNA_OUTPUT_DIR: project.outputDir,
      BRAND_DNA_BASE_PATH: project.basePath,
      BRAND_DNA_SITE_URL: project.siteUrl,
      BRAND_DNA_PROJECT_CWD: project.cwd,
    },
  });
  const code = await new Promise((resolve) => child.on("exit", resolve));
  process.exitCode = typeof code === "number" ? code : 1;
};

const loadConfiguredProject = async () => {
  const project = await loadBrandProject({ cwd, configPath: option("--config") });
  if (option("--base")) project.basePath = option("--base");
  if (option("--output")) project.outputDir = path.resolve(cwd, option("--output"));
  if (option("--site-url")) project.siteUrl = option("--site-url");
  return project;
};

try {
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
  } else if (command === "init") {
    const positional = args.find((arg) => !arg.startsWith("--") && ![option("--base"), option("--output"), option("--site-url"), option("--config")].includes(arg));
    const targetLabel = positional ?? "brand-dna";
    const target = path.resolve(cwd, targetLabel);
    const configFile = path.resolve(cwd, option("--config", "brand-dna.config.json"));
    await Promise.all([
      ensureMissing(target, "Target"),
      ensureMissing(configFile, "Configuration file"),
    ]);
    await cp(path.join(packageRoot, "public/brand"), target, { recursive: true, errorOnExist: true, force: false });
    await mkdir(path.join(target, "references"), { recursive: true });
    await writeFile(path.join(target, "references/.gitkeep"), "", { flag: "wx" }).catch((error) => {
      if (error?.code !== "EEXIST") throw error;
    });
    const config = {
      $schema: "./node_modules/brand-dna/brand-dna.config.schema.json",
      sourceDir: targetLabel,
      outputDir: option("--output", "public/brand-dna"),
      basePath: option("--base", "/brand-dna/"),
      siteUrl: option("--site-url", ""),
    };
    await writeFile(configFile, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
    console.log(`Brand DNA initialized in ${path.relative(cwd, target) || "."}`);
    console.log("Next: install brand-dna as a dev dependency, then run `brand-dna dev`.");
  } else if (["validate", "dev", "build"].includes(command)) {
    const project = await loadConfiguredProject();
    const errors = await validateBrandProject(project);
    if (errors.length) {
      console.error(`Brand DNA validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
      errors.forEach((error) => console.error(`- ${error}`));
      process.exitCode = 1;
    } else if (command === "validate") {
      console.log(`Brand DNA is valid: ${project.sourceLabel}/brand-dna.json`);
    } else {
      await runVite(command, project);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
