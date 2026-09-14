/// <reference types="vite/client" />

import young from "./people-young.tsv?raw";
import mid1 from "./people-mid1.tsv?raw";
import mid2 from "./people-mid2.tsv?raw";
import late from "./people-late.tsv?raw";
import expanded from "./people-expanded.tsv?raw";
import { categories, validateRawFields } from "./data-schema.js";
export { ageAtDeath } from "./data-schema.js";

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

export type Gender = "woman" | "man" | "nonbinary" | "unknown";
export type PopularityTier = "iconic" | "well-known" | "discovery";

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
  popularity: PopularityTier;
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

const categorySet = new Set<Category>(categories as Category[]);
function parsePeople(): Person[] {
  const seen = new Set<string>();
  const lines = [young, mid1, mid2, late, expanded].flatMap((text) =>
    text.trim().split("\n"),
  );
  const people = lines.map((line, index) => {
    const parts = line.split("|");
    if (parts.length !== 10)
      throw new Error(`Data line ${index + 1} has ${parts.length} fields`);
    const [
      id,
      name,
      born,
      died,
      nationality,
      rawCategory,
      rawGender,
      summary,
      wiki,
      rawPopularity,
    ] = parts;
    const category = rawCategory as Category;
    const gender = rawGender as Gender;
    const popularity = rawPopularity as PopularityTier;
    if (!categorySet.has(category))
      throw new Error(`Unknown category for ${id}: ${rawCategory}`);
    const validation = validateRawFields({
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
    if (validation.errors.length)
      throw new Error(`${id}: ${validation.errors.join("; ")}`);
    if (seen.has(id)) throw new Error(`Duplicate id: ${id}`);
    seen.add(id);
    const deathAge = validation.age;
    return {
      id,
      name,
      born,
      died,
      deathAge,
      nationality,
      category,
      gender,
      summary,
      source: `https://en.wikipedia.org/wiki/${wiki}`,
      popularity,
    };
  });
  if (people.length < 300)
    throw new Error(`Dataset unexpectedly small: ${people.length}`);
  const women = people.filter((person) => person.gender === "woman").length;
  if (women / people.length < 0.3)
    throw new Error("Dataset gender balance regressed below 30% women");
  return people.sort(
    (a, b) => a.deathAge - b.deathAge || a.name.localeCompare(b.name),
  );
}

export const people = parsePeople();
