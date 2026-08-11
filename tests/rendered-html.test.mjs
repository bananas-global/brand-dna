import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the complete Brand DNA template", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="en-US"/i);
  assert.match(html, /<title>Brand DNA — Open Source Starter<\/title>/i);
  assert.match(html, /Brand essence/);
  assert.match(html, /Voice &amp; tone/);
  assert.match(html, /Visual identity/);
  assert.match(html, /Imagery system/);
  assert.match(html, /Motion &amp; sound/);
  assert.match(html, /Information &amp; data language/);
  assert.match(html, /Accessibility &amp; boundaries/);
  assert.match(html, /Channel profiles/);
  assert.match(html, /AI contract/);
  assert.match(html, /Build yours/);
});

test("keeps tab navigation and fictional content accessible", async () => {
  const html = await (await render()).text();
  assert.match(html, /href="#content">Skip to content/);
  assert.match(html, /aria-label="Page navigation"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /Minimum viable Brand DNA/);
  assert.match(html, /Illustrative baseline · no real data/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("delivers one canonical Brand DNA source for people and agents", async () => {
  const root = new URL("../public/brand/", import.meta.url);
  const dna = JSON.parse(await readFile(new URL("brand-dna.json", root), "utf8"));
  assert.equal(dna.meta.status, "starter");
  assert.equal(dna.expressionPrinciples.length, 3);
  assert.equal(dna.visual.colors.length, 5);
  assert.ok(dna.visual.typography && dna.visual.spacing && dna.visual.radii && dna.visual.shadows);
  assert.ok(dna.motionAndSound.motion);
  assert.deepEqual(Object.keys(dna.provenance), ["evidence", "decisions", "proposals", "missing"]);

  const html = await (await render()).text();
  assert.match(html, new RegExp(dna.essence.centralIdea.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, /Download the complete Brand DNA/);
  assert.doesNotMatch(html, /brand-dna\.yaml|tokens\.json|channel-profiles\.yaml|assets-manifest\.json|validation-checklist\.yaml/);
});

test("ships the zero-setup builder with the eight-question protocol", async () => {
  const [start, skill] = await Promise.all([
    readFile(new URL("../START-HERE.md", import.meta.url), "utf8"),
    readFile(new URL("../.agents/skills/brand-dna-builder/SKILL.md", import.meta.url), "utf8"),
  ]);
  assert.match(start, /Use \$brand-dna-builder/);
  assert.match(skill, /Inspect every useful file under `references\/`/);
  assert.match(skill, /Ask the remaining questions together/);
  assert.match(skill, /Evidence/);
  assert.match(skill, /Decision/);
  assert.match(skill, /Proposal/);
  assert.match(skill, /Missing/);
  assert.equal((start.match(/^\d+\. /gm) ?? []).length, 8);
});
