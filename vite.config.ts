import { readFile } from "node:fs/promises";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(async () => {
  const brandDna = JSON.parse(
    await readFile(new URL("./public/brand/brand-dna.json", import.meta.url), "utf8"),
  );

  return {
    base: "/brand-dna/",
    define: {
      __BRAND_DNA__: JSON.stringify(brandDna),
    },
    plugins: [react()],
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.tsx"],
      setupFiles: "./tests/setup.ts",
    },
  };
});
