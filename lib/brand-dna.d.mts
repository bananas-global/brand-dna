import brandDna from "../public/brand/brand-dna.json";

export type BrandProject = {
  cwd: string;
  configPath: string;
  sourceDir: string;
  sourceLabel: string;
  outputDir: string;
  basePath: string;
  siteUrl: string;
  brandFile: string;
  schemaFile: string;
  brandDna: typeof brandDna;
};

export const defaultConfig: {
  sourceDir: string;
  outputDir: string;
  basePath: string;
  siteUrl: string;
};

export function normalizeBasePath(value?: string): string;
export function readJson(file: string): Promise<unknown>;
export function loadBrandProject(options?: { cwd?: string; configPath?: string }): Promise<BrandProject>;
export function validateBrandProject(project: BrandProject): Promise<string[]>;
export function createPublicManifest(project: BrandProject): Record<string, unknown>;
export const packageRoot: string;
