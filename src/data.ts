/// <reference types="vite/client" />

import young from "./people-young.tsv?raw";
import mid1 from "./people-mid1.tsv?raw";
import mid2 from "./people-mid2.tsv?raw";
import late from "./people-late.tsv?raw";

export type Category =
  | "science"
  | "mathematics"
  | "engineering"
  | "music"
  | "art"
  | "literature"
  | "film"
  | "activism"
  | "politics"
  | "exploration";

export type Gender = "woman" | "man";

export interface Person {
  id: string;
  name: string;
  born: string;
  died: string;
  deathAge: number;
  nationality: string;
  category: Category;
  gender: Gender;
  summary: string;
  source: string;
  featured: boolean;
}

export const categoryLabel: Record<Category, string> = {
  science: "Science",
  mathematics: "Mathematics",
  engineering: "Engineering",
  music: "Music",
  art: "Art",
  literature: "Literature",
  film: "Film",
  activism: "Activism",
  politics: "Politics",
  exploration: "Exploration",
};

const categories = new Set<Category>(Object.keys(categoryLabel) as Category[]);
const featured = new Set([
  "evariste-galois", "sophie-scholl", "john-keats", "amy-winehouse", "jimi-hendrix",
  "jean-michel-basquiat", "franz-schubert", "srinivasa-ramanujan", "bruce-lee", "mozart",
  "ada-lovelace", "rosalind-franklin", "martin-luther-king", "alan-turing", "maryam-mirzakhani",
  "jane-austen", "franz-kafka", "bob-marley", "billie-holiday", "freddie-mercury",
  "albert-camus", "george-orwell", "james-clerk-maxwell", "emmy-noether", "marie-curie",
  "grace-hopper", "steve-jobs", "virginia-woolf", "blaise-pascal", "raphael",
]);

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);
  const [, y, m, d] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid date: ${value}`);
  }
  return { year, month, day };
}

export function ageAtDeath(born: string, died: string) {
  const b = parseDate(born);
  const d = parseDate(died);
  return d.year - b.year - (d.month < b.month || (d.month === b.month && d.day < b.day) ? 1 : 0);
}

function parsePeople(): Person[] {
  const seen = new Set<string>();
  const lines = [young, mid1, mid2, late].flatMap((text) => text.trim().split("\n"));
  const people = lines.map((line, index) => {
    const parts = line.split("|");
    if (parts.length !== 9) throw new Error(`Data line ${index + 1} has ${parts.length} fields`);
    const [id, name, born, died, nationality, rawCategory, rawGender, summary, wiki] = parts;
    const category = rawCategory as Category;
    const gender = rawGender as Gender;
    if (!categories.has(category)) throw new Error(`Unknown category for ${id}: ${rawCategory}`);
    if (gender !== "woman" && gender !== "man") throw new Error(`Unknown gender for ${id}: ${rawGender}`);
    if (seen.has(id)) throw new Error(`Duplicate id: ${id}`);
    seen.add(id);
    const deathAge = ageAtDeath(born, died);
    if (deathAge < 0 || deathAge > 120) throw new Error(`Implausible age for ${id}: ${deathAge}`);
    return {
      id, name, born, died, deathAge, nationality, category, gender, summary,
      source: `https://en.wikipedia.org/wiki/${wiki}`,
      featured: featured.has(id),
    };
  });
  if (people.length < 120) throw new Error(`Dataset unexpectedly small: ${people.length}`);
  const women = people.filter((person) => person.gender === "woman").length;
  if (women / people.length < 0.3) throw new Error("Dataset gender balance regressed below 30% women");
  return people.sort((a, b) => a.deathAge - b.deathAge || a.name.localeCompare(b.name));
}

export const people = parsePeople();
