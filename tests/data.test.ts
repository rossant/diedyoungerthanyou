import { describe, expect, it } from "vitest";
import { ageAtDeath, people } from "../src/data";

describe("ageAtDeath", () => {
  it.each([
    ["1980-01-01", "2020-01-01", 40],
    ["1980-01-02", "2020-01-01", 39],
    ["1980-12-31", "2020-12-30", 39],
    ["2000-02-29", "2021-02-28", 20],
  ])("calculates the completed years for %s → %s", (born, died, expected) => {
    expect(ageAtDeath(born, died)).toBe(expected);
  });

  it("rejects impossible calendar dates", () => {
    expect(() => ageAtDeath("1980-02-30", "2020-01-01")).toThrow();
    expect(() => ageAtDeath("not-a-date", "2020-01-01")).toThrow();
  });
});

describe("curated people", () => {
  it("derives every stored age from its source dates", () => {
    expect(people.length).toBeGreaterThanOrEqual(120);
    for (const person of people) {
      expect(person.deathAge).toBe(ageAtDeath(person.born, person.died));
    }
  });
});
