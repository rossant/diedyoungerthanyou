import { readFileSync } from "node:fs";

const files = [
  "src/people-young.tsv",
  "src/people-mid1.tsv",
  "src/people-mid2.tsv",
  "src/people-late.tsv",
];
const categories = new Set([
  "science", "mathematics", "engineering", "music", "art",
  "literature", "film", "activism", "politics", "exploration",
]);
const ids = new Set();
let count = 0;
let women = 0;
const categoryCounts = new Map();

for (const file of files) {
  const lines = readFileSync(file, "utf8").trim().split("\n");
  for (const [i, line] of lines.entries()) {
    const fields = line.split("|");
    if (fields.length !== 9) fail(`${file}:${i + 1}: expected 9 fields, got ${fields.length}`);
    const [id, name, born, died, nationality, category, gender, summary, wiki] = fields;
    if (!/^[a-z0-9-]+$/.test(id)) fail(`${file}:${i + 1}: invalid id ${id}`);
    if (ids.has(id)) fail(`${file}:${i + 1}: duplicate id ${id}`);
    ids.add(id);
    if (!name || !nationality || !summary || !wiki) fail(`${file}:${i + 1}: empty required field`);
    if (!categories.has(category)) fail(`${file}:${i + 1}: unknown category ${category}`);
    if (gender !== "woman" && gender !== "man") fail(`${file}:${i + 1}: invalid gender ${gender}`);
    const age = ageAtDeath(born, died);
    if (age < 0 || age > 120) fail(`${file}:${i + 1}: implausible age ${age}`);
    count++;
    if (gender === "woman") women++;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
}

if (count < 120) fail(`dataset unexpectedly small: ${count}`);
if (women / count < 0.3) fail(`women are only ${Math.round(100 * women / count)}% of dataset`);
for (const category of categories) {
  if (!categoryCounts.get(category)) fail(`empty category: ${category}`);
}

console.log(`Validated ${count} people (${women} women, ${count - women} men).`);

function ageAtDeath(born, died) {
  const b = parseDate(born);
  const d = parseDate(died);
  return d.y - b.y - (d.m < b.m || (d.m === b.m && d.d < b.d) ? 1 : 0);
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) fail(`invalid date ${value}`);
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) fail(`invalid date ${value}`);
  return { y, m, d };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
