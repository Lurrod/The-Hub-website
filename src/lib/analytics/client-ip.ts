/**
 * Resolve the real client IP from the `X-Forwarded-For` header behind a single
 * trusted reverse proxy (the production deployment runs Next.js behind nginx).
 *
 * `X-Forwarded-For` is a comma-separated list `client, proxy1, proxy2, ...`.
 * The LEFTMOST entry is whatever the *client* sent and is therefore spoofable:
 * a caller can pre-set the header and the proxy only appends to it. The
 * RIGHTMOST entry is the address our own trusted proxy (nginx) actually
 * observed on the connection, so we take that hop instead.
 *
 * This is used only for the daily, salted, anonymised visitor hash — it never
 * exposes or stores a raw IP — but using the trusted hop prevents a caller from
 * forging unlimited distinct "visitors" by rotating a fake leftmost value.
 */
export function clientIpFromForwardedFor(xff: string | null | undefined): string {
  if (!xff) return "unknown";
  const parts = xff
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "unknown";
}
