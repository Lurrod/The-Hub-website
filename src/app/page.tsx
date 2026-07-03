import type { Metadata } from "next";
import Link from "next/link";
import s from "./landing.module.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const DISCORD_INVITE = "https://discord.com/invite/aSZNHuhJg5";

/** Three plain facts about the system, shown as a quiet meta row. */
const FACTS = ["5v5", "ELO-balanced", "Verified by HenrikDev"];

/** A stylised, static preview of what the product actually produces:
    a finished 10-man scoreboard. Not live data — a cinematic showcase card. */
const BOARD = {
  tag: "THE HUB · MATCH #1287",
  map: "Ascent",
  teamA: { name: "TEAM A", score: 13 },
  teamB: { name: "TEAM B", score: 9 },
  rows: [
    { name: "zeru", color: "var(--red)", kda: "24 / 14 / 8", rating: "1.42" },
    { name: "milo", color: "var(--cyan)", kda: "19 / 16 / 5", rating: "1.18" },
    { name: "kayo.", color: "var(--violet)", kda: "17 / 15 / 11", rating: "1.09" },
    { name: "nova", color: "var(--blue)", kda: "13 / 17 / 9", rating: "0.94" },
  ] as { name: string; color: string; kda: string; rating: string }[],
};

/** The full match lifecycle, condensed to three beats. Each is a hand-drawn tile
    on the hero scoreboard's palette (dark glass + cool accents) — no raster assets. */
type StepKind = "queue" | "vote" | "elo";
const STEPS: { n: string; kind: StepKind; accent: string; title: string; desc: string }[] = [
  { n: "01", kind: "queue", accent: "var(--cyan)", title: "Queue in Discord", desc: "Hit Join on your queue. The bot matchmakes and brute-forces a balanced 5v5 by ELO." },
  { n: "02", kind: "vote", accent: "var(--gold)", title: "Play & vote", desc: "A private room spawns with a picked map and host. Seven of ten votes settle the result." },
  { n: "03", kind: "elo", accent: "var(--green)", title: "It lands here", desc: "Stats are verified from the real game, ELO is applied, and the match becomes a scoreboard." },
];

/** The site is, at heart, an index of the archive. Each tile previews a real
    page with a small illustration and a short tag — image over prose. */
type ArchiveKind = "board" | "stats" | "match" | "profile";
const INDEX: { name: string; href: string; kind: ArchiveKind; tag: string; accent: string }[] = [
  { name: "Leaderboards", href: "/leaderboard", kind: "board", tag: "ELO ladders", accent: "var(--gold)" },
  { name: "Stats", href: "/stats", kind: "stats", tag: "Rating · ACS · HS%", accent: "var(--cyan)" },
  { name: "Matches", href: "/matches", kind: "match", tag: "Scoreboards", accent: "var(--violet)" },
  { name: "Profiles", href: "/me", kind: "profile", tag: "Discord-linked", accent: "var(--blue)" },
];

/** Four ladders run in parallel — the page's single, quiet splash of colour. */
const LADDERS: { name: string; gate: string; access: string; color: string }[] = [
  { name: "Pro", gate: "FL PRO", access: "VCL / VCT level — staff-reviewed.", color: "var(--red)" },
  { name: "Semi Pro", gate: "FL SEMIPRO", access: "Top VRC level — staff-reviewed.", color: "var(--cyan)" },
  { name: "Open", gate: "FL OPEN", access: "Open to everyone — instant access.", color: "var(--violet)" },
  { name: "GC", gate: "FL GC", access: "Game Changers only — staff-reviewed.", color: "var(--blue)" },
];

export default function Landing() {
  return (
    <div className={s.page}>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <header className={s.hero}>
        <div className={s.heroBloom} aria-hidden />
        <div className={s.heroGrid}>
          <div className={s.heroText}>
            <p className={`${s.kicker} ${s.reveal}`}>Fast Learner × The Hub</p>
            <h1 className={`${s.title} ${s.reveal}`} style={{ animationDelay: "0.07s" }}>
              <span className={s.titleLine}>Valorant</span>
              <span className={`${s.titleLine} ${s.titleAccent}`}>10-mans</span>
            </h1>
            <p className={`${s.lead} ${s.reveal}`} style={{ animationDelay: "0.14s" }}>
              A Discord bot runs every queue, balanced team and result vote.
              This site is the public record of everything it produces.
            </p>
            <div className={`${s.actions} ${s.reveal}`} style={{ animationDelay: "0.21s" }}>
              <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className={s.primary}>
                Join the Discord
              </a>
              <Link href="/leaderboard" className={s.secondary}>
                Explore the ladders <span aria-hidden>→</span>
              </Link>
            </div>
            <ul className={`${s.facts} ${s.reveal}`} style={{ animationDelay: "0.28s" }}>
              {FACTS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          {/* stylised product preview — a finished scoreboard, floating */}
          <div className={`${s.heroPreview} ${s.reveal}`} style={{ animationDelay: "0.18s" }} aria-hidden>
            <div className={s.eloChip}>
              ELO <b>+24</b>
            </div>
            <div className={s.board}>
              <div className={s.boardHead}>
                <span className={s.boardTag}>{BOARD.tag}</span>
                <span className={s.boardMap}>{BOARD.map}</span>
              </div>
              <div className={s.boardScore}>
                <span className={s.scoreTeam}>{BOARD.teamA.name}</span>
                <span className={s.scoreWin}>{BOARD.teamA.score}</span>
                <span className={s.scoreDash}>—</span>
                <span className={s.scoreLoss}>{BOARD.teamB.score}</span>
                <span className={`${s.scoreTeam} ${s.scoreTeamR}`}>{BOARD.teamB.name}</span>
              </div>
              <div className={s.boardRows}>
                {BOARD.rows.map((r) => (
                  <div key={r.name} className={s.boardRow}>
                    <span className={s.brDot} style={{ background: r.color }} />
                    <span className={s.brName}>{r.name}</span>
                    <span className={s.brKda}>{r.kda}</span>
                    <span className={s.brRating}>{r.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
      <section>
        <SectionLabel n="01" text="How it works" />
        <div className={s.steps}>
          {STEPS.map((st, i) => (
            <article
              key={st.n}
              className={`${s.step} ${s.reveal}`}
              style={{ animationDelay: `${i * 0.06}s`, ["--accent" as string]: st.accent }}
            >
              <div className={s.stepArt} style={{ color: st.accent }} aria-hidden>
                <StepArt kind={st.kind} />
              </div>
              <span className={s.stepBadge}>{st.n}</span>
              <h3 className={s.stepTitle}>{st.title}</h3>
              <p className={s.stepDesc}>{st.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────────────────── INDEX ───────────────────────── */}
      <section>
        <SectionLabel n="02" text="Browse the archive" />
        <nav className={s.archGrid} aria-label="Browse the archive">
          {INDEX.map((it, i) => (
            <Link
              key={it.name}
              href={it.href}
              className={`${s.archCard} ${s.reveal}`}
              style={{ animationDelay: `${i * 0.05}s`, ["--accent" as string]: it.accent }}
            >
              <div className={s.archArt} style={{ color: it.accent }} aria-hidden>
                <ArchiveArt kind={it.kind} />
              </div>
              <span className={s.archFoot}>
                <span className={s.archText}>
                  <span className={s.archName}>{it.name}</span>
                  <span className={s.archTag}>{it.tag}</span>
                </span>
                <span className={s.archArrow} aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>

      {/* ───────────────────────── LADDERS ───────────────────────── */}
      <section>
        <SectionLabel n="03" text="Four ladders" />
        <ul className={s.ladders}>
          {LADDERS.map((q, i) => (
            <li
              key={q.name}
              className={`${s.ladder} ${s.reveal}`}
              style={{ animationDelay: `${i * 0.05}s`, ["--accent" as string]: q.color }}
            >
              <span className={s.dot} style={{ background: q.color }} aria-hidden />
              <span className={s.ladderName}>{q.name}</span>
              <span className={s.ladderGate}>{q.gate}</span>
              <span className={s.ladderAccess}>{q.access}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────────────────── CLOSING ───────────────────────── */}
      <footer className={`${s.close} ${s.reveal}`}>
        <p className={s.closeLine}>Ready when you are.</p>
        <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className={s.primary}>
          Join the server <span aria-hidden>→</span>
        </a>
      </footer>
    </div>
  );
}

/** Neutral tones shared by every illustration (scoreboard palette): faint whites
    for structure, with the accent carried by `currentColor` and the scoreboard's
    semantic colours (green = positive, gold = rating) where they apply. */
const NEUTRAL = "rgba(255,255,255,0.26)";
const FAINT = "rgba(255,255,255,0.14)";

function StepArt({ kind }: { kind: StepKind }) {
  if (kind === "queue") {
    // symmetrical: two little teams meeting in the middle, balanced ELO bars
    const dots = [0, 1, 2, 3, 4];
    return (
      <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        {dots.map((d) => (
          <circle key={`a${d}`} cx={34 + d * 22} cy={68} r={8.5} fill="currentColor" />
        ))}
        {dots.map((d) => (
          <circle key={`b${d}`} cx={196 + d * 22} cy={68} r={8.5} fill="none" stroke={NEUTRAL} strokeWidth="2" />
        ))}
        <rect x="140" y="55" width="40" height="26" rx="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <text x="160" y="73" fill="var(--txt)" fontSize="14" fontWeight="700" fontFamily="var(--font-teko), sans-serif" textAnchor="middle">5v5</text>
        <rect x="28" y="106" width="106" height="12" rx="6" fill="currentColor" opacity="0.9" />
        <rect x="186" y="106" width="106" height="12" rx="6" fill={NEUTRAL} />
        <text x="160" y="150" fill="var(--muted)" fontSize="10.5" letterSpacing="3" fontFamily="monospace" textAnchor="middle">BALANCED · ELO</text>
      </svg>
    );
  }
  if (kind === "vote") {
    // radial: a 70% ring settling the vote, with the tally beneath
    const C = 2 * Math.PI * 46;
    return (
      <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <circle cx="160" cy="78" r="46" stroke={FAINT} strokeWidth="12" />
        <circle
          cx="160"
          cy="78"
          r="46"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${C * 0.7} ${C}`}
          transform="rotate(-90 160 78)"
        />
        <path d="M143 78 l11 12 l24 -26" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="160" y="148" fill="var(--txt)" fontSize="15" fontWeight="700" fontFamily="var(--font-teko), sans-serif" letterSpacing="1.5" textAnchor="middle">7 / 10 VOTES</text>
      </svg>
    );
  }
  // the result: a finished scoreboard beat — win in green, +ELO chip, gold rating
  return (
    <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <rect x="214" y="26" width="66" height="26" rx="13" fill="var(--green)" />
      <text x="247" y="44" fill="#04120c" fontSize="13" fontWeight="700" fontFamily="monospace" textAnchor="middle">+24</text>
      <text x="150" y="102" textAnchor="middle" fontFamily="var(--font-teko), sans-serif" fontWeight="700" fontSize="58">
        <tspan fill="var(--green)">13</tspan>
        <tspan fill={FAINT} dx="10">—</tspan>
        <tspan fill="var(--muted)" dx="10">9</tspan>
      </text>
      <text x="160" y="146" textAnchor="middle" fill="var(--gold)" fontSize="12" fontWeight="600" letterSpacing="2" fontFamily="monospace">RATING 1.42</text>
    </svg>
  );
}

/** Small stylised preview of each archive page, in the site's cool product
    tone: line/shape art in the tile's accent (currentColor) over faint whites. */
function ArchiveArt({ kind }: { kind: ArchiveKind }) {
  const W = "rgba(255,255,255,0.24)";
  const Wd = "rgba(255,255,255,0.14)";
  if (kind === "board") {
    // a ranked leaderboard: rank chip + name bar + value, top row lit
    return (
      <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        {[0, 1, 2].map((i) => {
          const y = 22 + i * 32;
          const top = i === 0;
          return (
            <g key={i}>
              <rect x="18" y={y} width="24" height="24" rx="7" fill={top ? "currentColor" : Wd} />
              <rect x="52" y={y + 6} width={108 - i * 18} height="12" rx="6" fill={W} />
              <rect x="152" y={y + 6} width="30" height="12" rx="6" fill={top ? "currentColor" : Wd} />
            </g>
          );
        })}
      </svg>
    );
  }
  if (kind === "stats") {
    // a small bar chart with a trend line riding the tops
    const bars: [number, number][] = [
      [30, 52],
      [60, 34],
      [90, 66],
      [120, 48],
      [150, 78],
    ];
    const pts = bars.map(([x, h]) => [x + 9, 106 - h]);
    return (
      <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        {bars.map(([x, h], i) => (
          <rect key={x} x={x} y={106 - h} width="18" height={h} rx="4" fill={i === bars.length - 1 ? "currentColor" : Wd} />
        ))}
        <polyline points={pts.map((p) => p.join(",")).join(" ")} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p) => (
          <circle key={p.join()} cx={p[0]} cy={p[1]} r="3.2" fill="currentColor" />
        ))}
      </svg>
    );
  }
  if (kind === "match") {
    // a mini scoreboard: team labels, big score, two rows of player pips
    return (
      <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <text x="22" y="28" fill={W} fontSize="11" letterSpacing="2" fontFamily="monospace">TEAM A</text>
        <text x="178" y="28" textAnchor="end" fill={W} fontSize="11" letterSpacing="2" fontFamily="monospace">TEAM B</text>
        <text x="100" y="76" textAnchor="middle" fontFamily="var(--font-teko), sans-serif" fontWeight="700" fontSize="44">
          <tspan fill="var(--green)">13</tspan>
          <tspan fill={Wd} dx="8">—</tspan>
          <tspan fill="var(--muted)" dx="8">9</tspan>
        </text>
        <line x1="22" y1="92" x2="178" y2="92" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {[0, 1, 2, 3, 4].map((c) => (
          <circle key={`a${c}`} cx={34 + c * 14} cy="106" r="3.2" fill="currentColor" opacity="0.85" />
        ))}
        {[0, 1, 2, 3, 4].map((c) => (
          <circle key={`b${c}`} cx={110 + c * 14} cy="106" r="3.2" fill={W} />
        ))}
      </svg>
    );
  }
  // profile: avatar silhouette + name/handle bars + two stat pills
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <clipPath id="arch-pf">
          <circle cx="52" cy="52" r="25" />
        </clipPath>
      </defs>
      <circle cx="52" cy="52" r="26" fill="rgba(255,255,255,0.08)" />
      <g clipPath="url(#arch-pf)">
        <circle cx="52" cy="46" r="11" fill="currentColor" />
        <circle cx="52" cy="82" r="20" fill="currentColor" />
      </g>
      <circle cx="52" cy="52" r="26" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="96" y="38" width="84" height="13" rx="6.5" fill={W} />
      <rect x="96" y="60" width="52" height="10" rx="5" fill={Wd} />
      <rect x="20" y="96" width="76" height="20" rx="10" fill="rgba(255,255,255,0.05)" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
      <rect x="104" y="96" width="76" height="20" rx="10" fill="rgba(255,255,255,0.05)" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    </svg>
  );
}

function SectionLabel({ n, text }: { n: string; text: string }) {
  return (
    <p className={`${s.sectionLabel} ${s.reveal}`}>
      <span className={s.sectionNum}>{n}</span>
      {text}
    </p>
  );
}
