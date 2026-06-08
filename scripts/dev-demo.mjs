// Local preview launcher: boots an in-memory MongoDB, seeds demo players
// across all four queues, then starts `next dev` pointed at it.
// Usage: npm run dev:demo   (no local MongoDB required)
//
// This is ONLY for local preview. In production the site connects to the
// bot's real `elobot` database via MONGO_URL.
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { spawn } from "node:child_process";

const NAMES = [
  "Zephyr", "Nova", "Kairo", "Frost", "Ace", "Vyse", "Echo", "Riven",
  "Sova", "Jett", "Omen", "Sage", "Reyna", "Cypher", "Phoenix", "Breach",
  "Killjoy", "Skye", "Yoru", "Astra", "Neon", "Fade", "Chamber", "Gekko",
];

/** Build coherent aggregate + elo docs from a single `skill` factor (~0.55–1.4). */
function makePlayer(userId, queue, name, skill, daysAgo) {
  const games = 12 + Math.round(skill * 18);
  const rounds = games * 22;
  const kpr = 0.55 + skill * 0.35;
  const dpr = Math.max(0.45, 0.95 - skill * 0.25);
  const apr = 0.22 + (1 - Math.abs(skill - 1)) * 0.18;
  const adr = 110 + skill * 70;
  const kast = Math.min(0.86, 0.6 + skill * 0.18);
  const hsRate = 0.18 + skill * 0.14;
  const ratingAvg = 0.7 + skill * 0.5;

  const kills = Math.round(kpr * rounds);
  const deaths = Math.round(dpr * rounds);
  const assists = Math.round(apr * rounds);
  const damage = Math.round(adr * rounds);
  const headshots = Math.round(kills * hsRate * 2.2);
  const bodyshots = Math.round(headshots * 1.9);
  const legshots = Math.round(headshots * 0.4);
  const kastRounds = Math.round(kast * rounds);
  const firstKills = Math.round(0.10 * rounds * (0.6 + skill * 0.8));
  const firstDeaths = Math.round(0.10 * rounds * (1.4 - skill * 0.6));
  const id = `${userId}:${queue}`;
  const wins = Math.round(games * (0.4 + skill * 0.2));

  return {
    agg: {
      _id: id, user_id: String(userId), queue_type: queue,
      games, rounds_played: rounds, kills, deaths, assists,
      damage_made: damage, damage_received: Math.round(damage * 0.95),
      headshots, bodyshots, legshots,
      multikills_2k: Math.round(games * 0.8), multikills_3k: Math.round(games * 0.2),
      multikills_4k: Math.round(games * 0.05), multikills_5k: 0,
      first_kills: firstKills, first_deaths: firstDeaths,
      kast_rounds: kastRounds, rating_2_0_sum: Number((ratingAvg * games).toFixed(2)),
      updated_at: new Date(Date.now() - daysAgo * 24 * 3600 * 1000),
    },
    elo: {
      _id: id, user_id: String(userId), queue_type: queue,
      elo: Math.round(1700 + skill * 600), wins, losses: games - wins, name,
    },
  };
}

function seedForQueue(queue, count, startId) {
  const aggs = [];
  const elos = [];
  for (let i = 0; i < count; i++) {
    // spread skill from high to low, with a little variance per index
    const skill = 1.4 - (i / count) * 0.85 + ((i % 3) - 1) * 0.04;
    const name = NAMES[(startId + i) % NAMES.length] + (startId + i >= NAMES.length ? "2" : "");
    // make the 2nd player of each queue "inactive" (>7 days) to show the leaderboard filter
    const daysAgo = i === 1 ? 10 : i % 5;
    const { agg, elo } = makePlayer(startId + i, queue, name, Math.max(0.5, skill), daysAgo);
    aggs.push(agg);
    elos.push(elo);
  }
  return { aggs, elos };
}

const mem = await MongoMemoryServer.create();
const uri = mem.getUri();
const client = await new MongoClient(uri).connect();
const db = client.db("elobot");

const plan = [
  ["pro", 14, 100],
  ["semipro", 10, 200],
  ["open", 8, 300],
  ["gc", 6, 400],
];
const allAggs = [];
const allElos = [];
for (const [queue, count, startId] of plan) {
  const { aggs, elos } = seedForQueue(queue, count, startId);
  allAggs.push(...aggs);
  allElos.push(...elos);
}
await db.collection("player_rating_aggregates").insertMany(allAggs);
await db.collection("elo").insertMany(allElos);
await client.close();

console.log(`[dev:demo] Seeded ${allAggs.length} players across ${plan.length} queues.`);
console.log(`[dev:demo] In-memory MongoDB at ${uri}`);
console.log(`[dev:demo] Starting Next.js dev on http://localhost:3000 …`);

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
next.on("exit", shutdown);
