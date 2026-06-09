import Link from "next/link";

const LEGAL: { href: string; label: string }[] = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/notice", label: "Legal Notice" },
  { href: "/legal/cookies", label: "Cookies" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        maxWidth: 1100,
        margin: "40px auto 24px",
        padding: "0 24px",
      }}
    >
      <div
        className="glass"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
          padding: "16px 22px",
          borderRadius: 16,
          boxShadow: "none",
        }}
      >
        <Link
          href="/"
          aria-label="The Hub - home"
          style={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}
        >
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              display: "block",
              backgroundImage: 'url("/fl_logo.png")',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        </Link>

        <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>
          © {year} Fast Learner × The Hub. All rights reserved.
        </span>

        <nav
          style={{
            marginLeft: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          {LEGAL.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <p
        style={{
          color: "var(--muted)",
          fontSize: 10.5,
          lineHeight: 1.6,
          textAlign: "center",
          margin: "12px 8px 0",
          opacity: 0.7,
        }}
      >
        Not affiliated with, endorsed, or sponsored by Riot Games. VALORANT is a
        trademark of Riot Games, Inc.
      </p>
    </footer>
  );
}
