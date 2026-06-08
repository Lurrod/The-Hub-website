# The Hub — Stats & Profiles Website

Next.js companion site for the Fast Learner x The Hub Valorant 10mans bot.
Reads the bot's local MongoDB (`elobot`) and surfaces leaderboards, stats and
(in later plans) player profiles. Design & plans live in
`docs/superpowers/specs/` and `docs/superpowers/plans/`.

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
- `npm run dev` — dev server on port 3000

## Status

Plan 1 (foundation & public stats) implemented: glassmorphism theme, MongoDB
data layer, stat-derivation library, Leaderboards (`/`) and Stats (`/stats`)
pages. Profiles, match history, Discord login and deployment follow in
Plans 2–4.
