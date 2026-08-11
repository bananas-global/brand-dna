/// <reference types="vite/client" />

import brandDna from "../public/brand/brand-dna.json";

declare global {
  const __BRAND_DNA__: typeof brandDna;
}

export {};
