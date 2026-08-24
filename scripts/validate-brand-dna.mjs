#!/usr/bin/env node
import { loadBrandProject, validateBrandProject } from "../lib/brand-dna.mjs";

try {
  const project = await loadBrandProject();
  const errors = await validateBrandProject(project);
  if (errors.length) {
    console.error(`Brand DNA validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Brand DNA is valid: ${project.sourceLabel}/brand-dna.json`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
