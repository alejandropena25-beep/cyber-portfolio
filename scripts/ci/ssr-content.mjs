import assert from "node:assert/strict";

export function mainContent(html) {
  const opening = html.indexOf("<main ");
  assert.ok(opening >= 0, "SSR main element missing");
  const start = html.indexOf(">", opening);
  const end = html.indexOf("</main>", start);
  assert.ok(
    start >= 0 &&
      html.slice(opening, start).includes('id="main-content"') &&
      end > start,
    "SSR main element incomplete",
  );
  return html.slice(start + 1, end);
}

export function assertMainText(content, expected, path) {
  const lower = content.toLowerCase();
  assert.ok(
    !lower.includes("<script") && !lower.includes("<style"),
    `Unexpected script or style inside SSR main: ${path}`,
  );
  const at = content.indexOf(expected);
  const previousOpen = content.lastIndexOf("<", at);
  const previousClose = content.lastIndexOf(">", at);
  const nextOpen = content.indexOf("<", at);
  assert.ok(
    at >= 0 &&
      previousClose > previousOpen &&
      (nextOpen < 0 || at + expected.length <= nextOpen),
    `SSR content missing: ${path}`,
  );
}
