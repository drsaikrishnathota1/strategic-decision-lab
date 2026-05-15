import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const js = await readFile(new URL("../app.js", import.meta.url), "utf8");

for (const id of [
  "scenarioSelect",
  "budget",
  "demand",
  "operations",
  "risk",
  "valueScore",
  "riskScore",
  "impactScore",
  "confidenceScore",
  "decisionBrief",
]) {
  assert(html.includes(`id="${id}"`), `Expected #${id} in index.html`);
}

assert(html.includes("Strategic Decision Lab"), "Expected app title");
assert(css.includes("@media (max-width: 920px)"), "Expected responsive tablet layout");
assert(css.includes("@media (max-width: 560px)"), "Expected responsive phone layout");
assert(js.includes("const scenarios"), "Expected scenario model");
assert(js.includes("function score"), "Expected scoring function");
assert(js.includes("navigator.clipboard.writeText"), "Expected copy brief action");

console.log("Smoke test passed: app shell, responsive CSS, and simulator logic are present.");
