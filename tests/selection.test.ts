import { describe, expect, it } from "vitest";
import { people } from "../src/data";
import {
  DEFAULT_AGE,
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
    expect(parseAge("2")).toBe(8);
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
    expect(new Set(selection.map(({ deathAge }) => deathAge)).size).toBe(
      selection.length,
    );
  });
});
