import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const distRoot = new URL("../dist/", import.meta.url);

test("builds a static GitHub Pages document with repository-safe metadata", async () => {
  const html = await readFile(new URL("index.html", distRoot), "utf8");

  assert.match(html, /<html[^>]+lang="en-US"/i);
  assert.match(html, /<title>Brand DNA — Open Source Starter<\/title>/i);
  assert.match(html, /href="\/brand-dna\/favicon\.svg"/i);
  assert.match(html, /https:\/\/bananas-global\.github\.io\/brand-dna\/og\.png/i);
  assert.match(html, /src="\/brand-dna\/assets\/.+\.js"/i);
  assert.match(html, /href="\/brand-dna\/assets\/.+\.css"/i);

  await assert.rejects(access(new URL("server/index.js", distRoot)));
});

test("copies every public asset and emits self-hosted fonts", async () => {
  await Promise.all([
    access(new URL("favicon.svg", distRoot)),
    access(new URL("og.png", distRoot)),
    access(new URL("brand/brand-dna.json", distRoot)),
    access(new URL("brand/brand-dna.schema.json", distRoot)),
  ]);

  const assetFiles = await readdir(new URL("assets/", distRoot));
  assert.ok(assetFiles.some((file) => file.endsWith(".woff2")), "expected self-hosted font assets");
});

test("keeps one canonical Brand DNA file and the project-local builder skill", async () => {
  const [sourceDna, builtDna, start, skill] = await Promise.all([
    readFile(new URL("public/brand/brand-dna.json", projectRoot), "utf8"),
    readFile(new URL("brand/brand-dna.json", distRoot), "utf8"),
    readFile(new URL("START-HERE.md", projectRoot), "utf8"),
    readFile(new URL(".agents/skills/brand-dna-builder/SKILL.md", projectRoot), "utf8"),
  ]);

  assert.deepEqual(JSON.parse(builtDna), JSON.parse(sourceDna));
  assert.match(start, /Use \$brand-dna-builder/);
  assert.match(skill, /Inspect every useful file under `references\/`/);
  assert.equal((start.match(/^\d+\. /gm) ?? []).length, 8);
});
