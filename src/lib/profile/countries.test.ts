import { describe, it, expect } from "vitest";
import { COUNTRIES, isCountryCode, countryName, flagEmoji, flagUrl } from "./countries";

describe("countries", () => {
  it("exposes a non-trivial, well-formed list", () => {
    expect(COUNTRIES.length).toBeGreaterThan(150);
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
      expect(c.name.length).toBeGreaterThan(0);
    }
  });

  it("has unique codes", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("recognises known codes and rejects unknown ones", () => {
    expect(isCountryCode("FR")).toBe(true);
    expect(isCountryCode("ZZ")).toBe(false);
    expect(isCountryCode("fr")).toBe(false); // codes are uppercase
  });

  it("maps codes to names", () => {
    expect(countryName("FR")).toBe("France");
    expect(countryName("ZZ")).toBeUndefined();
    // the cleared/"unset" sentinel must read as no-country (chip suppression)
    expect(countryName("")).toBeUndefined();
  });

  it("builds a flag emoji from a known code and nothing from an unknown one", () => {
    expect(flagEmoji("FR")).toBe("🇫🇷");
    expect(flagEmoji("ZZ")).toBe("");
  });

  it("builds a flagcdn PNG URL (lowercased) for a known code and nothing for an unknown one", () => {
    expect(flagUrl("FR")).toBe("https://flagcdn.com/w80/fr.png");
    expect(flagUrl("ZZ")).toBe("");
  });
});
