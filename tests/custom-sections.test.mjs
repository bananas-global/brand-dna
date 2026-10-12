import assert from "node:assert/strict";
import test from "node:test";
import { loadBrandProject, validateBrandProject, createPublicManifest } from "../lib/brand-dna.mjs";
import { createDesignMarkdown } from "../lib/generated-assets.mjs";

const section = { id: "id-pattern", menuLabel: "ID Pattern", title: "Pattern generator", description: "Create patterns", link: "/id-pattern" };
const projectWith = async (sections) => {
  const project = await loadBrandProject();
  project.brandDna = { ...project.brandDna, customSections: sections };
  return project;
};
test("optional sections validate and are discoverable through the manifest", async () => {
  const project = await projectWith([section, { ...section, id: "components", link: "https://example.com/components" }]);
  assert.deepEqual(await validateBrandProject(project), []);
  assert.equal(createPublicManifest(project).sections[0].brandbook, "./#id-pattern");
  assert.equal(createPublicManifest(project).sections[0].link, "/id-pattern");
});
test("rejects duplicate/reserved identifiers, unsafe links and missing images", async () => {
  for (const sections of [
    [section, section], [{ ...section, id: "about" }], [{ ...section, id: "layout" }],
    [{ ...section, link: "javascript:alert(1)" }], [{ ...section, link: "//example.com" }],
    [{ ...section, image: "references/missing.png" }], [{ ...section, image: "references/../../secret.png" }],
  ]) assert.ok((await validateBrandProject(await projectWith(sections))).length > 0);
});
test("design.md lists custom sections for agents", async () => {
  const markdown = createDesignMarkdown(await projectWith([section, { ...section, id: "pattern", title: "Pattern de fundo", description: "Tom sobre tom.", link: "https://example.com/pattern", image: "references/pattern.png" }]));
  assert.match(markdown, /## Additional sections/);
  assert.match(markdown, /### Pattern generator\n\nCreate patterns\n\nLink: \/id-pattern\n\n### Pattern de fundo/);
  assert.match(markdown, /### Pattern de fundo\n\nTom sobre tom\.\n\nLink: https:\/\/example\.com\/pattern\n\nImage: \[references\/pattern\.png\]\(\.\/references\/pattern\.png\)/);
  assert.doesNotMatch(createDesignMarkdown(await projectWith(undefined)), /## Additional sections/);
});
