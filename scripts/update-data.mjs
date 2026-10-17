// Refreshes src/data/exp_required.json from the Ethna Timeline community dataset.
// Converts the flat [{season, level, exp}] list into {season: {start, exp[]}}.
import { writeFile } from "node:fs/promises";

const SOURCE = "https://qenu.github.io/ethna-timeline/assets/data/exp_required.json";
const OUT = new URL("../src/data/exp_required.json", import.meta.url);

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
const rows = await res.json();

const bySeason = new Map();
for (const { season, level, exp } of rows) {
  if (!bySeason.has(season)) bySeason.set(season, new Map());
  bySeason.get(season).set(level, exp);
}

const out = {};
for (const [season, levels] of [...bySeason].sort(([a], [b]) => a - b)) {
  const keys = [...levels.keys()].sort((a, b) => a - b);
  const start = keys[0];
  keys.forEach((k, i) => {
    if (k !== start + i) throw new Error(`Season ${season} has a gap at level ${start + i}`);
  });
  out[season] = { start, exp: keys.map((k) => levels.get(k)) };
}

await writeFile(OUT, JSON.stringify(out));
console.log(`Wrote ${Object.keys(out).length} seasons to ${OUT.pathname}`);
