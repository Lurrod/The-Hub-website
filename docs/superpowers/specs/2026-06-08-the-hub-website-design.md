# The Hub — Stats & Profiles Website — Design

**Date:** 2026-06-08
**Status:** Approved (design) — pending implementation plan
**Companion project:** `The Hub x Fast Learner` (Valorant 10mans Discord bot)

---

## 1. Goal

A public website to explore the Valorant 10mans community's stats and player
profiles, backed by the data the Discord bot already produces. Members can log
in with Discord to view and customize their own profile.

The bot is **not modified**. The website is a separate process that **reads**
the bot's MongoDB collections and **writes only** to one new collection
(`web_profiles`).

### v1 scope (all in one release)

- Leaderboards (4 queues: Pro / Semi Pro / Open / GC)
- A vlr.gg-style **Stats** page: sortable table of all players per queue
- **Player profiles** with stats, ELO, aggregates and recent match history
- **Match detail** pages (full 10-player scoreboard)
- **Discord login** restricted to members of the community server
- **Profile customization** for the logged-in player

Site language: **English**.

---

## 2. Architecture & Deployment

```
                Kimsufi server (OVH)
  Apache (HTTPS, VirtualHost)  ──►  Next.js (PM2, :3000)
   mod_proxy / certbot                      │
                                            ▼
                              MongoDB local (already running)
              shared bot collections (read) + web_profiles (read/write)
```

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS, deployed with
  **PM2** on the same Kimsufi server as the bot.
- **Reverse proxy:** **Apache** (`mod_proxy` / `mod_proxy_http`), HTTPS via
  `certbot --apache`, a `VirtualHost` that `ProxyPass` to the local Next.js on
  port 3000.
- **Data access:** the official `mongodb` Node driver connects to the **local**
  MongoDB. Read-only for bot data; writes only to `web_profiles`.
- **CI/CD:** a GitHub Actions workflow (separate from the bot's) builds and
  `pm2 reload`s the site on push to `main`.
- Both processes (bot + site) coexist on the server and share the database.

---

## 3. Pages & Navigation

| Page         | Route            | Content                                                                                          | Access            |
|--------------|------------------|--------------------------------------------------------------------------------------------------|-------------------|
| Leaderboards | `/`              | The 4 rankings (Pro / Semi Pro / Open / GC), player search                                       | Public            |
| Stats        | `/stats`         | Sortable table of all players in a queue, one stat line per player (vlr.gg style), filters       | Public            |
| Player       | `/player/[id]`   | Stats, ELO per queue, aggregates, recent match history, customization (bio, agent, socials, links)| Public            |
| Match        | `/match/[id]`    | Full 10-player scoreboard, teams, map, result, ELO +/-                                            | Public            |
| My profile   | `/me`            | Edit own bio, favorite agent/role/map, socials, VLR/Tracker links                                | Logged-in member  |
| Login        | `/login`         | "Login with Discord" button                                                                       | Public            |

- Top navbar: **logo (left)** · **search (left)** · **nav links (right)** · **Login with Discord** button.
- Stats shown **per queue** with a queue selector, consistent with the bot.
- Player search by name in the top bar.

---

## 4. Data Model

### Collections read (existing, never modified)

| Collection                 | `_id`               | Used for                                                                 |
|----------------------------|---------------------|--------------------------------------------------------------------------|
| `player_rating_aggregates` | `uid:queue_type`    | games, rounds_played, kills, deaths, assists, damage_made, damage_received, headshots/bodyshots/legshots, multikills_2k..5k, first_kills, first_deaths, kast_rounds, rating_2_0_sum |
| `elo`                      | `uid:queue_type`    | elo, wins, losses, name, queue_type                                      |
| `matches`                  | ObjectId            | match history: team_a/team_b, map, status, votes, henrik_multipliers, created_at |
| `match_player_stats`       | `match_id:uid`      | per-match per-player scoreboard line                                     |
| `riot`                     | `uid`               | riot_name, riot_tag, riot_region, peak_elo                              |

### New collection `web_profiles` (the only thing the site writes)

`_id = discord_user_id` (string)

```
bio:            string (<= 280 chars)
favorite_agent: string (allowlist)
favorite_role:  string (allowlist: Duelist | Initiator | Controller | Sentinel)
favorite_map:   string (allowlist, optional)
socials:        { twitch?: string, twitter?: string, youtube?: string }
vlr_url:        string (must be on vlr.gg)
tracker_url:    string (must be on tracker.gg)
updated_at:     Date
```

- Avatar and display name are taken from Discord / Riot, **not** stored here.
- A `web_profiles` doc is created lazily the first time a player edits `/me`.

### Derived stats (computed on the fly from aggregates)

Per player+queue, from `player_rating_aggregates` (+ `elo`):

| Column   | Formula                                                |
|----------|--------------------------------------------------------|
| Rating 2.0 | `rating_2_0_sum / games`                             |
| ADR      | `damage_made / rounds_played`                          |
| K/D      | `kills / deaths` (deaths guarded)                      |
| KAST%    | `kast_rounds / rounds_played * 100`                    |
| KPR      | `kills / rounds_played`                                |
| APR      | `assists / rounds_played`                              |
| FKPR     | `first_kills / rounds_played`                          |
| FDPR     | `first_deaths / rounds_played`                         |
| HS%      | `headshots / (headshots + bodyshots + legshots) * 100` |
| ELO / W-L | from `elo` doc                                        |
| Games    | `games`                                                |

All formulas guard against division by zero (0 games / 0 rounds → display `—`).

> **ACS note:** the bot does not persist ACS, so it is intentionally **not**
> shown. ADR + Rating 2.0 cover the same intent with data we already have.
> Adding ACS later would require the bot to persist it.

Stats table: sortable by any column, filter by queue + a minimum-games
threshold selectable among `0` (all) / `10` / `20`, **default `10`** to avoid
tiny-sample noise. The 7-day inactivity hide used by the bot's leaderboard is
**not** applied here — the Stats page lists everyone meeting the games threshold.

---

## 5. Authentication & Security

### Login
- **Auth.js (NextAuth v5)**, **Discord** provider, **JWT** session strategy
  (no session storage in the DB).
- Scopes: `identify guilds`. On sign-in, fetch the user's guild list; if the
  community `GUILD_ID` is absent → **deny** ("members of the server only").
- JWT carries: Discord id, username, avatar hash. Because the bot keys all data
  by Discord `user_id`, `session.discordId` maps directly to
  `elo` / `player_rating_aggregates` / `riot` / `web_profiles`.

### Authorization
- Only `/me` writes, and only to `web_profiles`, for the session's `discordId`
  (a player can edit **only** their own profile — server action re-checks the
  session id against the target).
- The site **never** modifies bot collections. Recommended: a dedicated MongoDB
  user with `read` everywhere + `readWrite` only on `web_profiles`.

### Input validation & hardening
- **Zod** on `/me` inputs: bio length cap, agent/role/map from allowlists,
  VLR/Tracker links validated against their domains (`vlr.gg`, `tracker.gg`),
  social handles validated → prevents stored XSS / phishing. React escapes
  output by default; external links use `rel="noopener noreferrer"`.
- Secrets in `.env`, never committed: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
  `AUTH_SECRET`, `GUILD_ID`, `MONGO_URL`, bot token (for avatar fetch).
- CSRF handled by Auth.js + server-action origin checks. Basic rate limiting on
  profile writes and search.
- **Avatars** fetched from Discord (via the bot token, server-side, cached);
  default placeholder until available.

---

## 6. Error Handling, Performance & Testing

### Errors / empty states
- Player not found → clean 404; DB unavailable → friendly message (no stack
  trace); Discord API failure at login → friendly message.
- Empty states handled: player with no matches, queue with no stats, inactive
  player. Derived stats guarded against division by zero.

### Performance
- Leaderboard/stats queries are indexed; aggregates are one small doc per
  player+queue. Match history is **paginated**.
- Leaderboard & Stats pages cached short (revalidate ~60s, since data changes on
  match validation); profile pages SSR.

### Visual identity
- **Glassmorphism** over an animated colored-orb background: frosted translucent
  navbar, profile hero, stat cards and tables; glowing accents.
- Palette: Valorant **red** (`#ff4655`) dominant + cyan/gold accents.
- Condensed display type (Teko-like) for big numbers and names; Inter for body.
- Rating/KAST cells colored green / yellow / red by threshold, mirroring the
  bot's scoreboard.

### Tests (target 80%+: unit / integration / e2e)
- **Unit:** stat-derivation functions (Rating avg, K/D, ADR, HS%, KAST%,
  KPR/APR/FKPR/FDPR) with edge cases (0 games / 0 rounds).
- **Integration:** data-access layer against `mongodb-memory-server` with
  fixtures; auth guard (membership check, Discord mocked).
- **E2E (Playwright):** browse leaderboard, open a profile, sort the Stats
  table, log in (mocked), edit `/me`.

---

## 7. Out of Scope (v1)

- Custom profile banners (avatar is the Discord one).
- Admin features on the website.
- ACS column (bot does not persist it).
- "Compare two players" and community-wide aggregate stats pages (possible later).
- Hosting anywhere other than the Kimsufi server (MongoDB is local, not exposed).

---

## 8. Environment Variables

| Name                    | Description                                          |
|-------------------------|------------------------------------------------------|
| `MONGO_URL`             | Local MongoDB connection string                      |
| `DISCORD_CLIENT_ID`     | Discord OAuth app client id                          |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app client secret                      |
| `AUTH_SECRET`           | Auth.js session signing secret                       |
| `GUILD_ID`              | Community Discord server id (membership gate)        |
| `DISCORD_BOT_TOKEN`     | Bot token, server-side, for cached avatar fetches    |
| `NEXTAUTH_URL` / `AUTH_URL` | Public site URL                                  |
