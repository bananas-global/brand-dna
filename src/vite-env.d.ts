/// <reference types="vite/client" />

import brandDna from "../public/brand/brand-dna.json";

declare global {
  const __BRAND_DNA__: typeof brandDna;
  const __BRAND_DNA_SOURCE_DIR__: string;
  const __BRAND_DNA_TARGET__: string;
  const __BRAND_DNA_BASE_PATH__: string;
}

export {};
