import assert from "node:assert/strict";
import test from "node:test";
import { assertMainText, mainContent } from "./ssr-content.mjs";

test("expected text in SSR main content is accepted", () => {
  const html = '<style>Ingeniería Informática</style><main _ngcontent-ng-c123 id="main-content" class="container"><p>Soy estudiante de Ingeniería Informática.</p></main><script>Ingeniería Informática</script>';
  assert.doesNotThrow(() =>
    assertMainText(mainContent(html), "Ingeniería Informática", "/"),
  );
});

test("text only in scripts or attributes does not satisfy the SSR check", () => {
  const html = '<script>Ingeniería Informática</script><main id="main-content" title="Ingeniería Informática"><p>Other text</p></main>';
  assert.throws(
    () => assertMainText(mainContent(html), "Ingeniería Informática", "/"),
    /SSR content missing/,
  );
});

test("missing main content fails", () => {
  assert.throws(() => mainContent("<p>Ingeniería Informática</p>"), /SSR main/);
});

test("script or style content inside main does not satisfy visible text", () => {
  for (const tag of ["script", "style"]) {
    const content = mainContent(`<main id="main-content"><${tag}>Ingeniería Informática</${tag}></main>`);
    assert.throws(
      () => assertMainText(content, "Ingeniería Informática", "/"),
      /Unexpected script or style/,
    );
  }
});
