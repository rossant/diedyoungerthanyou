import { readFileSync } from "node:fs";

const files = [
  "src/people-young.tsv",
  "src/people-mid1.tsv",
  "src/people-mid2.tsv",
  "src/people-late.tsv",
];
const records = files.flatMap((file) =>
  readFileSync(file, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const fields = line.split("|");
      return { id: fields[0], title: fields[8].replaceAll("_", " ") };
    }),
);
const missing = [];

for (let index = 0; index < records.length; index += 40) {
  const batch = records.slice(index, index + 40);
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "info",
    redirects: "1",
    titles: batch.map(({ title }) => title).join("|"),
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${query}`, {
    headers: {
      "User-Agent":
        "diedyoungerthanyou-source-validator/0.1 (https://github.com/rossant/diedyoungerthanyou)",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Wikipedia API returned ${response.status} ${response.statusText}`,
    );
  }
  const result = await response.json();
  for (const page of result.query.pages) {
    if (page.missing) missing.push(page.title);
  }
}

if (missing.length) {
  console.error(`Missing Wikipedia articles:\n${missing.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${records.length} Wikipedia source links.`);
}
