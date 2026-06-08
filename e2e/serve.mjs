import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
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
const MID = new ObjectId("0123456789abcdef01234567");
const hex = MID.toHexString();
await db.collection("matches").insertOne({
  _id: MID, queue_type: "pro", map: "Ascent", status: "validated_a", match_number: 1,
  created_at: now,
  team_a: [{ id: "1", name: "Alpha" }], team_b: [{ id: "2", name: "Bravo" }],
  score_a: 13, score_b: 9,
  elo_results: { "1": { delta: 22, old: 2278, new: 2300, win: true }, "2": { delta: -18, old: 2118, new: 2100, win: false } },
});
const pstat = (uid, agent, win, acs, rating) => ({
  _id: `${hex}:${uid}`, match_id: hex, user_id: uid, queue_type: "pro", map: "Ascent", agent,
  rounds_played: 22, win, kills: 20, deaths: 14, assists: 5, damage_made: 3300, damage_received: 3000,
  headshots: 40, bodyshots: 60, legshots: 10, first_kills: 3, first_deaths: 2, kast_rounds: 17,
  acs, rating_2_0: rating, created_at: now,
});
await db.collection("match_player_stats").insertMany([
  pstat("1", "Jett", true, 281, 1.41),
  pstat("2", "Omen", false, 180, 0.92),
]);
await client.close();

const next = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MONGO_URL: uri, AUTH_SECRET: "e2e-test-secret-not-real-0123456789abcdef" },
});

async function shutdown() {
  next.kill();
  await mem.stop();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
