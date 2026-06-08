# The Hub Website — Plan 2: Profiles, Match History & Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add player profile pages, match detail (full scoreboard) pages, a recent-match-history view, and player search — all read-only, building on Plan 1's data layer and glass UI.

**Architecture:** Server Components read `matches`, `match_player_stats`, `player_rating_aggregates`, `elo`, `riot`, and `web_profiles` from MongoDB. Pure helpers derive per-match stat lines. The only Client Component is the navbar search form. No writes.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, `mongodb` driver, Vitest + `mongodb-memory-server`, Playwright.

**Companion spec:** `docs/superpowers/specs/2026-06-08-the-hub-website-design.md`. Builds on Plan 1 (`...-foundation.md`).

**Confirmed data shapes (from the bot):**
- `match_player_stats` (`_id = "<matchHex>:<uid>"`): `match_id` (STRING = the match ObjectId hex), `user_id`, `queue_type`, `map`, `agent`, `rounds_played`, `win` (bool), `kills`, `deaths`, `assists`, `damage_made`, `damage_received`, `headshots`, `bodyshots`, `legshots`, `multikills_2k..5k`, `first_kills`, `first_deaths`, `kast_rounds`, `acs` (number), `rating_2_0` (number, per-match), `created_at` (Date).
- `matches` (`_id` = ObjectId): `team_a`/`team_b` = `[{ id, name, elo }]`, `map`, `queue_type`, `status` (`validated_a` | `validated_b` | …), `match_number`, `created_at`, and **new in bot v1.25**: `score_a`/`score_b` (numbers, present only for Henrik-verified matches) and `elo_results` = `{ "<uid>": { delta, old, new, win } }` (present on matches validated after the bot update).
- `elo` / `player_rating_aggregates` / `riot` / `web_profiles`: as in Plan 1's spec.
- **Join key:** `ObjectId(match_player_stats.match_id)` === `matches._id`.

**Graceful degradation:** older matches have no `elo_results`/`score_*`; render `—` for ELO +/- and hide the scoreline when absent.

---

### Task 1: Match, profile & web-profile types

**Files:**
- Create: `src/lib/db/match-types.ts`
- Modify: `src/lib/db/types.ts` (add `WebProfile`)

- [ ] **Step 1: Create `src/lib/db/match-types.ts`**

```ts
import type { ObjectId } from "mongodb";
import type { QueueType } from "./types";

/** Doc in `match_player_stats`. `match_id` is the match ObjectId's hex string. */
export interface MatchPlayerStat {
  _id: string;
  match_id: string;
  user_id: string;
  queue_type: QueueType;
  map: string;
  agent: string;
  rounds_played: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damage_made: number;
  damage_received: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  first_kills: number;
  first_deaths: number;
  kast_rounds: number;
  acs: number;
  rating_2_0: number;
  created_at: Date;
}

export interface MatchTeamPlayer {
  id: number | string;
  name?: string;
  elo?: number;
}

export interface EloResult {
  delta: number;
  old: number;
  new: number;
  win: boolean;
}

/** Doc in `matches`. */
export interface MatchDoc {
  _id: ObjectId;
  team_a: MatchTeamPlayer[];
  team_b: MatchTeamPlayer[];
  map: string;
  queue_type: QueueType;
  status: string;
  match_number?: number | null;
  created_at: Date;
  score_a?: number;
  score_b?: number;
  elo_results?: Record<string, EloResult>;
}
```

- [ ] **Step 2: Add `WebProfile` to `src/lib/db/types.ts`** (append at end of file)

```ts
/** Doc in `web_profiles` (`_id = discord user_id`). Read-only in Plan 2. */
export interface WebProfile {
  _id: string;
  bio?: string;
  favorite_agent?: string;
  favorite_role?: string;
  favorite_map?: string;
  socials?: { twitch?: string; twitter?: string; youtube?: string };
  vlr_url?: string;
  tracker_url?: string;
  updated_at?: Date;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/match-types.ts src/lib/db/types.ts
git commit -m "feat: types for match docs, per-match stats and web profiles"
```

---

### Task 2: Per-match stat-line derivation + relative time (pure, TDD)

**Files:**
- Create: `src/lib/stats/match-line.ts`
- Test: `src/lib/stats/match-line.test.ts`

- [ ] **Step 1: Write the failing test** `src/lib/stats/match-line.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildMatchLine, relativeTime } from "./match-line";
import type { MatchPlayerStat } from "@/lib/db/match-types";

const stat: MatchPlayerStat = {
  _id: "deadbeef:1", match_id: "deadbeef", user_id: "1", queue_type: "pro",
  map: "Ascent", agent: "Jett", rounds_played: 24, win: true,
  kills: 24, deaths: 15, assists: 6, damage_made: 4344, damage_received: 4000,
  headshots: 30, bodyshots: 60, legshots: 10, first_kills: 4, first_deaths: 2,
  kast_rounds: 18, acs: 281, rating_2_0: 1.41, created_at: new Date("2026-06-08T10:00:00Z"),
};

describe("buildMatchLine", () => {
  it("derives per-match line fields", () => {
    const l = buildMatchLine(stat);
    expect(l.matchId).toBe("deadbeef");
    expect(l.agent).toBe("Jett");
    expect(l.map).toBe("Ascent");
    expect(l.win).toBe(true);
    expect(l.rating).toBeCloseTo(1.41, 5);
    expect(l.acs).toBe(281);
    expect(l.kills).toBe(24);
    expect(l.adr).toBeCloseTo(4344 / 24, 5);
    expect(l.hsPct).toBeCloseTo(30, 5); // 30 / (30+60+10)
    expect(l.kastPct).toBeCloseTo(75, 5); // 18 / 24
  });

  it("guards zero rounds/shots", () => {
    const l = buildMatchLine({ ...stat, rounds_played: 0, headshots: 0, bodyshots: 0, legshots: 0 });
    expect(l.adr).toBeNull();
    expect(l.kastPct).toBeNull();
    expect(l.hsPct).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-06-08T12:00:00Z");
  it("formats minutes, hours, days", () => {
    expect(relativeTime(new Date("2026-06-08T11:30:00Z"), now)).toBe("30m ago");
    expect(relativeTime(new Date("2026-06-08T09:00:00Z"), now)).toBe("3h ago");
    expect(relativeTime(new Date("2026-06-06T12:00:00Z"), now)).toBe("2d ago");
  });
  it("handles just now", () => {
    expect(relativeTime(new Date("2026-06-08T11:59:30Z"), now)).toBe("just now");
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `npm test -- match-line`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/stats/match-line.ts`**

```ts
import type { MatchPlayerStat } from "@/lib/db/match-types";
import type { QueueType } from "@/lib/db/types";
import { safeDiv } from "./derive";

export interface MatchLine {
  matchId: string;
  userId: string;
  queueType: QueueType;
  map: string;
  agent: string;
  win: boolean;
  rating: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number | null;
  hsPct: number | null;
  kastPct: number | null;
  firstKills: number;
  firstDeaths: number;
  createdAt: Date;
}

export function buildMatchLine(s: MatchPlayerStat): MatchLine {
  const shots = s.headshots + s.bodyshots + s.legshots;
  const kast = safeDiv(s.kast_rounds, s.rounds_played);
  const hs = safeDiv(s.headshots, shots);
  return {
    matchId: s.match_id,
    userId: s.user_id,
    queueType: s.queue_type,
    map: s.map,
    agent: s.agent,
    win: s.win,
    rating: s.rating_2_0,
    acs: s.acs,
    kills: s.kills,
    deaths: s.deaths,
    assists: s.assists,
    adr: safeDiv(s.damage_made, s.rounds_played),
    hsPct: hs === null ? null : hs * 100,
    kastPct: kast === null ? null : kast * 100,
    firstKills: s.first_kills,
    firstDeaths: s.first_deaths,
    createdAt: s.created_at,
  };
}

/** Short relative time like "30m ago" / "3h ago" / "2d ago". */
export function relativeTime(then: Date, now: Date = new Date()): string {
  const sec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
```

- [ ] **Step 4: Run, confirm PASS; commit**

Run: `npm test -- match-line` → PASS. Then `npm test` (all pass), `npx tsc --noEmit` (clean).
```bash
git add src/lib/stats/match-line.ts src/lib/stats/match-line.test.ts
git commit -m "feat: per-match stat-line derivation and relative time"
```

---

### Task 3: Player profile data access (integration TDD)

**Files:**
- Create: `src/lib/db/profile.ts`
- Test: `src/lib/db/profile.test.ts`

Returns the player's display name, per-queue stat lines (reusing Plan 1's
`buildStatLine`), and their `web_profiles` doc (or null). Returns `null` when
the player has no `elo` and no aggregate docs (unknown player → 404).

- [ ] **Step 1: Write the failing test** `src/lib/db/profile.test.ts`

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  const base = {
    rounds_played: 200, kills: 180, deaths: 160, assists: 60, damage_made: 30000,
    damage_received: 28000, headshots: 90, bodyshots: 180, legshots: 30,
    multikills_2k: 0, multikills_3k: 0, multikills_4k: 0, multikills_5k: 0,
    first_kills: 24, first_deaths: 18, kast_rounds: 150, updated_at: new Date(),
  };
  await db.collection("player_rating_aggregates").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", games: 20, rating_2_0_sum: 24, ...base },
    { _id: "1:open", user_id: "1", queue_type: "open", games: 10, rating_2_0_sum: 9, ...base },
  ] as unknown as Document[]);
  await db.collection("elo").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", elo: 2300, wins: 12, losses: 8, name: "Alpha" },
    { _id: "1:open", user_id: "1", queue_type: "open", elo: 2000, wins: 6, losses: 4, name: "Alpha" },
  ] as unknown as Document[]);
  await db.collection("web_profiles").insertOne({
    _id: "1", bio: "gg", favorite_agent: "Jett", socials: { twitch: "alpha" },
  } as unknown as Document);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("getPlayerProfile", () => {
  it("returns name, per-queue stat lines and web profile", async () => {
    const { getPlayerProfile } = await import("./profile");
    const p = await getPlayerProfile("1");
    expect(p).not.toBeNull();
    expect(p!.name).toBe("Alpha");
    expect(p!.queues.map((q) => q.queueType).sort()).toEqual(["open", "pro"]);
    const pro = p!.queues.find((q) => q.queueType === "pro")!;
    expect(pro.elo).toBe(2300);
    expect(pro.rating).toBeCloseTo(24 / 20, 5);
    expect(p!.webProfile?.bio).toBe("gg");
  });

  it("returns null for an unknown player", async () => {
    const { getPlayerProfile } = await import("./profile");
    expect(await getPlayerProfile("999")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm FAIL** — `npm test -- profile` → FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/db/profile.ts`**

```ts
import { getDb } from "./client";
import type { RatingAggregate, EloDoc, WebProfile } from "./types";
import { buildStatLine, type PlayerStatLine } from "@/lib/stats/derive";

export interface PlayerProfile {
  userId: string;
  name: string;
  queues: PlayerStatLine[];
  webProfile: WebProfile | null;
}

/** Full profile for a Discord user id, or null if the player is unknown. */
export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const db = await getDb();
  const [aggs, elos, web] = await Promise.all([
    db.collection<RatingAggregate>("player_rating_aggregates").find({ user_id: userId }).toArray(),
    db.collection<EloDoc>("elo").find({ user_id: userId }).toArray(),
    db.collection<WebProfile>("web_profiles").findOne({ _id: userId }),
  ]);
  if (aggs.length === 0 && elos.length === 0) return null;

  const eloById = new Map(elos.map((e) => [e._id, e]));
  const queues: PlayerStatLine[] = [];
  for (const agg of aggs) {
    const elo = eloById.get(agg._id);
    if (elo) queues.push(buildStatLine(agg, elo));
  }
  queues.sort((a, b) => b.elo - a.elo);
  const name = queues[0]?.name ?? elos[0]?.name ?? userId;
  return { userId, name, queues, webProfile: web ?? null };
}
```

- [ ] **Step 4: Run, confirm PASS; commit**

Run: `npm test -- profile` → PASS (2). Then `npm test`, `npx tsc --noEmit`.
```bash
git add src/lib/db/profile.ts src/lib/db/profile.test.ts
git commit -m "feat: player profile data access"
```

---

### Task 4: Match history + match detail data access (integration TDD)

**Files:**
- Create: `src/lib/db/matches.ts`
- Test: `src/lib/db/matches.test.ts`

`getPlayerMatchHistory` reads recent `match_player_stats` for a user, joins the
parent `matches` docs to attach `eloDelta` and the scoreline. `getMatchDetail`
returns the match doc (serialized) plus all player lines grouped into the two
teams.

- [ ] **Step 1: Write the failing test** `src/lib/db/matches.test.ts`

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;
const MID = new ObjectId("0123456789abcdef01234567");
const hex = MID.toHexString();

function pstat(uid: string, over: Record<string, unknown>) {
  return {
    _id: `${hex}:${uid}`, match_id: hex, user_id: uid, queue_type: "pro",
    map: "Ascent", agent: "Jett", rounds_played: 22, win: true,
    kills: 20, deaths: 14, assists: 5, damage_made: 3300, damage_received: 3000,
    headshots: 40, bodyshots: 60, legshots: 10, first_kills: 3, first_deaths: 2,
    kast_rounds: 17, acs: 250, rating_2_0: 1.2, created_at: new Date("2026-06-08T10:00:00Z"),
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("matches").insertOne({
    _id: MID, queue_type: "pro", map: "Ascent", status: "validated_a", match_number: 42,
    created_at: new Date("2026-06-08T10:00:00Z"),
    team_a: [{ id: "1", name: "Alpha" }, { id: "2", name: "Bravo" }],
    team_b: [{ id: "3", name: "Charlie" }, { id: "4", name: "Delta" }],
    score_a: 13, score_b: 9,
    elo_results: { "1": { delta: 22, old: 2000, new: 2022, win: true }, "3": { delta: -18, old: 2100, new: 2082, win: false } },
  } as unknown as Document);
  await db.collection("match_player_stats").insertMany([
    pstat("1", { win: true }), pstat("2", { win: true }),
    pstat("3", { win: false }), pstat("4", { win: false }),
  ] as unknown as Document[]);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("getPlayerMatchHistory", () => {
  it("returns recent lines with eloDelta and score from the parent match", async () => {
    const { getPlayerMatchHistory } = await import("./matches");
    const rows = await getPlayerMatchHistory("1", { limit: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0].matchId).toBe(hex);
    expect(rows[0].agent).toBe("Jett");
    expect(rows[0].eloDelta).toBe(22);
    expect(rows[0].scoreLine).toBe("13-9");
  });

  it("omits eloDelta/scoreLine when the player has no result on the match", async () => {
    const { getPlayerMatchHistory } = await import("./matches");
    const rows = await getPlayerMatchHistory("2", { limit: 10 });
    expect(rows[0].eloDelta).toBeNull();
    expect(rows[0].scoreLine).toBe("13-9"); // score is match-wide
  });
});

describe("getMatchDetail", () => {
  it("returns the match and both teams' player lines", async () => {
    const { getMatchDetail } = await import("./matches");
    const d = await getMatchDetail(hex);
    expect(d).not.toBeNull();
    expect(d!.matchNumber).toBe(42);
    expect(d!.scoreA).toBe(13);
    expect(d!.scoreB).toBe(9);
    expect(d!.teamA.map((p) => p.userId).sort()).toEqual(["1", "2"]);
    expect(d!.teamB.map((p) => p.userId).sort()).toEqual(["3", "4"]);
    const a1 = d!.teamA.find((p) => p.userId === "1")!;
    expect(a1.name).toBe("Alpha");
    expect(a1.eloDelta).toBe(22);
  });

  it("returns null for a bad id or missing match", async () => {
    const { getMatchDetail } = await import("./matches");
    expect(await getMatchDetail("not-an-objectid")).toBeNull();
    expect(await getMatchDetail("0123456789abcdef0123dead")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm FAIL** — `npm test -- matches` → FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/db/matches.ts`**

```ts
import { ObjectId } from "mongodb";
import { getDb } from "./client";
import type { MatchPlayerStat, MatchDoc, MatchTeamPlayer } from "./match-types";
import { buildMatchLine, type MatchLine } from "@/lib/stats/match-line";

export interface HistoryRow extends MatchLine {
  eloDelta: number | null;
  scoreLine: string | null;
  matchNumber: number | null;
}

function scoreLine(m: MatchDoc | undefined): string | null {
  if (!m || m.score_a === undefined || m.score_b === undefined) return null;
  return `${m.score_a}-${m.score_b}`;
}

/** Recent matches for a player, newest first, enriched from the parent match. */
export async function getPlayerMatchHistory(
  userId: string,
  opts: { limit?: number; skip?: number } = {},
): Promise<HistoryRow[]> {
  const limit = opts.limit ?? 15;
  const skip = opts.skip ?? 0;
  const db = await getDb();
  const stats = await db
    .collection<MatchPlayerStat>("match_player_stats")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  if (stats.length === 0) return [];

  const oids = stats
    .map((s) => (ObjectId.isValid(s.match_id) ? new ObjectId(s.match_id) : null))
    .filter((x): x is ObjectId => x !== null);
  const matches = await db.collection<MatchDoc>("matches").find({ _id: { $in: oids } }).toArray();
  const byId = new Map(matches.map((m) => [m._id.toHexString(), m]));

  return stats.map((s) => {
    const m = byId.get(s.match_id);
    const er = m?.elo_results?.[userId];
    return {
      ...buildMatchLine(s),
      eloDelta: er ? er.delta : null,
      scoreLine: scoreLine(m),
      matchNumber: m?.match_number ?? null,
    };
  });
}

export interface ScoreboardPlayer extends MatchLine {
  name: string;
  eloDelta: number | null;
}

export interface MatchDetail {
  matchId: string;
  matchNumber: number | null;
  map: string;
  queueType: string;
  status: string;
  createdAt: Date;
  scoreA: number | null;
  scoreB: number | null;
  winner: "a" | "b" | null;
  teamA: ScoreboardPlayer[];
  teamB: ScoreboardPlayer[];
}

function nameFor(teams: MatchTeamPlayer[], uid: string): string | undefined {
  return teams.find((p) => String(p.id) === uid)?.name;
}

/** Full match detail (both teams' scoreboards), or null if not found. */
export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  if (!ObjectId.isValid(matchId)) return null;
  const db = await getDb();
  const oid = new ObjectId(matchId);
  const [match, stats] = await Promise.all([
    db.collection<MatchDoc>("matches").findOne({ _id: oid }),
    db.collection<MatchPlayerStat>("match_player_stats").find({ match_id: matchId }).toArray(),
  ]);
  if (!match) return null;

  const teamAIds = new Set(match.team_a.map((p) => String(p.id)));
  const teamA: ScoreboardPlayer[] = [];
  const teamB: ScoreboardPlayer[] = [];
  for (const s of stats) {
    const er = match.elo_results?.[s.user_id];
    const row: ScoreboardPlayer = {
      ...buildMatchLine(s),
      name: nameFor(match.team_a, s.user_id) ?? nameFor(match.team_b, s.user_id) ?? s.user_id,
      eloDelta: er ? er.delta : null,
    };
    (teamAIds.has(s.user_id) ? teamA : teamB).push(row);
  }
  const byRating = (a: ScoreboardPlayer, b: ScoreboardPlayer) => b.rating - a.rating;
  teamA.sort(byRating);
  teamB.sort(byRating);

  const winner = match.status === "validated_a" ? "a" : match.status === "validated_b" ? "b" : null;
  return {
    matchId,
    matchNumber: match.match_number ?? null,
    map: match.map,
    queueType: match.queue_type,
    status: match.status,
    createdAt: match.created_at,
    scoreA: match.score_a ?? null,
    scoreB: match.score_b ?? null,
    winner,
    teamA,
    teamB,
  };
}
```

- [ ] **Step 4: Run, confirm PASS; commit**

Run: `npm test -- matches` → PASS (4). Then `npm test`, `npx tsc --noEmit`.
```bash
git add src/lib/db/matches.ts src/lib/db/matches.test.ts
git commit -m "feat: match history and match detail data access"
```

---

### Task 5: Player search data access (integration TDD)

**Files:**
- Create: `src/lib/db/search.ts`
- Test: `src/lib/db/search.test.ts`

Case-insensitive name search over the `elo` collection, de-duplicated by
`user_id`. The query string is escaped before being used in a regex (no
injection / ReDoS from user input).

- [ ] **Step 1: Write the failing test** `src/lib/db/search.test.ts`

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("elo").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", elo: 2300, wins: 0, losses: 0, name: "Zephyr" },
    { _id: "1:open", user_id: "1", queue_type: "open", elo: 2000, wins: 0, losses: 0, name: "Zephyr" },
    { _id: "2:pro", user_id: "2", queue_type: "pro", elo: 2100, wins: 0, losses: 0, name: "Zenith" },
    { _id: "3:pro", user_id: "3", queue_type: "pro", elo: 1900, wins: 0, losses: 0, name: "Nova" },
  ] as unknown as Document[]);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("searchPlayers", () => {
  it("finds players by case-insensitive name prefix, de-duped by user", async () => {
    const { searchPlayers } = await import("./search");
    const res = await searchPlayers("ze");
    expect(res.map((r) => r.name).sort()).toEqual(["Zenith", "Zephyr"]);
    expect(res.filter((r) => r.userId === "1")).toHaveLength(1); // de-duped across queues
  });

  it("returns [] for blank queries and escapes regex metacharacters", async () => {
    const { searchPlayers } = await import("./search");
    expect(await searchPlayers("  ")).toEqual([]);
    expect(await searchPlayers("(")).toEqual([]); // no throw, no match
  });
});
```

- [ ] **Step 2: Run, confirm FAIL** — `npm test -- search` → FAIL.

- [ ] **Step 3: Implement `src/lib/db/search.ts`**

```ts
import { getDb } from "./client";
import type { EloDoc } from "./types";

export interface PlayerHit {
  userId: string;
  name: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Players whose name contains `query` (case-insensitive), de-duped by user. */
export async function searchPlayers(query: string, limit = 20): Promise<PlayerHit[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const db = await getDb();
  const docs = await db
    .collection<EloDoc>("elo")
    .find({ name: { $regex: escapeRegex(q), $options: "i" } })
    .limit(limit * 4)
    .toArray();

  const seen = new Set<string>();
  const hits: PlayerHit[] = [];
  for (const d of docs) {
    if (seen.has(d.user_id)) continue;
    seen.add(d.user_id);
    hits.push({ userId: d.user_id, name: d.name });
    if (hits.length >= limit) break;
  }
  return hits;
}
```

- [ ] **Step 4: Run, confirm PASS; commit**

Run: `npm test -- search` → PASS (2). Then `npm test`, `npx tsc --noEmit`.
```bash
git add src/lib/db/search.ts src/lib/db/search.test.ts
git commit -m "feat: player search data access with regex escaping"
```

---

### Task 6: Shared UI bits — agent placeholder, team color, profile avatar

**Files:**
- Create: `src/components/Avatar.tsx`
- Create: `src/components/ui.ts`

- [ ] **Step 1: Create `src/components/ui.ts`** (small shared style helpers, pure)

```ts
/** Initials for an avatar placeholder. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** ELO delta as a signed string, or em dash. */
export function fmtDelta(d: number | null): string {
  if (d === null) return "—";
  return d > 0 ? `+${d}` : `${d}`;
}
```

- [ ] **Step 2: Create `src/components/Avatar.tsx`** (placeholder avatar; real Discord avatar arrives in Plan 3)

```tsx
import { initials } from "./ui";

export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size, height: size, borderRadius: "50%", flex: "0 0 auto",
        display: "grid", placeItems: "center",
        background: "linear-gradient(135deg,#3a5a72,#0e1620)",
        border: "1px solid var(--line)", color: "var(--txt)",
        fontWeight: 700, fontSize: size * 0.4, fontFamily: "var(--font-teko)",
      }}
    >
      {initials(name)}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui.ts src/components/Avatar.tsx
git commit -m "feat: avatar placeholder and small UI helpers"
```

---

### Task 7: Player profile page `/player/[id]`

**Files:**
- Create: `src/app/player/[id]/page.tsx`
- Create: `src/components/ProfileHeader.tsx`
- Create: `src/components/MatchHistory.tsx`

- [ ] **Step 1: Create `src/components/ProfileHeader.tsx`**

```tsx
import Avatar from "./Avatar";
import type { PlayerProfile } from "@/lib/db/profile";
import { QUEUE_LABELS } from "@/lib/db/types";

export default function ProfileHeader({ profile }: { profile: PlayerProfile }) {
  const top = profile.queues[0];
  const wp = profile.webProfile;
  const socials: { label: string; url: string }[] = [];
  if (wp?.socials?.twitch) socials.push({ label: "Twitch", url: `https://twitch.tv/${wp.socials.twitch}` });
  if (wp?.socials?.twitter) socials.push({ label: "Twitter", url: `https://x.com/${wp.socials.twitter}` });
  if (wp?.socials?.youtube) socials.push({ label: "YouTube", url: wp.socials.youtube });
  if (wp?.vlr_url) socials.push({ label: "VLR", url: wp.vlr_url });
  if (wp?.tracker_url) socials.push({ label: "Tracker", url: wp.tracker_url });

  return (
    <div className="glass" style={{ display: "flex", gap: 22, alignItems: "center", padding: 26, marginBottom: 16 }}>
      <Avatar name={profile.name} size={92} />
      <div style={{ flex: 1 }}>
        <div className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
          {profile.name}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
          {wp?.favorite_role && <span style={chip}>{wp.favorite_role}</span>}
          {wp?.favorite_agent && <span style={chip}>Main: {wp.favorite_agent}</span>}
          {wp?.favorite_map && <span style={chip}>Map: {wp.favorite_map}</span>}
        </div>
        {wp?.bio && <p style={{ color: "var(--muted)", margin: "0 0 8px", maxWidth: 640 }}>{wp.bio}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={chip}>{s.label}</a>
          ))}
        </div>
      </div>
      {top && (
        <div style={{ textAlign: "center", paddingLeft: 22, borderLeft: "1px solid var(--line)" }}>
          <div className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 52, fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>{top.elo}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{QUEUE_LABELS[top.queueType]} ELO</div>
        </div>
      )}
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 999,
  background: "rgba(255,255,255,.07)", border: "1px solid var(--line)",
  color: "#d4e4f0", textDecoration: "none",
};
```

- [ ] **Step 2: Create `src/components/MatchHistory.tsx`**

```tsx
import Link from "next/link";
import type { HistoryRow } from "@/lib/db/matches";
import { fmt, fmtPct, ratingClass } from "./format";
import { fmtDelta } from "./ui";
import { relativeTime } from "@/lib/stats/match-line";

export default function MatchHistory({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No recorded matches yet.</div>;
  }
  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Result", "Map", "Agent", "Rating", "K-D-A", "ADR", "HS%", "ELO", "When"].map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.matchId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <td style={{ padding: "11px 12px" }}>
                <Link href={`/match/${r.matchId}`} style={{ color: r.win ? "var(--green)" : "var(--red2)", fontWeight: 800, textDecoration: "none" }}>
                  {r.win ? "WIN" : "LOSS"}{r.scoreLine ? `  ${r.scoreLine}` : ""}
                </Link>
              </td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{r.map}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{r.agent}</td>
              <td className={ratingClass(r.rating)} style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700 }}>{fmt(r.rating)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{r.kills}-{r.deaths}-{r.assists}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(r.adr, 0)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmtPct(r.hsPct)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700, color: r.eloDelta === null ? "var(--muted)" : r.eloDelta > 0 ? "var(--green)" : "var(--red2)" }}>{fmtDelta(r.eloDelta)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right", color: "var(--muted)" }}>{relativeTime(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/player/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/db/profile";
import { getPlayerMatchHistory } from "@/lib/db/matches";
import { QUEUE_LABELS } from "@/lib/db/types";
import { fmt, fmtPct } from "@/components/format";
import ProfileHeader from "@/components/ProfileHeader";
import MatchHistory from "@/components/MatchHistory";

export const dynamic = "force-dynamic";

function eyebrow(text: string) {
  return <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>{text}</div>;
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();
  const history = await getPlayerMatchHistory(id, { limit: 15 });

  return (
    <>
      <ProfileHeader profile={profile} />
      {eyebrow("Stats by queue")}
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Queue", "ELO", "W-L", "Games", "Rating", "ADR", "K/D", "KAST", "HS%"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.queues.map((q) => (
              <tr key={q.queueType} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <td style={{ padding: "11px 12px", fontWeight: 700 }}>{QUEUE_LABELS[q.queueType]}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: "var(--gold)", fontWeight: 700 }}>{q.elo}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{q.wins}-{q.losses}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{q.games}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(q.rating)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(q.adr, 0)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(q.kd)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmtPct(q.kastPct)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmtPct(q.hsPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {eyebrow("Recent matches")}
      <MatchHistory rows={history} />
    </>
  );
}
```

- [ ] **Step 4: Verify build + commit**

Run: `npm run build` → succeeds, `/player/[id]` dynamic. `npm test`, `npx tsc --noEmit` clean.
```bash
git add src/app/player src/components/ProfileHeader.tsx src/components/MatchHistory.tsx
git commit -m "feat: player profile page with per-queue stats and match history"
```

---

### Task 8: Match detail page `/match/[id]`

**Files:**
- Create: `src/app/match/[id]/page.tsx`
- Create: `src/components/Scoreboard.tsx`

- [ ] **Step 1: Create `src/components/Scoreboard.tsx`**

```tsx
import Link from "next/link";
import type { ScoreboardPlayer } from "@/lib/db/matches";
import { fmt, fmtPct, ratingClass } from "./format";
import { fmtDelta } from "./ui";

function TeamTable({ title, players, won }: { title: string; players: ScoreboardPlayer[]; won: boolean }) {
  return (
    <div className="glass" style={{ overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "12px 16px", fontWeight: 800, letterSpacing: .5, color: won ? "var(--green)" : "var(--txt)", borderBottom: "1px solid var(--line)" }}>
        {title}{won ? "  · WON" : ""}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Player", "Agent", "Rating", "ACS", "K", "D", "A", "ADR", "HS%", "ELO"].map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "10px 12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                <Link href={`/player/${p.userId}`} style={{ color: "var(--txt)", textDecoration: "none" }}>{p.name}</Link>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.agent}</td>
              <td className={ratingClass(p.rating)} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{fmt(p.rating)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{Math.round(p.acs)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.kills}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.deaths}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.assists}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(p.adr, 0)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmtPct(p.hsPct)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: p.eloDelta === null ? "var(--muted)" : p.eloDelta > 0 ? "var(--green)" : "var(--red2)" }}>{fmtDelta(p.eloDelta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Scoreboard({ teamA, teamB, winner }: { teamA: ScoreboardPlayer[]; teamB: ScoreboardPlayer[]; winner: "a" | "b" | null }) {
  return (
    <>
      <TeamTable title="Team A" players={teamA} won={winner === "a"} />
      <TeamTable title="Team B" players={teamB} won={winner === "b"} />
    </>
  );
}
```

- [ ] **Step 2: Create `src/app/match/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/db/matches";
import { QUEUE_LABELS } from "@/lib/db/types";
import type { QueueType } from "@/lib/db/types";
import Scoreboard from "@/components/Scoreboard";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getMatchDetail(id);
  if (!d) notFound();

  const title = d.matchNumber ? `Match #${d.matchNumber}` : "Match";
  const score = d.scoreA !== null && d.scoreB !== null ? `${d.scoreA} - ${d.scoreB}` : null;

  return (
    <>
      <div className="glass" style={{ display: "flex", alignItems: "center", gap: 16, padding: 22, marginBottom: 16 }}>
        <div>
          <div className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{title}</div>
          <div style={{ color: "var(--muted)", marginTop: 4 }}>{QUEUE_LABELS[d.queueType as QueueType]} · {d.map}</div>
        </div>
        {score && (
          <div className="teko" style={{ marginLeft: "auto", fontFamily: "var(--font-teko)", fontSize: 44, fontWeight: 700 }}>
            <span style={{ color: d.winner === "a" ? "var(--green)" : "var(--txt)" }}>{d.scoreA}</span>
            <span style={{ color: "var(--muted)" }}> - </span>
            <span style={{ color: d.winner === "b" ? "var(--green)" : "var(--txt)" }}>{d.scoreB}</span>
          </div>
        )}
      </div>
      <Scoreboard teamA={d.teamA} teamB={d.teamB} winner={d.winner} />
    </>
  );
}
```

- [ ] **Step 3: Verify build + commit**

Run: `npm run build` (succeeds, `/match/[id]` dynamic), `npm test`, `npx tsc --noEmit`.
```bash
git add src/app/match src/components/Scoreboard.tsx
git commit -m "feat: match detail page with full scoreboard"
```

---

### Task 9: Player search — navbar form + `/search` page

**Files:**
- Create: `src/app/search/page.tsx`
- Modify: `src/components/Navbar.tsx` (extract the search input into a client form)
- Create: `src/components/SearchBox.tsx`

- [ ] **Step 1: Create `src/components/SearchBox.tsx`** (client component: submits to `/search`)

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const v = q.trim(); if (v) router.push(`/search?q=${encodeURIComponent(v)}`); }}
      style={{ display: "flex" }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍  Search player…"
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 16px", color: "var(--txt)", fontSize: 12, minWidth: 240 }}
      />
    </form>
  );
}
```

- [ ] **Step 2: Update `src/components/Navbar.tsx`** — replace the static `<input … />` with `<SearchBox />`

Add the import at the top:
```tsx
import SearchBox from "./SearchBox";
```
Replace the existing search `<input … />` element (the one with placeholder `"🔍  Search player…"`) with:
```tsx
      <SearchBox />
```
Leave the rest of the navbar (logo, nav links, login button) unchanged.

- [ ] **Step 3: Create `src/app/search/page.tsx`**

```tsx
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
        {q ? `Search — “${q}”` : "Search"}
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
```

- [ ] **Step 4: Verify build + commit**

Run: `npm run build` (succeeds; `/search` dynamic), `npm test`, `npx tsc --noEmit`.
```bash
git add src/app/search src/components/SearchBox.tsx src/components/Navbar.tsx
git commit -m "feat: player search box and results page"
```

---

### Task 10: Wire demo data + E2E smoke for the new pages

**Files:**
- Modify: `scripts/dev-demo.mjs` (seed a couple of matches + match_player_stats so profiles/matches render in `dev:demo`)
- Create: `e2e/profiles.spec.ts`
- Modify: `e2e/serve.mjs` (seed the same matches for E2E)

- [ ] **Step 1: Add a seeding helper for matches to `e2e/serve.mjs`**

After the existing `elo` insert in `e2e/serve.mjs`, insert one validated match with its per-player stats. Add (using the same `db`):
```js
import { ObjectId } from "mongodb";
const MID = new ObjectId("0123456789abcdef01234567");
const hex = MID.toHexString();
await db.collection("matches").insertOne({
  _id: MID, queue_type: "pro", map: "Ascent", status: "validated_a", match_number: 1,
  created_at: now,
  team_a: [{ id: "1", name: "Alpha" }], team_b: [{ id: "2", name: "Bravo" }],
  score_a: 13, score_b: 9,
  elo_results: { "1": { delta: 22, old: 2278, new: 2300, win: true }, "2": { delta: -18, old: 2118, new: 2100, win: false } },
});
function pstat(uid, agent, win, over) {
  return { _id: `${hex}:${uid}`, match_id: hex, user_id: uid, queue_type: "pro", map: "Ascent", agent,
    rounds_played: 22, win, kills: 20, deaths: 14, assists: 5, damage_made: 3300, damage_received: 3000,
    headshots: 40, bodyshots: 60, legshots: 10, first_kills: 3, first_deaths: 2, kast_rounds: 17,
    acs: 250, rating_2_0: 1.2, created_at: now, ...over };
}
await db.collection("match_player_stats").insertMany([
  pstat("1", "Jett", true, { acs: 281, rating_2_0: 1.41 }),
  pstat("2", "Omen", false, { acs: 180, rating_2_0: 0.92 }),
]);
```
(Use the existing player ids `"1"` and `"2"` already seeded as Alpha/Bravo. Keep the `import { ObjectId }` at the top with the other imports.)

- [ ] **Step 2: Mirror the same match seed into `scripts/dev-demo.mjs`** so `npm run dev:demo` shows profiles + a match. Add the same `ObjectId` import and, after the `elo` insert, insert one match + the two `match_player_stats` docs for two of the seeded player ids (e.g. `100` and `101`, using their seeded names). Keep it to one match — just enough to demo the pages.

```js
// (top, with the other imports)
import { ObjectId } from "mongodb";
// (after the elo insertMany)
const DEMO_MID = new ObjectId("0123456789abcdef0123dead");
const dhex = DEMO_MID.toHexString();
await db.collection("matches").insertOne({
  _id: DEMO_MID, queue_type: "pro", map: "Haven", status: "validated_a", match_number: 1,
  created_at: new Date(Date.now() - 3600 * 1000),
  team_a: [{ id: "100", name: NAMES[100 % NAMES.length] + "2" }],
  team_b: [{ id: "101", name: NAMES[101 % NAMES.length] + "2" }],
  score_a: 13, score_b: 7,
  elo_results: { "100": { delta: 24, old: 2276, new: 2300, win: true }, "101": { delta: -16, old: 2216, new: 2200, win: false } },
});
const dp = (uid, agent, win, acs, rating) => ({ _id: `${dhex}:${uid}`, match_id: dhex, user_id: String(uid),
  queue_type: "pro", map: "Haven", agent, rounds_played: 20, win, kills: 18, deaths: 12, assists: 6,
  damage_made: 3000, damage_received: 2700, headshots: 35, bodyshots: 55, legshots: 8, first_kills: 3,
  first_deaths: 2, kast_rounds: 16, acs, rating_2_0: rating, created_at: new Date(Date.now() - 3600 * 1000) });
await db.collection("match_player_stats").insertMany([
  dp(100, "Raze", true, 270, 1.33), dp(101, "Sage", false, 175, 0.88),
]);
```

- [ ] **Step 3: Create `e2e/profiles.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("profile page shows stats and match history", async ({ page }) => {
  await page.goto("/player/1");
  await expect(page.getByText("Alpha")).toBeVisible();
  await expect(page.getByText("Stats by queue")).toBeVisible();
  await expect(page.getByText("Recent matches")).toBeVisible();
  await expect(page.getByText("Ascent")).toBeVisible();
});

test("match detail shows both teams and score", async ({ page }) => {
  await page.goto("/match/0123456789abcdef01234567");
  await expect(page.getByText("Team A", { exact: false })).toBeVisible();
  await expect(page.getByText("Team B", { exact: false })).toBeVisible();
  await expect(page.getByText("Jett")).toBeVisible();
});

test("search finds a player and links to the profile", async ({ page }) => {
  await page.goto("/search?q=Alp");
  await page.getByText("Alpha").click();
  await expect(page).toHaveURL(/\/player\/1$/);
});
```

- [ ] **Step 4: Run E2E + commit**

Run: `npm run e2e` → all specs pass (Plan 1 smoke + these 3).
```bash
git add e2e scripts/dev-demo.mjs
git commit -m "test: seed matches and E2E for profiles, match detail and search"
```

---

## Plan 2 Definition of Done

- `npm test` green with ≥80% coverage on `src/lib/**`.
- `npm run build` succeeds; `/player/[id]`, `/match/[id]`, `/search` render.
- Profile shows per-queue stats + recent match history (with ELO +/- when present, `—` otherwise).
- Match detail shows both teams' full scoreboard (agent, ACS, rating, K/D/A, ADR, HS%, ELO +/-) and the scoreline when present.
- Navbar search navigates to `/search`, results link to profiles.
- `npm run e2e` green (Plan 1 + Plan 2 specs).
- Still no writes to any bot collection.

## Deferred to Plan 3

- Discord login (Auth.js), the `/me` editor, and writes to `web_profiles`.
- Real Discord avatars (Plan 2 uses initials placeholders).
- Match-history pagination beyond the first page (Plan 2 shows the latest 15).
