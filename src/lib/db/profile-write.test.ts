import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Mongo client so we can assert on the update document.
const findOne = vi.fn();
const updateOne = vi.fn();
const collection = vi.fn(() => ({ findOne, updateOne }));
vi.mock("./client", () => ({ getDb: vi.fn(async () => ({ collection })) }));

import { updateWebProfile, type WebProfileWrite } from "./profile-write";

const identity = { username: "Neo", avatar: null };

function baseData(over: Partial<WebProfileWrite> = {}): WebProfileWrite {
  return {
    bio: "",
    roles: [],
    nationality: "",
    socials: {},
    vlr_url: "",
    tracker_url: "",
    date_of_birth: "",
    lft_enabled: false,
    ...over,
  };
}

beforeEach(() => {
  findOne.mockReset();
  updateOne.mockReset();
});

describe("updateWebProfile", () => {
  it("unsets date_of_birth when empty and does not set lft_updated_at when not LFT", async () => {
    findOne.mockResolvedValue(null);
    await updateWebProfile("u1", baseData(), identity);
    const arg = updateOne.mock.calls[0][1];
    expect(arg.$set.lft_enabled).toBe(false);
    expect(arg.$set).not.toHaveProperty("date_of_birth");
    expect(arg.$set).not.toHaveProperty("lft_updated_at");
    expect(arg.$unset).toHaveProperty("date_of_birth", "");
  });

  it("sets lft_updated_at on a false→true LFT transition", async () => {
    findOne.mockResolvedValue({ lft_enabled: false });
    await updateWebProfile("u1", baseData({ lft_enabled: true }), identity);
    const arg = updateOne.mock.calls[0][1];
    expect(arg.$set.lft_enabled).toBe(true);
    expect(arg.$set.lft_updated_at).toBeInstanceOf(Date);
  });

  it("does NOT refresh lft_updated_at when already LFT", async () => {
    findOne.mockResolvedValue({ lft_enabled: true });
    await updateWebProfile("u1", baseData({ lft_enabled: true }), identity);
    const arg = updateOne.mock.calls[0][1];
    expect(arg.$set).not.toHaveProperty("lft_updated_at");
  });

  it("sets date_of_birth and omits the $unset of it when provided", async () => {
    findOne.mockResolvedValue(null);
    await updateWebProfile("u1", baseData({ date_of_birth: "2000-06-12" }), identity);
    const arg = updateOne.mock.calls[0][1];
    expect(arg.$set.date_of_birth).toBe("2000-06-12");
    expect(arg.$unset ?? {}).not.toHaveProperty("date_of_birth");
  });
});
