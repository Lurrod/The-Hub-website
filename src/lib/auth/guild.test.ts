import { describe, it, expect, afterEach, vi } from "vitest";
import { isGuildMember, fetchUserGuilds } from "./guild";

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

describe("fetchUserGuilds", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the guild array on a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(guilds), { status: 200 })));
    await expect(fetchUserGuilds("tok")).resolves.toEqual(guilds);
  });

  it("returns [] on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401 })));
    await expect(fetchUserGuilds("tok")).resolves.toEqual([]);
  });

  it("passes an abort signal (timeout) to fetch", async () => {
    const spy = vi.fn(
      (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.resolve(new Response("[]", { status: 200 })),
    );
    vi.stubGlobal("fetch", spy);
    await fetchUserGuilds("tok");
    const init = spy.mock.calls[0][1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("fails secure (returns []) when fetch rejects (network error / timeout)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "TimeoutError");
    }));
    await expect(fetchUserGuilds("tok")).resolves.toEqual([]);
  });
});
