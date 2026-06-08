# The Hub Website — Plan 1: Foundation & Public Stats — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js app, a read-only MongoDB data layer, a pure stat-derivation library, and the two public pages (Leaderboards `/` and Stats `/stats`) with the glassmorphism theme.

**Architecture:** Next.js 15 (App Router, TypeScript) reads the bot's local MongoDB (`elobot` database) through a thin data-access layer. Pure functions derive per-player stat lines from `player_rating_aggregates` + `elo`. Server Components render the pages; the Stats table is a Client Component for sorting. No writes in this plan.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `mongodb` driver, Vitest + `mongodb-memory-server` (unit/integration), Playwright (E2E).

**Companion spec:** `docs/superpowers/specs/2026-06-08-the-hub-website-design.md`

**Confirmed facts:**
- Database name is `elobot` (bot.py: `db = client["elobot"]`).
- Aggregates live in `player_rating_aggregates`, `_id = "<user_id>:<queue_type>"`, with counter fields and `updated_at`.
- ELO/wins/losses/name live in `elo`, same `_id`.
- Queue types: `pro`, `semipro`, `open`, `gc`.

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: project files via `create-next-app` in repo root
- Modify: `package.json`, `.gitignore` (already has `.superpowers/`, `node_modules/`, `.next/`, `.env*`)

- [ ] **Step 1: Scaffold (run in repo root, which already has `.git`, `README.md`, `docs/`, `.gitignore`)**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Accept defaults for any remaining prompts (e.g. Turbopack: default is fine). When prompted that the directory is not empty, choose to proceed (it keeps existing files: `.git`, `README.md`, `docs/`, `.gitignore`). Expected: `src/app/`, `package.json`, `tsconfig.json`, `tailwind` config created.

- [ ] **Step 2: Install runtime + test dependencies**

Run:
```bash
npm install mongodb
npm install -D vitest @vitest/coverage-v8 mongodb-memory-server @playwright/test
npx playwright install --with-deps chromium
```
Expected: all install without errors.

- [ ] **Step 3: Add scripts to `package.json`** (merge into existing `"scripts"`)

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 4: Verify the app boots**

Run: `npm run build`
Expected: build succeeds (default starter page).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with tooling"
```

---

### Task 2: Vitest configuration

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/.gitkeep` (ensure dir exists)

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 2: Add a trivial passing test to confirm the runner**

Create `src/lib/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("vitest", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```

- [ ] **Step 3: Run it**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 4: Delete the sanity test, commit**

```bash
rm src/lib/sanity.test.ts
git add -A
git commit -m "chore: configure vitest with coverage thresholds"
```

---

### Task 3: MongoDB types

**Files:**
- Create: `src/lib/db/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type QueueType = "pro" | "semipro" | "open" | "gc";

export const QUEUE_TYPES: QueueType[] = ["pro", "semipro", "open", "gc"];

export const QUEUE_LABELS: Record<QueueType, string> = {
  pro: "Pro",
  semipro: "Semi Pro",
  open: "Open",
  gc: "GC",
};

/** Doc in `player_rating_aggregates`, `_id = "<user_id>:<queue_type>"`. */
export interface RatingAggregate {
  _id: string;
  user_id: string;
  queue_type: QueueType;
  games: number;
  rounds_played: number;
  kills: number;
  deaths: number;
  assists: number;
  damage_made: number;
  damage_received: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  multikills_2k: number;
  multikills_3k: number;
  multikills_4k: number;
  multikills_5k: number;
  first_kills: number;
  first_deaths: number;
  kast_rounds: number;
  rating_2_0_sum: number;
  updated_at: Date;
}

/** Doc in `elo`, same `_id` as the aggregate. */
export interface EloDoc {
  _id: string;
  user_id: string;
  queue_type: QueueType;
  elo: number;
  wins: number;
  losses: number;
  name: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/types.ts
git commit -m "feat: add MongoDB document types"
```

---

### Task 4: Stat-derivation library (pure, TDD)

**Files:**
- Create: `src/lib/stats/derive.ts`
- Test: `src/lib/stats/derive.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/stats/derive.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { safeDiv, buildStatLine } from "./derive";
import type { RatingAggregate, EloDoc } from "@/lib/db/types";

const agg: RatingAggregate = {
  _id: "1:pro",
  user_id: "1",
  queue_type: "pro",
  games: 10,
  rounds_played: 200,
  kills: 180,
  deaths: 160,
  assists: 60,
  damage_made: 30000,
  damage_received: 28000,
  headshots: 90,
  bodyshots: 180,
  legshots: 30,
  multikills_2k: 12,
  multikills_3k: 3,
  multikills_4k: 1,
  multikills_5k: 0,
  first_kills: 24,
  first_deaths: 18,
  kast_rounds: 150,
  rating_2_0_sum: 11.5,
  updated_at: new Date("2026-06-01T00:00:00Z"),
};

const elo: EloDoc = {
  _id: "1:pro",
  user_id: "1",
  queue_type: "pro",
  elo: 2200,
  wins: 6,
  losses: 4,
  name: "Zephyr",
};

describe("safeDiv", () => {
  it("divides", () => expect(safeDiv(10, 2)).toBe(5));
  it("returns null on zero denominator", () => expect(safeDiv(10, 0)).toBeNull());
});

describe("buildStatLine", () => {
  it("computes all derived stats", () => {
    const s = buildStatLine(agg, elo);
    expect(s.userId).toBe("1");
    expect(s.name).toBe("Zephyr");
    expect(s.games).toBe(10);
    expect(s.elo).toBe(2200);
    expect(s.rating).toBeCloseTo(1.15, 5);
    expect(s.adr).toBeCloseTo(150, 5);
    expect(s.kd).toBeCloseTo(1.125, 5);
    expect(s.kastPct).toBeCloseTo(75, 5);
    expect(s.kpr).toBeCloseTo(0.9, 5);
    expect(s.apr).toBeCloseTo(0.3, 5);
    expect(s.fkpr).toBeCloseTo(0.12, 5);
    expect(s.fdpr).toBeCloseTo(0.09, 5);
    expect(s.hsPct).toBeCloseTo(30, 5); // 90 / (90+180+30)
    expect(s.updatedAt).toEqual(new Date("2026-06-01T00:00:00Z"));
  });

  it("returns null derived stats when rounds/games/shots are zero", () => {
    const empty: RatingAggregate = {
      ...agg,
      games: 0,
      rounds_played: 0,
      deaths: 0,
      headshots: 0,
      bodyshots: 0,
      legshots: 0,
    };
    const s = buildStatLine(empty, elo);
    expect(s.rating).toBeNull();
    expect(s.adr).toBeNull();
    expect(s.kd).toBeNull();
    expect(s.kastPct).toBeNull();
    expect(s.hsPct).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- derive`
Expected: FAIL ("Cannot find module './derive'").

- [ ] **Step 3: Write the implementation**

`src/lib/stats/derive.ts`:
```ts
import type { RatingAggregate, EloDoc, QueueType } from "@/lib/db/types";

export interface PlayerStatLine {
  userId: string;
  queueType: QueueType;
  name: string;
  games: number;
  rating: number | null;
  adr: number | null;
  kd: number | null;
  kastPct: number | null;
  kpr: number | null;
  apr: number | null;
  fkpr: number | null;
  fdpr: number | null;
  hsPct: number | null;
  elo: number;
  wins: number;
  losses: number;
  updatedAt: Date;
}

/** Divide, or null when the denominator is non-positive (avoids div-by-zero). */
export function safeDiv(n: number, d: number): number | null {
  return d > 0 ? n / d : null;
}

function pct(n: number, d: number): number | null {
  const r = safeDiv(n, d);
  return r === null ? null : r * 100;
}

export function buildStatLine(agg: RatingAggregate, elo: EloDoc): PlayerStatLine {
  const r = agg.rounds_played;
  const shots = agg.headshots + agg.bodyshots + agg.legshots;
  return {
    userId: agg.user_id,
    queueType: agg.queue_type,
    name: elo.name,
    games: agg.games,
    rating: safeDiv(agg.rating_2_0_sum, agg.games),
    adr: safeDiv(agg.damage_made, r),
    kd: safeDiv(agg.kills, agg.deaths),
    kastPct: pct(agg.kast_rounds, r),
    kpr: safeDiv(agg.kills, r),
    apr: safeDiv(agg.assists, r),
    fkpr: safeDiv(agg.first_kills, r),
    fdpr: safeDiv(agg.first_deaths, r),
    hsPct: pct(agg.headshots, shots),
    elo: elo.elo,
    wins: elo.wins,
    losses: elo.losses,
    updatedAt: agg.updated_at,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- derive`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/derive.ts src/lib/stats/derive.test.ts
git commit -m "feat: pure stat-derivation library with zero-guards"
```

---

### Task 5: MongoDB client singleton

**Files:**
- Create: `src/lib/db/client.ts`

- [ ] **Step 1: Write the client**

`src/lib/db/client.ts`:
```ts
import { MongoClient, Db } from "mongodb";

const DB_NAME = "elobot";

let clientPromise: Promise<MongoClient> | null = null;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const uri = process.env.MONGO_URL;
    if (!uri) throw new Error("MONGO_URL is not set");
    clientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      retryReads: true,
    }).connect();
  }
  return clientPromise;
}

/** Shared connection to the bot's `elobot` database. Read-only by convention. */
export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(DB_NAME);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/client.ts
git commit -m "feat: MongoDB client singleton for elobot database"
```

---

### Task 6: Players data-access (integration TDD with in-memory Mongo)

**Files:**
- Create: `src/lib/db/players.ts`
- Test: `src/lib/db/players.test.ts`

This reads `player_rating_aggregates` for a queue, joins `elo` by `_id`, and
returns `PlayerStatLine[]`. The test spins up `mongodb-memory-server`, seeds
docs, points `MONGO_URL` at it, and asserts the join + filters.

- [ ] **Step 1: Write the failing test**

`src/lib/db/players.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import type { RatingAggregate, EloDoc } from "./types";

let mem: MongoMemoryServer;
let client: MongoClient;

function agg(id: string, over: Partial<RatingAggregate>): RatingAggregate {
  return {
    _id: id,
    user_id: id.split(":")[0],
    queue_type: "pro",
    games: 12,
    rounds_played: 200,
    kills: 180,
    deaths: 160,
    assists: 60,
    damage_made: 30000,
    damage_received: 28000,
    headshots: 90,
    bodyshots: 180,
    legshots: 30,
    multikills_2k: 0,
    multikills_3k: 0,
    multikills_4k: 0,
    multikills_5k: 0,
    first_kills: 24,
    first_deaths: 18,
    kast_rounds: 150,
    rating_2_0_sum: 12,
    updated_at: new Date(),
    ...over,
  };
}
function elo(id: string, over: Partial<EloDoc>): EloDoc {
  return {
    _id: id,
    user_id: id.split(":")[0],
    queue_type: "pro",
    elo: 2000,
    wins: 6,
    losses: 6,
    name: "P" + id.split(":")[0],
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("player_rating_aggregates").insertMany([
    agg("1:pro", { rating_2_0_sum: 14, games: 12 }), // rating 1.166
    agg("2:pro", { rating_2_0_sum: 9, games: 12 }),  // rating 0.75
    agg("3:pro", { games: 3, rating_2_0_sum: 4 }),   // below minGames
    agg("4:semipro", { queue_type: "semipro", _id: "4:semipro" }),
  ]);
  await db.collection("elo").insertMany([
    elo("1:pro", { elo: 2300, name: "Alpha" }),
    elo("2:pro", { elo: 2100, name: "Bravo" }),
    elo("3:pro", { elo: 1900, name: "Charlie" }),
    elo("4:semipro", { queue_type: "semipro", _id: "4:semipro", name: "Delta" }),
  ]);
});

afterAll(async () => {
  await client.close();
  await mem.stop();
});

describe("getQueueStatLines", () => {
  it("returns joined lines for the queue, filtered by minGames, sorted by rating desc", async () => {
    const { getQueueStatLines } = await import("./players");
    const lines = await getQueueStatLines("pro", { minGames: 10 });
    expect(lines.map((l) => l.name)).toEqual(["Alpha", "Bravo"]); // Charlie filtered (3 games)
    expect(lines[0].rating).toBeCloseTo(14 / 12, 5);
    expect(lines[0].elo).toBe(2300);
  });

  it("scopes to the requested queue only", async () => {
    const { getQueueStatLines } = await import("./players");
    const lines = await getQueueStatLines("semipro", { minGames: 0 });
    expect(lines.map((l) => l.name)).toEqual(["Delta"]);
  });

  it("returns [] when no aggregates match", async () => {
    const { getQueueStatLines } = await import("./players");
    const lines = await getQueueStatLines("gc", { minGames: 0 });
    expect(lines).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- players`
Expected: FAIL ("Cannot find module './players'").

- [ ] **Step 3: Write the implementation**

`src/lib/db/players.ts`:
```ts
import { getDb } from "./client";
import type { RatingAggregate, EloDoc, QueueType } from "./types";
import { buildStatLine, type PlayerStatLine } from "@/lib/stats/derive";

export interface QueueStatOptions {
  /** Minimum games to be included. Default 0. */
  minGames?: number;
}

/**
 * All players of a queue as derived stat lines, sorted by Rating desc.
 * Joins `player_rating_aggregates` with `elo` on the shared compound `_id`.
 * Players without a matching `elo` doc are skipped.
 */
export async function getQueueStatLines(
  queueType: QueueType,
  opts: QueueStatOptions = {},
): Promise<PlayerStatLine[]> {
  const minGames = opts.minGames ?? 0;
  const db = await getDb();
  const aggs = await db
    .collection<RatingAggregate>("player_rating_aggregates")
    .find({ queue_type: queueType, games: { $gte: minGames } })
    .toArray();
  if (aggs.length === 0) return [];

  const ids = aggs.map((a) => a._id);
  const elos = await db
    .collection<EloDoc>("elo")
    .find({ _id: { $in: ids } })
    .toArray();
  const eloById = new Map(elos.map((e) => [e._id, e]));

  const lines: PlayerStatLine[] = [];
  for (const agg of aggs) {
    const elo = eloById.get(agg._id);
    if (elo) lines.push(buildStatLine(agg, elo));
  }
  lines.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  return lines;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- players`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/players.ts src/lib/db/players.test.ts
git commit -m "feat: queue stat-line data access with join and filters"
```

---

### Task 7: Leaderboard selector (active filter + ELO sort, TDD)

**Files:**
- Create: `src/lib/stats/leaderboard.ts`
- Test: `src/lib/stats/leaderboard.test.ts`

The leaderboard sorts by ELO and hides players inactive for more than 7 days
(mirrors the bot), using `updatedAt` as the activity signal. Pure function over
`PlayerStatLine[]` so it is trivially testable.

- [ ] **Step 1: Write the failing test**

`src/lib/stats/leaderboard.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { rankLeaderboard } from "./leaderboard";
import type { PlayerStatLine } from "./derive";

function line(over: Partial<PlayerStatLine>): PlayerStatLine {
  return {
    userId: "x", queueType: "pro", name: "X", games: 10,
    rating: 1, adr: 100, kd: 1, kastPct: 70, kpr: 0.8, apr: 0.3,
    fkpr: 0.1, fdpr: 0.1, hsPct: 25, elo: 2000, wins: 5, losses: 5,
    updatedAt: new Date(), ...over,
  };
}

describe("rankLeaderboard", () => {
  const now = new Date("2026-06-08T12:00:00Z");

  it("sorts by ELO desc and hides players inactive > 7 days", () => {
    const lines = [
      line({ name: "Old", elo: 9999, updatedAt: new Date("2026-05-01T00:00:00Z") }),
      line({ name: "Top", elo: 2300, updatedAt: new Date("2026-06-07T00:00:00Z") }),
      line({ name: "Mid", elo: 2100, updatedAt: new Date("2026-06-06T00:00:00Z") }),
    ];
    const ranked = rankLeaderboard(lines, now);
    expect(ranked.map((l) => l.name)).toEqual(["Top", "Mid"]); // Old hidden
  });

  it("keeps a player active exactly within 7 days", () => {
    const lines = [line({ name: "Edge", updatedAt: new Date("2026-06-01T12:00:00Z") })];
    expect(rankLeaderboard(lines, now)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- leaderboard`
Expected: FAIL ("Cannot find module './leaderboard'").

- [ ] **Step 3: Write the implementation**

`src/lib/stats/leaderboard.ts`:
```ts
import type { PlayerStatLine } from "./derive";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Active players (updated within 7 days of `now`) sorted by ELO desc. */
export function rankLeaderboard(
  lines: PlayerStatLine[],
  now: Date = new Date(),
): PlayerStatLine[] {
  const cutoff = now.getTime() - SEVEN_DAYS_MS;
  return lines
    .filter((l) => l.updatedAt.getTime() >= cutoff)
    .sort((a, b) => b.elo - a.elo);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- leaderboard`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats/leaderboard.ts src/lib/stats/leaderboard.test.ts
git commit -m "feat: leaderboard ranking with 7-day activity filter"
```

---

### Task 8: Glass theme, root layout & navbar

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/Navbar.tsx`
- Create: `src/components/format.ts`

- [ ] **Step 1: Write number formatting helpers + test**

`src/components/format.ts`:
```ts
/** Format a nullable number to fixed decimals, or an em dash when null. */
export function fmt(n: number | null, digits = 2): string {
  return n === null ? "—" : n.toFixed(digits);
}

/** Format a nullable percentage (already 0-100) as "NN%", or em dash. */
export function fmtPct(n: number | null): string {
  return n === null ? "—" : `${Math.round(n)}%`;
}

/** Rating colour bucket mirroring the bot scoreboard thresholds. */
export function ratingClass(n: number | null): "g" | "y" | "r" | "" {
  if (n === null) return "";
  if (n >= 1.1) return "g";
  if (n >= 0.85) return "y";
  return "r";
}
```

`src/components/format.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { fmt, fmtPct, ratingClass } from "./format";

describe("format helpers", () => {
  it("fmt", () => {
    expect(fmt(1.2345)).toBe("1.23");
    expect(fmt(null)).toBe("—");
  });
  it("fmtPct", () => {
    expect(fmtPct(74.6)).toBe("75%");
    expect(fmtPct(null)).toBe("—");
  });
  it("ratingClass buckets", () => {
    expect(ratingClass(1.2)).toBe("g");
    expect(ratingClass(0.9)).toBe("y");
    expect(ratingClass(0.5)).toBe("r");
    expect(ratingClass(null)).toBe("");
  });
});
```

Update `vitest.config.ts` `include` to also match components:
```ts
include: ["src/**/*.test.ts"],
coverage: { include: ["src/lib/**/*.ts", "src/components/format.ts"], exclude: ["src/**/*.test.ts"], thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } },
```

Run: `npm test -- format`
Expected: PASS (3 tests).

- [ ] **Step 2: Replace `src/app/globals.css` with the glass theme**

```css
@import "tailwindcss";

:root {
  --txt: #eaf2f8;
  --muted: #9fb4c6;
  --red: #ff4655;
  --red2: #ff7a85;
  --cyan: #3fe0d0;
  --gold: #ffd166;
  --green: #36e58f;
  --yellow: #ffd166;
  --glass: rgba(255, 255, 255, 0.06);
  --line: rgba(255, 255, 255, 0.14);
}

html, body { margin: 0; padding: 0; }
body {
  min-height: 100vh;
  color: var(--txt);
  background: #05080d;
  font-family: var(--font-inter), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* animated colour orbs behind the frosted glass */
.bgfx { position: fixed; inset: 0; z-index: -2; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55;
  animation: float 18s ease-in-out infinite; }
.orb.a { width: 520px; height: 520px; background: #ff4655; top: -120px; left: -80px; }
.orb.b { width: 480px; height: 480px; background: #3f1efe; top: 20%; right: -120px; animation-delay: -6s; }
.orb.c { width: 440px; height: 440px; background: #1fd6c4; bottom: -140px; left: 25%; animation-delay: -11s; }
.orb.d { width: 360px; height: 360px; background: #ffb13d; bottom: 10%; right: 18%; opacity: .35; animation-delay: -3s; }
@keyframes float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.08); } }
.grain { position: fixed; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 50%, transparent, #05080d 90%); }

.glass {
  background: var(--glass);
  border: 1px solid var(--line);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border-radius: 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.10);
}

.g { color: var(--green); }
.y { color: var(--yellow); }
.r { color: var(--red2); }
```

- [ ] **Step 3: Write the Navbar (logo · search left · nav right · login)**

`src/components/Navbar.tsx`:
```tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="glass" style={{
      position: "sticky", top: 14, zIndex: 5, display: "flex", alignItems: "center",
      gap: 18, margin: "14px auto 0", maxWidth: 1100, padding: "12px 22px", borderRadius: 16,
    }}>
      <Link href="/" style={{ fontFamily: "var(--font-teko)", fontSize: 28, fontWeight: 700, letterSpacing: 1, color: "var(--txt)", textDecoration: "none" }}>
        THE <b style={{ color: "var(--red)" }}>HUB</b>
      </Link>
      <input
        placeholder="🔍  Search player…"
        style={{
          background: "rgba(255,255,255,.05)", border: "1px solid var(--line)",
          borderRadius: 999, padding: "8px 16px", color: "var(--muted)", fontSize: 12, minWidth: 240,
        }}
      />
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
```
> Note: the search box and Login button are non-functional in this plan; they are wired up in Plans 2 and 3.

- [ ] **Step 4: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, Teko } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const teko = Teko({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-teko" });

export const metadata: Metadata = {
  title: "The Hub — Valorant 10mans Stats",
  description: "Stats, leaderboards and profiles for the Fast Learner x The Hub community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${teko.variable}`}>
        <div className="bgfx">
          <div className="orb a" /><div className="orb b" /><div className="orb c" /><div className="orb d" />
        </div>
        <div className="grain" />
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build + tests**

Run: `npm run build && npm test`
Expected: build succeeds; all unit tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: glassmorphism theme, root layout and navbar"
```

---

### Task 9: Reusable StatRow formatting + Leaderboards page `/`

**Files:**
- Create: `src/app/page.tsx` (replaces the starter page)
- Create: `src/components/QueueTabs.tsx`

The home page shows one leaderboard per queue via a `?queue=` search param
(default `pro`), sorted by ELO with the 7-day activity filter.

- [ ] **Step 1: Write the queue tabs component**

`src/components/QueueTabs.tsx`:
```tsx
import Link from "next/link";
import { QUEUE_TYPES, QUEUE_LABELS, type QueueType } from "@/lib/db/types";

export default function QueueTabs({ active, basePath }: { active: QueueType; basePath: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      {QUEUE_TYPES.map((q) => {
        const on = q === active;
        return (
          <Link key={q} href={`${basePath}?queue=${q}`} style={{
            fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 999, textDecoration: "none",
            color: on ? "#fff" : "var(--muted)",
            background: on ? "linear-gradient(135deg,var(--red),#d8323f)" : "rgba(255,255,255,.06)",
            border: on ? "1px solid transparent" : "1px solid var(--line)",
          }}>{QUEUE_LABELS[q]}</Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write the home page**

`src/app/page.tsx`:
```tsx
import { getQueueStatLines } from "@/lib/db/players";
import { rankLeaderboard } from "@/lib/stats/leaderboard";
import { QUEUE_TYPES, type QueueType } from "@/lib/db/types";
import { fmt } from "@/components/format";
import QueueTabs from "@/components/QueueTabs";

export const revalidate = 60;

function parseQueue(v: string | undefined): QueueType {
  return (QUEUE_TYPES as string[]).includes(v ?? "") ? (v as QueueType) : "pro";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const queue = parseQueue((await searchParams).queue);
  const lines = rankLeaderboard(await getQueueStatLines(queue, { minGames: 1 }));

  return (
    <>
      <div className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "20px 4px 12px" }}>
        Leaderboard
      </div>
      <QueueTabs active={queue} basePath="/" />
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["#", "Player", "ELO", "W-L", "Rating", "Games"].map((h, i) => (
                <th key={h} style={{
                  textAlign: i <= 1 ? "left" : "right", padding: "13px 12px", color: "var(--muted)",
                  fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 20, color: "var(--muted)" }}>No active players in this queue.</td></tr>
            )}
            {lines.map((l, i) => (
              <tr key={l.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <td style={{ padding: "11px 12px", color: i < 3 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: "11px 12px", fontWeight: 700 }}>{l.name}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: "var(--gold)", fontWeight: 700 }}>{l.elo}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{l.wins}-{l.losses}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(l.rating)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{l.games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds; `/` is a dynamic route.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: leaderboards home page with queue tabs"
```

---

### Task 10: Stats page `/stats` (sortable client table)

**Files:**
- Create: `src/app/stats/page.tsx` (server: loads data)
- Create: `src/components/StatsTable.tsx` (client: sorting + min-games)

- [ ] **Step 1: Write the client table component**

`src/components/StatsTable.tsx`:
```tsx
"use client";
import { useState, useMemo } from "react";
import type { PlayerStatLine } from "@/lib/stats/derive";
import { fmt, fmtPct, ratingClass } from "@/components/format";

type Key = "name" | "games" | "rating" | "adr" | "kd" | "kastPct" | "kpr" | "apr" | "fkpr" | "hsPct" | "elo";

const COLS: { key: Key; label: string; left?: boolean }[] = [
  { key: "name", label: "Player", left: true },
  { key: "games", label: "GP" },
  { key: "rating", label: "Rating" },
  { key: "adr", label: "ADR" },
  { key: "kd", label: "K/D" },
  { key: "kastPct", label: "KAST" },
  { key: "kpr", label: "KPR" },
  { key: "apr", label: "APR" },
  { key: "fkpr", label: "FKPR" },
  { key: "hsPct", label: "HS%" },
  { key: "elo", label: "ELO" },
];

export default function StatsTable({ lines }: { lines: PlayerStatLine[] }) {
  const [sortKey, setSortKey] = useState<Key>("rating");
  const [minGames, setMinGames] = useState(10);

  const rows = useMemo(() => {
    const filtered = lines.filter((l) => l.games >= minGames);
    return filtered.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      return (bv ?? -Infinity) - (av ?? -Infinity);
    });
  }, [lines, sortKey, minGames]);

  function cell(key: Key, l: PlayerStatLine) {
    switch (key) {
      case "name": return l.name;
      case "games": return l.games;
      case "elo": return l.elo;
      case "kastPct": return fmtPct(l.kastPct);
      case "hsPct": return fmtPct(l.hsPct);
      case "adr": return fmt(l.adr, 0);
      case "rating": return fmt(l.rating);
      default: return fmt(l[key] as number | null);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12 }}>
          Min games:{" "}
          <select value={minGames} onChange={(e) => setMinGames(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,.06)", color: "var(--txt)", border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px" }}>
            <option value={0}>0</option><option value={10}>10</option><option value={20}>20</option>
          </select>
        </label>
      </div>
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} onClick={() => setSortKey(c.key)} style={{
                  textAlign: c.left ? "left" : "right", padding: "13px 12px", cursor: "pointer",
                  color: sortKey === c.key ? "#fff" : "var(--muted)", fontSize: 11,
                  textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap",
                }}>{c.label}{sortKey === c.key ? " ▼" : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ padding: 20, color: "var(--muted)" }}>No players match this filter.</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                {COLS.map((c) => (
                  <td key={c.key} className={c.key === "rating" ? ratingClass(l.rating) : ""} style={{
                    textAlign: c.left ? "left" : "right", padding: "11px 12px",
                    fontWeight: c.key === "name" || c.key === "rating" || c.key === "elo" ? 700 : 400,
                    color: c.key === "elo" ? "var(--gold)" : undefined, whiteSpace: "nowrap",
                  }}>{cell(c.key, l)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Write the server page**

`src/app/stats/page.tsx`:
```tsx
import { getQueueStatLines } from "@/lib/db/players";
import { QUEUE_TYPES, type QueueType } from "@/lib/db/types";
import QueueTabs from "@/components/QueueTabs";
import StatsTable from "@/components/StatsTable";

export const revalidate = 60;

function parseQueue(v: string | undefined): QueueType {
  return (QUEUE_TYPES as string[]).includes(v ?? "") ? (v as QueueType) : "pro";
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const queue = parseQueue((await searchParams).queue);
  const lines = await getQueueStatLines(queue, { minGames: 0 });

  return (
    <>
      <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "20px 4px 12px" }}>
        Stats — all players by queue
      </div>
      <QueueTabs active={queue} basePath="/stats" />
      <StatsTable lines={lines} />
    </>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: stats page with sortable client table and min-games filter"
```

---

### Task 11: E2E smoke test (Playwright)

**Files:**
- Create: `e2e/serve.mjs` (boots in-memory Mongo, seeds it, then spawns `next dev` with `MONGO_URL` set — single process, cross-platform, no ordering issues)
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`

Because the app needs a Mongo to render, a single Node launcher starts
`mongodb-memory-server`, seeds it, and spawns the dev server with the right
`MONGO_URL` — all in one process so there is no Mongo/server start-order race
and nothing depends on a shell. Playwright's `webServer` runs this launcher.

- [ ] **Step 1: Write the launcher (boots Mongo + seeds + starts Next)**

`e2e/serve.mjs`:
```js
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { spawn } from "node:child_process";

const mem = await MongoMemoryServer.create();
const uri = mem.getUri();
const client = await new MongoClient(uri).connect();
const db = client.db("elobot");
const now = new Date();
await db.collection("player_rating_aggregates").insertMany([
  { _id: "1:pro", user_id: "1", queue_type: "pro", games: 20, rounds_played: 300, kills: 300, deaths: 240, assists: 90, damage_made: 48000, damage_received: 42000, headshots: 150, bodyshots: 250, legshots: 40, multikills_2k: 0, multikills_3k: 0, multikills_4k: 0, multikills_5k: 0, first_kills: 40, first_deaths: 25, kast_rounds: 230, rating_2_0_sum: 26, updated_at: now },
  { _id: "2:pro", user_id: "2", queue_type: "pro", games: 18, rounds_played: 280, kills: 240, deaths: 250, assists: 80, damage_made: 38000, damage_received: 40000, headshots: 110, bodyshots: 240, legshots: 40, multikills_2k: 0, multikills_3k: 0, multikills_4k: 0, multikills_5k: 0, first_kills: 30, first_deaths: 30, kast_rounds: 190, rating_2_0_sum: 18, updated_at: now },
]);
await db.collection("elo").insertMany([
  { _id: "1:pro", user_id: "1", queue_type: "pro", elo: 2300, wins: 12, losses: 8, name: "Alpha" },
  { _id: "2:pro", user_id: "2", queue_type: "pro", elo: 2100, wins: 9, losses: 9, name: "Bravo" },
]);
await client.close();

const next = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MONGO_URL: uri },
});

async function shutdown() {
  next.kill();
  await mem.stop();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

- [ ] **Step 2: Write the Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "node e2e/serve.mjs",
    url: "http://localhost:3000",
    timeout: 120000,
    reuseExistingServer: false,
  },
});
```

- [ ] **Step 3: Write the smoke test**

`e2e/smoke.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("leaderboard renders and shows top player", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Leaderboard")).toBeVisible();
  await expect(page.getByText("Alpha")).toBeVisible();
});

test("stats page sorts by column", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByText("Alpha")).toBeVisible();
  await page.getByText("ELO", { exact: false }).first().click();
  // Alpha (2300) should be first row after sorting by ELO desc
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toContainText("Alpha");
});
```

- [ ] **Step 4: Run E2E**

Run: `npm run e2e`
Expected: 2 passing tests.

- [ ] **Step 5: Ignore Playwright artifacts, commit**

```bash
printf "test-results/\nplaywright-report/\n" >> .gitignore
git add -A
git commit -m "test: Playwright E2E smoke for leaderboard and stats"
```

---

### Task 12: Document local dev in the README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with setup instructions**

```markdown
# The Hub — Stats & Profiles Website

Next.js companion site for the Fast Learner x The Hub Valorant 10mans bot.
Reads the bot's local MongoDB (`elobot`) and surfaces leaderboards, stats and
profiles. See `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Local development

```bash
npm install
cp .env.example .env   # set MONGO_URL to the bot's MongoDB
npm run dev            # http://localhost:3000
```

## Environment

| Name        | Description                          |
|-------------|--------------------------------------|
| `MONGO_URL` | MongoDB connection string (`elobot`) |

(Discord auth variables are added in a later plan.)

## Scripts

- `npm test` — unit/integration (Vitest)
- `npm run e2e` — end-to-end (Playwright)
- `npm run build` — production build
```

- [ ] **Step 2: Create `.env.example`**

```
MONGO_URL=mongodb://localhost:27017
```

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: local dev setup for the website"
```

---

## Plan 1 Definition of Done

- `npm test` green with ≥80% coverage on `src/lib/**` and `format.ts`.
- `npm run build` succeeds.
- `npm run e2e` green.
- Visiting `/` shows per-queue leaderboards (ELO sorted, 7-day active filter).
- Visiting `/stats` shows a sortable per-queue stats table with a min-games filter.
- Glassmorphism theme + navbar (search left, nav right) rendered.
- No writes to any bot collection.

## What Plan 1 deliberately defers

- Player profile pages, match detail pages, working search → **Plan 2**.
- Discord login, `/me`, `web_profiles` writes → **Plan 3**.
- Apache vhost, PM2, CI/CD → **Plan 4**.
```
