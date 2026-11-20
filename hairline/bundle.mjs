// Bundles the Hairline figures in src/ into figures.js, one classic script the pages load after kernel.js.
// Each figure keeps its own scope (the bench loads them as modules; a plain script works from disk too).
// Run from this folder after editing a figure:  node bundle.mjs
import { readFileSync, writeFileSync } from "node:fs";
const names = ["bakeline", "case", "calendar", "route"];
const body = names.map((n) => `/* ---- ${n}.js ---- */\n(() => {\n${readFileSync(`src/${n}.js`, "utf8")}\n})();`).join("\n\n");
writeFileSync("figures.js", `/* Hairline figures for Laminate & Loaf, bundled from src/ by bundle.mjs. Edit src/, not this file. */\n${body}\n`);
console.log("wrote figures.js:", names.join(", "));
