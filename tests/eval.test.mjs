import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadBrandProject } from "../lib/brand-dna.mjs";
import { evaluateHtmlArtifact, runEvalDirectory } from "../lib/eval.mjs";

const projectRoot = path.resolve(new URL("../", import.meta.url).pathname);
const validHtml = (title) => `<!doctype html>
<html lang="en-US">
<head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="./brand.css"><title>${title}</title></head>
<body class="bd-page"><main><h1 class="bd-title">${title}</h1><img src="logo/default.svg" alt="bananas"></main></body>
</html>`;

test("reports deterministic HTML failures and keeps non-token choices as warnings", async () => {
  const project = await loadBrandProject({ cwd: projectRoot });
  const findings = evaluateHtmlArtifact("<html><body><img src='x.png'><style>p{color:#123456}</style></body></html>", project);
  const ids = findings.map(({ id }) => id);
  assert.ok(ids.includes("document-doctype"));
  assert.ok(ids.includes("responsive-viewport"));
  assert.ok(ids.includes("brand-stylesheet"));
  assert.ok(ids.includes("image-alt-1"));
  assert.equal(findings.find(({ id }) => id === "unapproved-colors")?.level, "warning");
});

test("runs all fixed scenarios and records reproducibility metadata", async () => {
  const project = await loadBrandProject({ cwd: projectRoot });
  const directory = await mkdtemp(path.join(tmpdir(), "brand-dna-eval-"));
  try {
    for (const id of ["web-pages", "presentations", "social-media-cards-posts"]) {
      await writeFile(path.join(directory, `${id}.html`), validHtml(id));
      await writeFile(path.join(directory, `${id}.run.json`), JSON.stringify({ model: "test-model", guidanceVersion: "0.1" }));
      await writeFile(path.join(directory, `${id}.png`), "fixture");
    }
    const report = await runEvalDirectory(project, directory);
    assert.equal(report.passed, true);
    assert.deepEqual(report.summary, { passed: 3, failed: 0, missing: 0, errors: 0, warnings: 0 });
    await writeFile(path.join(directory, "eval-report.json"), JSON.stringify(report));
    assert.equal(JSON.parse(await readFile(path.join(directory, "eval-report.json"), "utf8")).scenarios.length, 3);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
