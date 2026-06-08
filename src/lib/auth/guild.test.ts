import { describe, it, expect } from "vitest";
import { isGuildMember } from "./guild";

const guilds = [{ id: "111", name: "A" }, { id: "222", name: "B" }];

describe("isGuildMember", () => {
  it("true when the target guild is in the list", () => {
    expect(isGuildMember(guilds, "222")).toBe(true);
  });
  it("false when absent", () => {
    expect(isGuildMember(guilds, "999")).toBe(false);
  });
  it("false on empty/invalid input", () => {
    expect(isGuildMember(null, "222")).toBe(false);
    expect(isGuildMember(guilds, "")).toBe(false);
  });
});
