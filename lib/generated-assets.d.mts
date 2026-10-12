import type { BrandProject } from "./brand-dna.mjs";

type GeneratorInput = Pick<BrandProject, "brandDna">;

export const defaultAgentGuidance: Record<string, string[]>;
export function createDesignMarkdown(project: GeneratorInput): string;
export function createBrandStylesheet(project: GeneratorInput): string;
export function createEvalScenarios(project: GeneratorInput): unknown;
