import { describe, expect, it } from "vitest";
import { people } from "../src/data";
import {
  byDescendingDeathAge,
  DEFAULT_AGE,
  findFreshSeed,
  parseAge,
  parseSeed,
  selectPeople,
} from "../src/selection";

describe("URL state parsing", () => {
  it("accepts seed zero and rejects malformed seeds", () => {
    expect(parseSeed("0", 123)).toBe(0);
    expect(parseSeed("1.5", 123)).toBe(123);
    expect(parseSeed("Infinity", 123)).toBe(123);
    expect(parseSeed("not-a-number", 123)).toBe(123);
  });

  it("rounds and clamps finite ages", () => {
    expect(parseAge(null)).toBe(DEFAULT_AGE);
    expect(parseAge("40.6")).toBe(41);
    expect(parseAge("2")).toBe(10);
    expect(parseAge("Infinity")).toBe(DEFAULT_AGE);
  });
});

describe("timeline selection", () => {
  const eligible = people.filter((person) => person.deathAge < 41);

  it("is deterministic for a shared seed", () => {
    const first = selectPeople(eligible, 0, 41).map(({ id }) => id);
    const second = selectPeople(eligible, 0, 41).map(({ id }) => id);
    expect(second).toEqual(first);
  });

  it("changes across seeds while retaining the closest available age", () => {
    const first = selectPeople(eligible, 1, 41);
    const second = selectPeople(eligible, 2, 41);
    expect(second.map(({ id }) => id)).not.toEqual(first.map(({ id }) => id));
    expect(first.some(({ deathAge }) => deathAge === 40)).toBe(true);
    expect(second.some(({ deathAge }) => deathAge === 40)).toBe(true);
  });

  it("limits category and nationality concentration", () => {
    const selection = selectPeople(eligible, 12_345, 41);
    const largestCount = (values: string[]) =>
      Math.max(
        ...[...new Set(values)].map(
          (value) => values.filter((entry) => entry === value).length,
        ),
      );
    expect(
      largestCount(selection.map(({ category }) => category)),
    ).toBeLessThanOrEqual(3);
    expect(
      largestCount(selection.map(({ nationality }) => nationality)),
    ).toBeLessThanOrEqual(3);
    const ageCounts = selection.map(({ deathAge }) => deathAge);
    expect(
      Math.max(
        ...[...new Set(ageCounts)].map(
          (value) => ageCounts.filter((age) => age === value).length,
        ),
      ),
    ).toBeLessThanOrEqual(2);
  });

  it("uses a deliberate iconic, well-known and discovery mix", () => {
    const selection = selectPeople(eligible, 12_345, 41);
    const count = (tier: string) =>
      selection.filter(({ popularity }) => popularity === tier).length;

    expect(count("iconic")).toBe(8);
    expect(count("well-known")).toBe(5);
    expect(count("discovery")).toBe(3);
  });

  it("finds a reproducible shuffle with at most 35% overlap", () => {
    const initial = selectPeople(eligible, 1, 41);
    const previousIds = new Set(initial.map(({ id }) => id));
    const fresh = findFreshSeed(eligible, previousIds, 41, 987_654);
    const replay = selectPeople(eligible, fresh.seed, 41);

    expect(fresh.overlap).toBeLessThanOrEqual(5);
    expect(replay.map(({ id }) => id)).toEqual(
      fresh.people.map(({ id }) => id),
    );
  });

  it.each([30, 41, 65, 100])(
    "keeps repeated shuffles fresh at age %i",
    (referenceAge) => {
      const pool = people.filter(({ deathAge }) => deathAge < referenceAge);
      let current = selectPeople(pool, 1, referenceAge);

      for (let index = 0; index < 12; index++) {
        const fresh = findFreshSeed(
          pool,
          new Set(current.map(({ id }) => id)),
          referenceAge,
          10_000 + index,
        );
        expect(fresh.overlap).toBeLessThanOrEqual(fresh.targetOverlap);
        current = fresh.people;
      }
    },
  );

  it("starts beyond-age selections with the closest eligible age", () => {
    const beyond = people.filter((person) => person.deathAge > 41);
    const selection = selectPeople(beyond, 12_345, 41, 5);
    const closestAge = Math.min(...beyond.map(({ deathAge }) => deathAge));

    expect(selection[0].deathAge).toBe(closestAge);
    expect(selection.every(({ deathAge }) => deathAge > 41)).toBe(true);
  });

  it("orders the complete timeline from oldest to youngest", () => {
    const mixed = [people[0], people.at(-1)!, people[50], people[100]];
    const ordered = [...mixed].sort(byDescendingDeathAge);

    expect(ordered.map(({ deathAge }) => deathAge)).toEqual(
      [...ordered.map(({ deathAge }) => deathAge)].sort((a, b) => b - a),
    );
  });
});
