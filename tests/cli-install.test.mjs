import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const projectRoot = path.resolve(new URL("../", import.meta.url).pathname);
const cli = path.join(projectRoot, "bin/brand-dna.mjs");

test("initializes, validates, and builds an isolated Brand DNA inside another repository", async () => {
  const repository = await mkdtemp(path.join(tmpdir(), "brand-dna-install-"));
  try {
    await exec(process.execPath, [cli, "init"], { cwd: repository });
    const config = JSON.parse(await readFile(path.join(repository, "brand-dna.config.json"), "utf8"));
    const source = JSON.parse(await readFile(path.join(repository, "brand-dna/brand-dna.json"), "utf8"));

    assert.equal(config.sourceDir, "brand-dna");
    assert.equal(config.outputDir, "public/brand-dna");
    assert.equal(source.meta.brandName, "bananas");

    const validation = await exec(process.execPath, [cli, "validate"], { cwd: repository });
    assert.match(validation.stdout, /Brand DNA is valid/);

    await exec(process.execPath, [cli, "build"], { cwd: repository, maxBuffer: 10 * 1024 * 1024 });
    const outputRoot = path.join(repository, "public/brand-dna");
    const [html, manifest, builtDna] = await Promise.all([
      readFile(path.join(outputRoot, "index.html"), "utf8"),
      readFile(path.join(outputRoot, "manifest.json"), "utf8"),
      readFile(path.join(outputRoot, "brand-dna.json"), "utf8"),
    ]);

    assert.match(html, /<title>bananas — Brand DNA<\/title>/);
    assert.equal(JSON.parse(manifest).data, "./brand-dna.json");
    assert.deepEqual(JSON.parse(builtDna), source);
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
});
