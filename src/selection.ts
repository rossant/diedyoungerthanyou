import type { Person } from "./data";

export const MIN_AGE = 8;
export const MAX_AGE = 100;
export const DEFAULT_AGE = 41;
export const MAX_SEED = 2_147_483_646;

export function parseAge(value: string | null, fallback = DEFAULT_AGE) {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), MIN_AGE, MAX_AGE);
}

export function parseSeed(value: string | null, fallback: number) {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > MAX_SEED)
    return fallback;
  return parsed;
}

export function randomSeed() {
  return Math.floor(Math.random() * (MAX_SEED + 1));
}

export function selectPeople(
  pool: Person[],
  seed: number,
  referenceAge: number,
  limit = 16,
) {
  if (!pool.length || limit <= 0) return [];

  const available = [...pool];
  const chosen: Person[] = [];
  const categoryCount = new Map<string, number>();
  const nationCount = new Map<string, number>();
  const genderCount = new Map<string, number>();
  const ageBandCount = new Map<number, number>();
  const exactAgeCount = new Map<number, number>();

  // Guarantee that the journey begins as close as the dataset permits.
  const closestAge = Math.max(...available.map((person) => person.deathAge));
  const closest = available
    .filter((person) => person.deathAge === closestAge)
    .sort(
      (a, b) =>
        seededValue(seed, `closest:${a.id}`) -
        seededValue(seed, `closest:${b.id}`),
    )[0];
  add(closest);

  while (chosen.length < Math.min(limit, pool.length)) {
    let best = available[0];
    let bestScore = -Infinity;

    for (const candidate of available) {
      const categories = categoryCount.get(candidate.category) ?? 0;
      const nationalities = nationCount.get(candidate.nationality) ?? 0;
      const genders = genderCount.get(candidate.gender) ?? 0;
      const ageBand = Math.floor(candidate.deathAge / 10);
      const ages = ageBandCount.get(ageBand) ?? 0;
      const sameAge = exactAgeCount.get(candidate.deathAge) ?? 0;
      let score = seededValue(
        seed,
        `${referenceAge}:${chosen.length}:${candidate.id}`,
      );
      score += candidate.featured ? 0.18 : 0;
      score -=
        categories * 0.42 +
        nationalities * 0.3 +
        genders * 0.08 +
        ages * 0.12 +
        sameAge * 2;
      score -= Math.abs(referenceAge - candidate.deathAge) * 0.006;
      if (nationalities >= 3 || categories >= 3) score -= 1.2;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    add(best);
  }

  return chosen;

  function add(person: Person) {
    chosen.push(person);
    available.splice(available.indexOf(person), 1);
    categoryCount.set(
      person.category,
      (categoryCount.get(person.category) ?? 0) + 1,
    );
    nationCount.set(
      person.nationality,
      (nationCount.get(person.nationality) ?? 0) + 1,
    );
    genderCount.set(person.gender, (genderCount.get(person.gender) ?? 0) + 1);
    const ageBand = Math.floor(person.deathAge / 10);
    ageBandCount.set(ageBand, (ageBandCount.get(ageBand) ?? 0) + 1);
    exactAgeCount.set(
      person.deathAge,
      (exactAgeCount.get(person.deathAge) ?? 0) + 1,
    );
  }
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function seededValue(seed: number, value: string) {
  return mulberry32(hash(`${seed}:${value}`))();
}

function hash(value: string) {
  let result = 2_166_136_261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16_777_619);
  }
  return result >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
