import type { Metadata } from "next";
import Link from "next/link";
import { searchPlayers } from "@/lib/db/search";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search",
  description: "Find a player by name across the Fast Learner x The Hub ladders.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Cap the query length: an unbounded value would build a huge $regex that
  // can't use an index (DoS vector). 100 chars is well beyond any real name.
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const hits = q ? await searchPlayers(q) : [];

  return (
    <>
      <h1 style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>
        {q ? `Search - "${q}"` : "Search"}
      </h1>
      {q && hits.length === 0 && <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No players found.</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {hits.map((h) => (
          <Link key={h.userId} href={`/player/${h.userId}`} className="glass" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, textDecoration: "none", color: "var(--txt)" }}>
            <Avatar name={h.name} size={34} />
            <span style={{ fontWeight: 700 }}>{h.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
