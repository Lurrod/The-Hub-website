/** Format a nullable number to fixed decimals, or an em dash when null. */
export function fmt(n: number | null, digits = 2): string {
  return n === null ? "-" : n.toFixed(digits);
}

/** Format a nullable percentage (already 0-100) as "NN%", or em dash. */
export function fmtPct(n: number | null): string {
  return n === null ? "-" : `${Math.round(n)}%`;
}

/** Rating colour bucket mirroring the bot scoreboard thresholds. */
export function ratingClass(n: number | null): "g" | "y" | "r" | "" {
  if (n === null) return "";
  if (n >= 1.1) return "g";
  if (n >= 0.85) return "y";
  return "r";
}
