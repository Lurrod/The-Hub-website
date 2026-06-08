/** Initials for an avatar placeholder. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** ELO delta as a signed string, or em dash. */
export function fmtDelta(d: number | null): string {
  if (d === null) return "—";
  return d > 0 ? `+${d}` : `${d}`;
}
