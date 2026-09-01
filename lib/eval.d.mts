import type { BrandProject } from "./brand-dna.mjs";

export type EvalFinding = {
  id: string;
  level: "error" | "warning";
  message: string;
};

export type EvalReport = {
  kind: "brand-dna-eval-report";
  version: number;
  createdAt: string;
  brand: string;
  brandVersion: string;
  passed: boolean;
  summary: { passed: number; failed: number; missing: number; errors: number; warnings: number };
  scenarios: Array<Record<string, unknown>>;
};

export function evaluateHtmlArtifact(html: string, project: BrandProject): EvalFinding[];
export function runEvalDirectory(project: BrandProject, directory: string): Promise<EvalReport>;
