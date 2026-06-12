import { describe, it, expect } from "vitest";
import { computeAge, ageRangeToDobWindow, isValidDob, MIN_AGE, MAX_AGE } from "./age";

// Fixed "now" for deterministic tests: 2026-06-12 (UTC).
const NOW = new Date(Date.UTC(2026, 5, 12));

describe("computeAge", () => {
  it("returns full years when birthday already passed this year", () => {
    expect(computeAge("2000-01-01", NOW)).toBe(26);
  });
  it("does not count birthday that has not occurred yet this year", () => {
    expect(computeAge("2000-12-31", NOW)).toBe(25);
  });
  it("counts age on the exact birthday", () => {
    expect(computeAge("2008-06-12", NOW)).toBe(18);
  });
  it("handles 29 February birthdays", () => {
    expect(computeAge("2004-02-29", NOW)).toBe(22);
  });
  it("returns null for missing or invalid input", () => {
    expect(computeAge("", NOW)).toBeNull();
    expect(computeAge(null, NOW)).toBeNull();
    expect(computeAge("not-a-date", NOW)).toBeNull();
    expect(computeAge("2001-02-29", NOW)).toBeNull(); // 2001 is not a leap year
  });
});

describe("ageRangeToDobWindow", () => {
  it("min age only sets an upper DOB bound (lte)", () => {
    expect(ageRangeToDobWindow(18, undefined, NOW)).toEqual({ lte: "2008-06-12" });
  });
  it("max age only sets a lower DOB bound (gte)", () => {
    expect(ageRangeToDobWindow(undefined, 25, NOW)).toEqual({ gte: "2000-06-13" });
  });
  it("both bounds set both", () => {
    expect(ageRangeToDobWindow(18, 25, NOW)).toEqual({ gte: "2000-06-13", lte: "2008-06-12" });
  });
  it("no bounds returns empty window", () => {
    expect(ageRangeToDobWindow(undefined, undefined, NOW)).toEqual({});
  });
});

describe("isValidDob", () => {
  it("accepts a normal in-range date", () => {
    expect(isValidDob("2000-06-12", NOW)).toBe(true);
  });
  it("rejects malformed strings", () => {
    expect(isValidDob("2000-13-01", NOW)).toBe(false);
    expect(isValidDob("06/12/2000", NOW)).toBe(false);
  });
  it("rejects future dates", () => {
    expect(isValidDob("2030-01-01", NOW)).toBe(false);
  });
  it("rejects ages below MIN_AGE and above MAX_AGE", () => {
    expect(isValidDob("2020-01-01", NOW)).toBe(false); // ~6 yrs
    expect(isValidDob("1900-01-01", NOW)).toBe(false); // >100 yrs
  });
  it("accepts the exact MIN_AGE and MAX_AGE boundaries", () => {
    expect(isValidDob("2013-06-12", NOW)).toBe(true); // exactly 13
    expect(isValidDob("1926-06-12", NOW)).toBe(true); // exactly 100
  });
  it("exposes the age constants", () => {
    expect(MIN_AGE).toBe(13);
    expect(MAX_AGE).toBe(100);
  });
});
