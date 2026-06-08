import Link from "next/link";
import { searchPlayers } from "@/lib/db/search";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const hits = q ? await searchPlayers(q) : [];

  return (
    <>
      <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>
        {q ? `Search — "${q}"` : "Search"}
      </div>
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
