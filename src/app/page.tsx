import Link from "next/link";
import s from "./landing.module.css";

const DISCORD_INVITE = "https://discord.com/invite/aSZNHuhJg5";

/** The two halves of the system. */
const PILLARS: { tag: string; name: string; lead: string; points: string[] }[] = [
  {
    tag: "In Discord",
    name: "The Bot",
    lead: "A Discord bot runs the entire match lifecycle - you never touch a spreadsheet.",
    points: [
      "Click Join to queue, the bot does the matchmaking",
      "Brute-force balanced 5v5 teams by ELO",
      "Spins up private match rooms, picks a map & host",
      "Tallies result votes and updates the ladder",
    ],
  },
  {
    tag: "On the web",
    name: "The Site",
    lead: "This site is the public archive of everything the bot produces - open to all.",
    points: [
      "Per-queue ELO leaderboards",
      "Deep stats: Rating 2.0, ACS, ADR, KAST, HS%",
      "Full 10-player scoreboards, round-by-round",
      "Discord-linked profiles you control",
    ],
  },
];

/** A match, start to finish. */
const FLOW: { n: string; title: string; text: string }[] = [
  { n: "01", title: "Queue up", text: "Hit Join on your queue's pinned message in Discord. Four ladders run in parallel: Pro, Semi Pro, Open and GC." },
  { n: "02", title: "Teams balanced", text: "At 10/10 the bot brute-forces the fairest split across all 126 possible 5v5s, minimizing the ELO gap." },
  { n: "03", title: "Match room spawns", text: "A private Match #N category appears with team voice channels, a picked map and an assigned lobby host." },
  { n: "04", title: "Play & vote", text: "Play the custom, then vote the winner. Seven of ten votes validate the result - no admin needed." },
  { n: "05", title: "Stats verified", text: "The bot pulls the real game from HenrikDev and weights each player's ELO swing by their ACS." },
  { n: "06", title: "It lands here", text: "ELO applies per-player, the leaderboard refreshes, and the match becomes a profile and scoreboard on this site." },
];

const QUEUES: { name: string; gate: string; blurb: string; color: string }[] = [
  { name: "Pro", gate: "FL PRO", blurb: "VCL / VCT level - access granted after a quick staff review.", color: "#f1c40f" },
  { name: "Semi Pro", gate: "FL SEMIPRO", blurb: "Top VRC level - access granted after a quick staff review.", color: "#0021a5" },
  { name: "Open", gate: "FL OPEN", blurb: "Open to everyone - access is granted instantly.", color: "#88fbb8" },
  { name: "GC", gate: "FL GC", blurb: "Open to Game Changers only - staff-reviewed.", color: "#08ff00" },
];

/** What a member actually types / clicks. */
const COMMANDS: { cmd: string; arg?: string; desc: string }[] = [
  { cmd: "Join", desc: "Persistent button on each queue - your way into a match." },
  { cmd: "/link-riot", arg: " riot_id:", desc: "Link your Valorant account. EU, Immortal+ required." },
  { cmd: "/unlink-riot", desc: "Remove the Riot link from your Discord." },
  { cmd: "/help", arg: " type:", desc: "The full list of member commands." },
];

export default function Landing() {
  return (
    <div className={s.page}>
      <span className={s.scan} aria-hidden />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className={s.hero}>
        <p className={`${s.kicker} ${s.reveal}`}>
          Fast Learner × The Hub
        </p>
        <h1 className={`${s.title} ${s.reveal}`} style={{ animationDelay: "0.08s" }}>
          <span className={s.l1}>Valorant 10-mans,</span>
          <span className={s.l2}>Run by <span className={s.accent}>Fast Learner × The Hub</span></span>
        </h1>
        <p className={`${s.lead} ${s.reveal}`} style={{ animationDelay: "0.16s" }}>
          A Discord bot runs the whole match lifecycle - <b>queues</b>, balanced teams,
          result votes and <b>performance ELO</b>. This site is the public home for every
          profile, ladder and scoreboard it produces.
        </p>
        <div className={`${s.ctas} ${s.reveal}`} style={{ animationDelay: "0.24s" }}>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className={`${s.cta} ${s.ctaDiscord}`}
          >
            <DiscordMark /> Join the Discord
          </a>
          <Link href="/leaderboard" className={`${s.cta} ${s.ctaGhost}`}>Explore the ladders</Link>
          <a href="#how" className={s.ctaText}>How it works ↓</a>
        </div>
      </section>

      {/* ───────────────────── TWO PILLARS ───────────────────── */}
      <section>
        <SectionHead num="01" title="Two halves, one system" />
        <div className={s.split}>
          {PILLARS.map((p, i) => (
            <article key={p.name} className={`${s.pillar} ${s.reveal}`} style={{ animationDelay: `${0.06 * i}s` }}>
              <div className={s.pillarTop}>
                <span className={s.pillarTag}>{p.tag}</span>
                <h3 className={s.pillarName}>{p.name}</h3>
              </div>
              <p className={s.pillarLead}>{p.lead}</p>
              <ul className={s.pillarList}>
                {p.points.map((pt) => (
                  <li key={pt}><span className={s.tick} aria-hidden />{pt}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────────────── MATCH FLOW ───────────────────── */}
      <section id="how">
        <SectionHead num="02" title="How a match works" />
        <div className={s.flow}>
          <span className={s.flowLine} aria-hidden />
          {FLOW.map((f, i) => (
            <article key={f.n} className={`${s.step} ${s.reveal}`} style={{ animationDelay: `${0.05 * i}s` }}>
              <span className={s.stepNum}>{f.n}</span>
              <div className={s.stepBody}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────────────── QUEUES ───────────────────── */}
      <section>
        <SectionHead num="03" title="Four queues, four ladders" />
        <div className={s.ladder}>
          {QUEUES.map((q, i) => (
            <Link
              key={q.name}
              href="/leaderboard"
              className={`${s.lrow} ${s.reveal}`}
              style={{ "--qc": q.color, animationDelay: `${0.05 * i}s` } as React.CSSProperties}
            >
              <span className={s.lindex} aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <div className={s.lmain}>
                <div className={s.lhead}>
                  <span className={s.lname}>{q.name}</span>
                  <span className={s.lgate}>{q.gate}</span>
                </div>
                <p className={s.lblurb}>{q.blurb}</p>
              </div>
              <span className={s.larrow} aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────────────── COMMANDS / TERMINAL ───────────────────── */}
      <section>
        <SectionHead num="04" title="What you do" />
        <div className={`${s.terminal} ${s.reveal}`}>
          <div className={s.termBar}>
            <span className={s.termDot} style={{ background: "var(--violet)" }} />
            <span className={s.termDot} style={{ background: "var(--gold)" }} />
            <span className={s.termDot} style={{ background: "var(--cyan)" }} />
            <span className={s.termTitle}>the-hub · member actions</span>
          </div>
          <div className={s.termBody}>
            {COMMANDS.map((c) => (
              <div key={c.cmd} className={s.cmdRow}>
                <code className={s.cmd}>
                  {c.cmd}{c.arg && <span className={s.cmdArg}>{c.arg}</span>}
                </code>
                <span className={s.cmdDesc}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── FINAL BAND ───────────────────── */}
      <div className={`${s.band} ${s.reveal}`}>
        <div className={s.bandGlow} aria-hidden />
        <h2>Ready up.</h2>
        <p>Join the server, link your Riot account, and queue your first 10-man.</p>
        <div className={s.bandCtas}>
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className={`${s.cta} ${s.ctaDiscord}`}>
            <DiscordMark /> Join the Discord
          </a>
          <Link href="/me" className={`${s.cta} ${s.ctaGhost}`}>Claim your profile</Link>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div className={`${s.shead} ${s.reveal}`}>
      <span className={s.snum}>{`// ${num}`}</span>
      <h2>{title}</h2>
      <span className={s.srule} aria-hidden />
    </div>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.3 18.3 0 0 0-5.4 0c-.16-.4-.4-.88-.62-1.26a.08.08 0 0 0-.08-.04c-1.7.29-3.35.8-4.93 1.51a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.89a.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .13c-.6.34-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.36 1.23 2a.08.08 0 0 0 .09.03 19.8 19.8 0 0 0 6.01-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}
