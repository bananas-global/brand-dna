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
  assert.match(html, /<title>Brand DNA — Master Template<\/title>/i);
  assert.match(html, /Brand essence/);
  assert.match(html, /Voice &amp; tone/);
  assert.match(html, /Visual identity/);
  assert.match(html, /Imagery system/);
  assert.match(html, /Motion &amp; sound/);
  assert.match(html, /Information &amp; data language/);
  assert.match(html, /Accessibility &amp; boundaries/);
  assert.match(html, /Channel profiles/);
  assert.match(html, /AI contract/);
  assert.match(html, /Governance/);
});

test("keeps tab navigation and fictional content accessible", async () => {
  const html = await (await render()).text();
  assert.match(html, /href="#content">Skip to content/);
  assert.match(html, /aria-label="Page navigation"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /Neutral placeholder/);
  assert.match(html, /Illustrative baseline · no real data/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("delivers the structured contract for agents", async () => {
  const root = new URL("../public/brand/", import.meta.url);
  const [dna, tokens, channels, assets, checklist] = await Promise.all([
    readFile(new URL("brand-dna.yaml", root), "utf8"),
    readFile(new URL("tokens.json", root), "utf8"),
    readFile(new URL("channel-profiles.yaml", root), "utf8"),
    readFile(new URL("assets-manifest.json", root), "utf8"),
    readFile(new URL("validation-checklist.yaml", root), "utf8"),
  ]);
  assert.match(dna, /decision_priority:/);
  assert.match(channels, /business_intelligence:/);
  assert.match(checklist, /accessibility\.contrast/);
  assert.equal(JSON.parse(tokens).meta.status, "template");
  assert.equal(JSON.parse(assets).status, "template");
});
