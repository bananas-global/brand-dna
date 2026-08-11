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

test("renderiza o template completo de Brand DNA", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="pt-BR"/i);
  assert.match(html, /<title>Brand DNA — Template mestre<\/title>/i);
  assert.match(html, /Essência da marca/);
  assert.match(html, /Identidade verbal/);
  assert.match(html, /Identidade visual/);
  assert.match(html, /Sistema de imagem/);
  assert.match(html, /Motion e som/);
  assert.match(html, /Linguagem de informação e dados/);
  assert.match(html, /Acessibilidade e limites/);
  assert.match(html, /Perfis por canal/);
  assert.match(html, /Contrato para IA/);
  assert.match(html, /Governança/);
});

test("mantém a navegação por abas e o conteúdo fictício acessíveis", async () => {
  const html = await (await render()).text();
  assert.match(html, /href="#conteudo">Pular para o conteúdo/);
  assert.match(html, /aria-label="Navegação da página"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /Placeholder neutro/);
  assert.match(html, /Base ilustrativa · sem dados reais/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("entrega o contrato estruturado para agentes", async () => {
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
