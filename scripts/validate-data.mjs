import { readFileSync } from "node:fs";
import { categories, validateRawFields } from "../src/data-schema.js";

const files = [
  "src/people-young.tsv",
  "src/people-mid1.tsv",
  "src/people-mid2.tsv",
  "src/people-late.tsv",
  "src/people-expanded.tsv",
];
const ids = new Set();
const people = [];
const warnings = [];

for (const file of files) {
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
  for (const [i, line] of lines.entries()) {
    const fields = line.split("|");
    if (fields.length !== 10)
      fail(`${file}:${i + 1}: expected 10 fields, got ${fields.length}`);
    const [
      id,
      name,
      born,
      died,
      nationality,
      category,
      gender,
      summary,
      wiki,
      popularity,
    ] = fields;
    if (ids.has(id)) fail(`${file}:${i + 1}: duplicate id ${id}`);
    ids.add(id);
    const result = validateRawFields({
      id,
      name,
      born,
      died,
      nationality,
      category,
      gender,
      popularity,
      summary,
      wiki,
    });
    for (const error of result.errors) fail(`${file}:${i + 1}: ${error}`);
    for (const warning of result.warnings) warnings.push(`${id}: ${warning}`);
    people.push({
      born,
      nationality,
      category,
      gender,
      popularity,
      age: result.age,
    });
  }
}

if (people.length < 300) fail(`dataset unexpectedly small: ${people.length}`);
const women = people.filter(({ gender }) => gender === "woman").length;
if (women / people.length < 0.3)
  fail(
    `editorial gender grouping is only ${Math.round((100 * women) / people.length)}% women`,
  );
for (const category of categories)
  if (!people.some((person) => person.category === category))
    fail(`empty category: ${category}`);

const countBy = (items, key) =>
  Object.fromEntries(
    [...new Set(items.map(key))]
      .sort()
      .map((value) => [
        value,
        items.filter((item) => key(item) === value).length,
      ]),
  );
const ageBand = (age) =>
  age < 18
    ? "0–17"
    : age < 30
      ? "18–29"
      : age < 50
        ? "30–49"
        : age < 70
          ? "50–69"
          : "70+";
const era = (born) => {
  const century = Math.floor((Number(born.slice(0, 4)) - 1) / 100) + 1;
  const remainder = century % 100;
  const suffix =
    remainder >= 11 && remainder <= 13
      ? "th"
      : century % 10 === 1
        ? "st"
        : century % 10 === 2
          ? "nd"
          : century % 10 === 3
            ? "rd"
            : "th";
  return `${century}${suffix} century`;
};
console.log(`Validated ${people.length} people.`);
console.log(
  "Editorial gender groups:",
  countBy(people, (person) => person.gender),
);
console.log(
  "Categories:",
  countBy(people, (person) => person.category),
);
console.log(
  "Popularity tiers:",
  countBy(people, (person) => person.popularity),
);
console.log(
  "Nationality labels (geography proxy):",
  countBy(people, (person) => person.nationality),
);
console.log(
  "Birth eras:",
  countBy(people, (person) => era(person.born)),
);
console.log(
  "Age bands:",
  countBy(people, (person) => ageBand(person.age)),
);
if (warnings.length)
  console.log(
    `Editorial warnings (${warnings.length}):\n${warnings.join("\n")}`,
  );

function fail(message) {
  console.error(message);
  process.exit(1);
}
