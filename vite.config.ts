import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { createPublicManifest, loadBrandProject } from "./lib/brand-dna.mjs";

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export default defineConfig(async () => {
  const projectCwd = process.env.BRAND_DNA_PROJECT_CWD ?? process.cwd();
  const project = await loadBrandProject({ cwd: projectCwd });
  const brandName = project.brandDna.meta.brandName;
  const title = `${brandName} — Brand DNA`;
  const description = project.brandDna.essence.purpose;
  const canonical = project.siteUrl
    ? `<link rel="canonical" href="${escapeHtml(project.siteUrl)}" />`
    : "";
  const socialImage = project.siteUrl
    ? new URL("og.png", project.siteUrl).toString()
    : `${project.basePath}og.png`;
  const serializedManifest = `${JSON.stringify(createPublicManifest(project), null, 2)}\n`;

  const brandProjectPlugin: Plugin = {
    name: "brand-dna-project",
    configureServer(server) {
      const manifestPath = `${project.basePath}manifest.json`;
      server.middlewares.use((request, response, next) => {
        const requestPath = request.url?.split("?", 1)[0];
        if (requestPath !== manifestPath && requestPath !== "/manifest.json") {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(serializedManifest);
      });
    },
    transformIndexHtml(html) {
      return html
        .replaceAll("%BRAND_DNA_LANGUAGE%", escapeHtml(project.brandDna.meta.language))
        .replaceAll("%BRAND_DNA_TITLE%", escapeHtml(title))
        .replaceAll("%BRAND_DNA_DESCRIPTION%", escapeHtml(description))
        .replaceAll("%BRAND_DNA_CANONICAL%", canonical)
        .replaceAll("%BRAND_DNA_SITE_URL%", escapeHtml(project.siteUrl || project.basePath))
        .replaceAll("%BRAND_DNA_SOCIAL_IMAGE%", escapeHtml(socialImage));
    },
    async writeBundle() {
      await mkdir(project.outputDir, { recursive: true });
      await writeFile(
        path.join(project.outputDir, "manifest.json"),
        serializedManifest,
      );
    },
  };

  return {
    base: project.basePath,
    publicDir: project.sourceDir,
    define: {
      __BRAND_DNA__: JSON.stringify(project.brandDna),
      __BRAND_DNA_SOURCE_DIR__: JSON.stringify(project.sourceLabel),
      __BRAND_DNA_TARGET__: JSON.stringify(`${project.sourceLabel}/brand-dna.json`),
      __BRAND_DNA_BASE_PATH__: JSON.stringify(project.basePath),
    },
    build: {
      outDir: project.outputDir,
      emptyOutDir: true,
    },
    plugins: [react(), brandProjectPlugin],
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.tsx"],
      setupFiles: "./tests/setup.ts",
    },
  };
});
