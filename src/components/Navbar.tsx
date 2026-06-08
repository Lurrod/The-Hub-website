import Link from "next/link";
import SearchBox from "./SearchBox";

export default function Navbar() {
  return (
    <nav className="glass" style={{
      position: "sticky", top: 14, zIndex: 5, display: "flex", alignItems: "center",
      gap: 18, margin: "14px auto 0", maxWidth: 1100, padding: "12px 22px", borderRadius: 16,
    }}>
      <Link href="/" style={{ fontFamily: "var(--font-teko)", fontSize: 28, fontWeight: 700, letterSpacing: 1, color: "var(--txt)", textDecoration: "none" }}>
        THE <b style={{ color: "var(--red)" }}>HUB</b>
      </Link>
      <SearchBox />
      <div style={{ marginLeft: "auto", display: "flex", gap: 22, fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Leaderboards</Link>
        <Link href="/stats" style={{ color: "inherit", textDecoration: "none" }}>Stats</Link>
      </div>
      <button style={{
        background: "linear-gradient(135deg,#5865F2,#414cc4)", color: "#fff", border: "none",
        borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 12,
      }}>Login with Discord</button>
    </nav>
  );
}
