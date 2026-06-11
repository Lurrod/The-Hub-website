/**
 * Human-readable meanings for stat column headers, shown as native hover
 * tooltips (`title`) wherever stats sit under an abbreviated header.
 * Keyed by the exact header label string used in each table.
 */
export const STAT_TOOLTIPS: Record<string, string> = {
  ELO: "Ranked rating points",
  "ELO +/-": "ELO gained or lost this match",
  "W-L": "Wins – Losses",
  Games: "Games played",
  GP: "Games played",
  Rating: "Performance rating — VALORANT 2.0 style (1.00 = average)",
  R: "Performance rating — VALORANT 2.0 style (1.00 = average)",
  ACS: "Average Combat Score per round",
  ADR: "Average Damage per Round",
  "K/D": "Kills ÷ Deaths",
  KAST: "% of rounds with a Kill, Assist, Survived or Traded",
  "HS%": "Headshot percentage",
  KPR: "Kills per round",
  APR: "Assists per round",
  FKPR: "First Kills per round",
  FDPR: "First Deaths per round",
  "K-D-A": "Kills – Deaths – Assists",
  "K / D / A": "Kills – Deaths – Assists",
  FK: "First Kills (opening duels won)",
  FD: "First Deaths (opening duels lost)",
};

/** Returns the tooltip text for a header label, or undefined if none applies. */
export function statTip(label: string): string | undefined {
  return STAT_TOOLTIPS[label];
}
