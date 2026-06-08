import Link from "next/link";

const teko = (size: number): React.CSSProperties => ({ fontFamily: "var(--font-teko)", fontWeight: 700, lineHeight: 0.95, fontSize: size });

function Cta({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: "11px 22px", borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none",
        color: primary ? "#fff" : "var(--txt)",
        background: primary ? "linear-gradient(135deg, var(--red), #d8323f)" : "rgba(255,255,255,.06)",
        border: primary ? "1px solid transparent" : "1px solid var(--line)",
        boxShadow: primary ? "0 8px 22px rgba(255,70,85,.3)" : "none",
      }}
    >
      {label}
    </Link>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 20, boxShadow: "none" }}>
      <div style={{ ...teko(24), marginBottom: 6 }}>{title}</div>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{children}</p>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "60px 16px 40px" }}>
        <span
          aria-hidden
          style={{ width: 96, height: 96, display: "block", backgroundImage: 'url("/fl_logo.png")', backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", marginBottom: 18 }}
        />
        <h1 style={{ ...teko(72), margin: 0 }}>
          THE <span style={{ color: "var(--red)" }}>HUB</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 620, margin: "14px 0 4px" }}>
          The Valorant 5v5 10-mans community for EU Immortal+ players — ranked queues, ELO, and full match stats.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 13, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, margin: "0 0 26px" }}>
          Fast Learner × The Hub
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Cta href="/leaderboard" label="View leaderboards" primary />
          <Cta href="/stats" label="Browse stats" />
          <Cta href="/matches" label="Live matches" />
        </div>
      </section>

      {/* Features */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 16 }}>
        <Feature title="4 ranked queues">
          Pro, Semi Pro, Open and GC — each with its own ELO ladder and independent leaderboard.
        </Feature>
        <Feature title="Performance ELO">
          Balanced 5v5 teams and ELO gains weighted by your in-game performance after every match.
        </Feature>
        <Feature title="Deep stats">
          Rating 2.0, ACS, ADR, K/D, KAST, HS%, first kills/deaths — per queue and per match.
        </Feature>
        <Feature title="Full scoreboards">
          Every game gets a complete 10-player scoreboard with the round-by-round breakdown.
        </Feature>
        <Feature title="Player profiles">
          Log in with Discord to customise your profile — role, agent, bio and your socials, VLR &amp; Tracker.
        </Feature>
        <Feature title="Live &amp; recent">
          Follow matches in progress and browse the history of recently played games.
        </Feature>
      </section>
    </>
  );
}
