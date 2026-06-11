import { describe, it, expect } from "vitest";
import { clientIpFromForwardedFor } from "./client-ip";

describe("clientIpFromForwardedFor", () => {
  it("returns the single value when there is one hop", () => {
    expect(clientIpFromForwardedFor("203.0.113.7")).toBe("203.0.113.7");
  });

  it("returns the RIGHTMOST (trusted-proxy) hop, not the spoofable leftmost", () => {
    // Attacker pre-sets a fake client IP; nginx appends the real one on the right.
    expect(clientIpFromForwardedFor("1.2.3.4, 203.0.113.7")).toBe("203.0.113.7");
  });

  it("handles extra whitespace between hops", () => {
    expect(clientIpFromForwardedFor("  1.1.1.1 ,  203.0.113.9  ")).toBe("203.0.113.9");
  });

  it("ignores trailing empty segments", () => {
    expect(clientIpFromForwardedFor("203.0.113.7, ")).toBe("203.0.113.7");
  });

  it("returns 'unknown' for null, undefined or empty input", () => {
    expect(clientIpFromForwardedFor(null)).toBe("unknown");
    expect(clientIpFromForwardedFor(undefined)).toBe("unknown");
    expect(clientIpFromForwardedFor("")).toBe("unknown");
    expect(clientIpFromForwardedFor("   ")).toBe("unknown");
  });

  it("preserves an IPv6 address that contains colons", () => {
    expect(clientIpFromForwardedFor("2001:db8::1")).toBe("2001:db8::1");
  });
});
