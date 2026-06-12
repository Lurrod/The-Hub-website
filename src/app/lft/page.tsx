import type { Metadata } from "next";
import { getCachedLftPlayers, type LftFilters } from "@/lib/db/lft";
import { ROLES } from "@/lib/profile/schema";
import { COUNTRIES } from "@/lib/profile/countries";
import LftCard from "@/components/LftCard";

export const metadata: Metadata = {
  title: "Looking For Team",
  description: "Browse players looking for a team — filter by role, country and age.",
};

// Driven entirely by search params → keep dynamic (see leaderboard rationale).
type SP = {
  q?: string;
  role?: string | string[];
  country?: string;
  minAge?: string;
  maxAge?: string;
};

function toRoles(role: string | string[] | undefined): string[] {
  const arr = Array.isArray(role) ? role : role ? [role] : [];
  const allowed = new Set<string>(ROLES);
  return arr.filter((r) => allowed.has(r));
}

function toAge(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 120 ? n : undefined;
}

const filterInput: React.CSSProperties = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--txt)",
  fontSize: 13,
  fontFamily: "inherit",
};

export default async function LftPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const selectedRoles = toRoles(sp.role);
  const filters: LftFilters = {
    roles: selectedRoles,
    nationality: sp.country,
    minAge: toAge(sp.minAge),
    maxAge: toAge(sp.maxAge),
    query: sp.q,
  };
  const players = await getCachedLftPlayers(filters);

  return (
    <>
      <h1
        className="eyebrow"
        style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "20px 4px 12px" }}
      >
        Looking For Team
      </h1>

      <form
        method="get"
        className="glass"
        style={{ padding: 16, borderRadius: 14, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 16 }}
      >
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Search</span>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Player name" style={filterInput} />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Country</span>
          <select name="country" defaultValue={sp.country ?? ""} style={filterInput}>
            <option value="">All</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Min age</span>
          <input name="minAge" type="number" min={13} max={100} defaultValue={sp.minAge ?? ""} style={{ ...filterInput, width: 90 }} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Max age</span>
          <input name="maxAge" type="number" min={13} max={100} defaultValue={sp.maxAge ?? ""} style={{ ...filterInput, width: 90 }} />
        </label>

        <fieldset style={{ border: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Roles</span>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {ROLES.map((r) => (
              <label key={r} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--txt)" }}>
                <input type="checkbox" name="role" value={r} defaultChecked={selectedRoles.includes(r)} style={{ accentColor: "var(--red)" }} />
                {r}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          style={{ background: "linear-gradient(135deg,var(--red),#d8323f)", color: "#fff", border: "none", borderRadius: 999, padding: "9px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Filter
        </button>
      </form>

      {players.length === 0 ? (
        <div className="glass" style={{ padding: 20, borderRadius: 14, color: "var(--muted)" }}>
          No players are looking for a team with these filters.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {players.map((p) => (
            <LftCard key={p.userId} player={p} />
          ))}
        </div>
      )}
    </>
  );
}
