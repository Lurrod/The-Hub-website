import { describe, it, expect } from "vitest";
import { profileSchema } from "./schema";

describe("profileSchema — DOB + LFT", () => {
  it("accepts an empty date_of_birth and defaults lft_enabled to false", () => {
    const r = profileSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.date_of_birth).toBe("");
      expect(r.data.lft_enabled).toBe(false);
    }
  });
  it("coerces a checked checkbox ('on') to lft_enabled true", () => {
    const r = profileSchema.safeParse({ lft_enabled: "on" });
    expect(r.success && r.data.lft_enabled).toBe(true);
  });
  it("treats an empty-string lft_enabled as false", () => {
    const r = profileSchema.safeParse({ lft_enabled: "" });
    expect(r.success && r.data.lft_enabled).toBe(false);
  });
  it("rejects an out-of-range date_of_birth", () => {
    const r = profileSchema.safeParse({ date_of_birth: "2020-01-01" });
    expect(r.success).toBe(false);
  });
  it("accepts a valid in-range date_of_birth", () => {
    const r = profileSchema.safeParse({ date_of_birth: "2000-06-12" });
    expect(r.success).toBe(true);
  });
});
