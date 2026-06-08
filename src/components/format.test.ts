import { describe, it, expect } from "vitest";
import { fmt, fmtPct, ratingClass } from "./format";

describe("format helpers", () => {
  it("fmt", () => {
    expect(fmt(1.2345)).toBe("1.23");
    expect(fmt(null)).toBe("—");
  });
  it("fmtPct", () => {
    expect(fmtPct(74.6)).toBe("75%");
    expect(fmtPct(null)).toBe("—");
  });
  it("ratingClass buckets", () => {
    expect(ratingClass(1.2)).toBe("g");
    expect(ratingClass(0.9)).toBe("y");
    expect(ratingClass(0.5)).toBe("r");
    expect(ratingClass(null)).toBe("");
  });
});
