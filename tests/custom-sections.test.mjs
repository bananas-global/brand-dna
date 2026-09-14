import assert from "node:assert/strict";
import test from "node:test";
import { loadBrandProject, validateBrandProject, createPublicManifest } from "../lib/brand-dna.mjs";

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
