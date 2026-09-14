import type { Person, PopularityTier } from "./data";

export const MIN_AGE = 10;
export const MAX_AGE = 100;
export const DEFAULT_AGE = 30;
export const MAX_SEED = 2_147_483_646;
const POPULARITY_MIX: Record<PopularityTier, number> = {
  iconic: 0.625,
  "well-known": 0.3125,
  discovery: 0.0625,
};
const POPULARITY_TIERS = Object.keys(POPULARITY_MIX) as PopularityTier[];

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
  const popularityCount = new Map<PopularityTier, number>();
  const targetSize = Math.min(limit, pool.length);
  const popularityTargets = allocatePopularityTargets(targetSize, pool);

  // Guarantee that the journey includes a life as close to the reference age
  // as the dataset permits, regardless of which side of it the pool contains.
  const closestDistance = Math.min(
    ...available.map((person) => Math.abs(referenceAge - person.deathAge)),
  );
  const closest = available
    .filter(
      (person) => Math.abs(referenceAge - person.deathAge) === closestDistance,
    )
    .sort(
      (a, b) =>
        seededValue(seed, `closest:${a.id}`) -
        seededValue(seed, `closest:${b.id}`),
    )[0];
  add(closest);

  while (chosen.length < targetSize) {
    const underTarget = new Set(
      POPULARITY_TIERS.filter(
        (tier) =>
          (popularityCount.get(tier) ?? 0) < popularityTargets[tier] &&
          available.some((person) => person.popularity === tier),
      ),
    );
    const candidates = underTarget.size
      ? available.filter((person) => underTarget.has(person.popularity))
      : available;
    let best = candidates[0];
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      const categories = categoryCount.get(candidate.category) ?? 0;
      const nationalities = nationCount.get(candidate.nationality) ?? 0;
      const genders = genderCount.get(candidate.gender) ?? 0;
      const ageBand = Math.floor(candidate.deathAge / 10);
      const ages = ageBandCount.get(ageBand) ?? 0;
      const sameAge = exactAgeCount.get(candidate.deathAge) ?? 0;
      let score =
        seededValue(seed, `${referenceAge}:${chosen.length}:${candidate.id}`) *
        1.8;
      score -=
        categories * 0.42 +
        nationalities * 0.3 +
        genders * 0.08 +
        ages * 0.12 +
        sameAge * 0.7;
      score -= Math.abs(referenceAge - candidate.deathAge) * 0.006;
      if (nationalities >= 3 || categories >= 3) score -= 1.2;
      if (sameAge >= 2) score -= 2;
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
    popularityCount.set(
      person.popularity,
      (popularityCount.get(person.popularity) ?? 0) + 1,
    );
  }
}

export function findFreshSeed(
  pool: Person[],
  previousIds: ReadonlySet<string>,
  referenceAge: number,
  initialSeed: number,
  limit = 16,
  maxAttempts = 512,
  maxOverlapRatio = 0.35,
) {
  const resultSize = Math.min(Math.max(0, limit), pool.length);
  const freshAvailable = pool.filter(({ id }) => !previousIds.has(id)).length;
  const popularityTargets = allocatePopularityTargets(resultSize, pool);
  let expectedTierOverlap = 0;
  const tierConstrainedOverlap = POPULARITY_TIERS.reduce((total, tier) => {
    const supplyInTier = pool.filter(
      ({ popularity }) => popularity === tier,
    ).length;
    const previousInTier = pool.filter(
      ({ id, popularity }) => popularity === tier && previousIds.has(id),
    ).length;
    const freshInTier = pool.filter(
      ({ id, popularity }) => popularity === tier && !previousIds.has(id),
    ).length;
    if (supplyInTier) {
      expectedTierOverlap +=
        (popularityTargets[tier] * previousInTier) / supplyInTier;
    }
    return total + Math.max(0, popularityTargets[tier] - freshInTier);
  }, 0);
  const unavoidableOverlap = Math.max(
    0,
    resultSize - freshAvailable,
    tierConstrainedOverlap,
  );
  const requestedOverlap = Math.floor(resultSize * maxOverlapRatio);
  const targetOverlap = Math.max(
    requestedOverlap,
    unavoidableOverlap,
    Math.ceil(expectedTierOverlap),
  );
  let bestSeed = initialSeed;
  let bestPeople = selectPeople(pool, bestSeed, referenceAge, limit);
  let bestOverlap = overlapCount(bestPeople, previousIds);

  for (
    let attempt = 1;
    attempt < maxAttempts && bestOverlap > targetOverlap;
    attempt++
  ) {
    const candidateSeed =
      hash(`shuffle:${initialSeed}:${attempt}`) % (MAX_SEED + 1);
    const candidatePeople = selectPeople(
      pool,
      candidateSeed,
      referenceAge,
      limit,
    );
    const candidateOverlap = overlapCount(candidatePeople, previousIds);
    if (candidateOverlap < bestOverlap) {
      bestSeed = candidateSeed;
      bestPeople = candidatePeople;
      bestOverlap = candidateOverlap;
    }
  }

  return {
    seed: bestSeed,
    people: bestPeople,
    overlap: bestOverlap,
    targetOverlap,
    degraded: targetOverlap > requestedOverlap,
  };
}

export function byDescendingDeathAge(a: Person, b: Person) {
  return b.deathAge - a.deathAge || a.name.localeCompare(b.name);
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function allocatePopularityTargets(limit: number, pool: Person[]) {
  const supply = Object.fromEntries(
    POPULARITY_TIERS.map((tier) => [
      tier,
      pool.filter((person) => person.popularity === tier).length,
    ]),
  ) as Record<PopularityTier, number>;
  const targets = Object.fromEntries(
    POPULARITY_TIERS.map((tier) => [
      tier,
      Math.floor(limit * POPULARITY_MIX[tier]),
    ]),
  ) as Record<PopularityTier, number>;
  const allocated = Object.values(targets).reduce(
    (sum, count) => sum + count,
    0,
  );
  const remainders = [...POPULARITY_TIERS].sort(
    (a, b) =>
      limit * POPULARITY_MIX[b] -
      Math.floor(limit * POPULARITY_MIX[b]) -
      (limit * POPULARITY_MIX[a] - Math.floor(limit * POPULARITY_MIX[a])),
  );
  for (let index = allocated; index < limit; index++) {
    targets[remainders[(index - allocated) % remainders.length]]++;
  }

  // If a sparse age pool cannot meet the requested mix, preserve familiarity:
  // exhaust iconic people first, then well-known people, before adding more
  // discovery entries.
  let overflow = 0;
  for (const tier of POPULARITY_TIERS) {
    if (targets[tier] > supply[tier]) {
      overflow += targets[tier] - supply[tier];
      targets[tier] = supply[tier];
    }
  }
  while (overflow > 0) {
    const tier = POPULARITY_TIERS.find(
      (candidate) => targets[candidate] < supply[candidate],
    );
    if (!tier) break;
    targets[tier]++;
    overflow--;
  }
  return targets;
}

function overlapCount(people: Person[], ids: ReadonlySet<string>) {
  return people.reduce(
    (count, person) => count + Number(ids.has(person.id)),
    0,
  );
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
