import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const projectRoot = path.resolve(new URL("../", import.meta.url).pathname);

test("installs the packed release and builds an isolated Brand DNA inside another repository", async () => {
  const packageDirectory = await mkdtemp(path.join(tmpdir(), "brand-dna-package-"));
  const repository = await mkdtemp(path.join(tmpdir(), "brand-dna-install-"));
  try {
    const packed = await exec("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", packageDirectory], {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024,
    });
    const [{ filename, files }] = JSON.parse(packed.stdout);
    const includedPaths = files.map(({ path: filePath }) => filePath);
    assert.ok(includedPaths.includes("bin/brand-dna.mjs"));
    assert.ok(includedPaths.includes("lib/brand-dna.mjs"));
    assert.ok(includedPaths.includes("public/brand/brand-dna.json"));
    assert.ok(includedPaths.includes("public/brand/brand-dna.schema.json"));

    const tarball = path.join(packageDirectory, filename);
    await exec("npm", ["exec", "--yes", `--package=${tarball}`, "--", "brand-dna", "init"], {
      cwd: repository,
      maxBuffer: 10 * 1024 * 1024,
    });
    await exec("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
      cwd: repository,
      maxBuffer: 10 * 1024 * 1024,
    });
    const cli = path.join(repository, "node_modules/brand-dna/bin/brand-dna.mjs");
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
    await Promise.all([
      rm(packageDirectory, { recursive: true, force: true }),
      rm(repository, { recursive: true, force: true }),
    ]);
  }
});
