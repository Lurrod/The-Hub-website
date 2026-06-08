// Local preview launcher: boots an in-memory MongoDB, seeds demo players
// across all four queues, then starts `next dev` pointed at it.
// Usage: npm run dev:demo   (no local MongoDB required)
//
// This is ONLY for local preview. In production the site connects to the
// bot's real `elobot` database via MONGO_URL.
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
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
      acs_sum: Math.round(150 + skill * 130) * games,
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
const DEMO_MID = new ObjectId("0123456789abcdef0123dead");
const dhex = DEMO_MID.toHexString();
const demoWhen = new Date(Date.now() - 3600 * 1000);
await db.collection("matches").insertOne({
  _id: DEMO_MID, queue_type: "pro", map: "Haven", status: "validated_a", match_number: 1,
  created_at: demoWhen,
  // 5v5 with deliberately varied name lengths to stress-test scoreboard alignment.
  team_a: [
    { id: "100", name: "Zephyr" },
    { id: "101", name: "Ka" },
    { id: "102", name: "SuperLongPlayerName" },
    { id: "103", name: "Nova" },
    { id: "104", name: "Vyn" },
  ],
  team_b: [
    { id: "105", name: "Cypher" },
    { id: "106", name: "xX_Sniper_Xx_2024" },
    { id: "107", name: "Mo" },
    { id: "108", name: "Frostbite" },
    { id: "109", name: "Killjoy" },
  ],
  score_a: 13, score_b: 7,
  rounds: ["a","a","b","a","a","b","a","a","b","a","a","b","a","a","b","a","a","b","a","b"]
    .map((w) => ({ winner: w, end: w === "a" ? "Eliminated" : "Bomb defused" })),
  elo_results: {
    "100": { delta: 24, old: 2276, new: 2300, win: true },
    "101": { delta: 22, old: 2078, new: 2100, win: true },
    "102": { delta: 26, old: 2274, new: 2300, win: true },
    "103": { delta: 18, old: 1982, new: 2000, win: true },
    "104": { delta: 20, old: 1980, new: 2000, win: true },
    "105": { delta: -16, old: 2216, new: 2200, win: false },
    "106": { delta: -20, old: 2120, new: 2100, win: false },
    "107": { delta: -22, old: 1922, new: 1900, win: false },
    "108": { delta: -15, old: 1965, new: 1950, win: false },
    "109": { delta: -18, old: 2018, new: 2000, win: false },
  },
});
const dp = (uid, agent, win, acs, rating, k, d, a, hs = 28) => ({
  _id: `${dhex}:${uid}`, match_id: dhex, user_id: String(uid), queue_type: "pro", map: "Haven", agent,
  rounds_played: 20, win, kills: k, deaths: d, assists: a,
  damage_made: Math.round(acs * 14), damage_received: Math.round(acs * 12),
  headshots: hs, bodyshots: 55, legshots: 8,
  first_kills: Math.max(0, Math.round((acs - 180) / 45)), first_deaths: 2,
  kast_rounds: Math.min(20, Math.round(12 + rating * 4)),
  acs, rating_2_0: rating, created_at: demoWhen,
});
await db.collection("match_player_stats").insertMany([
  dp(100, "Jett", true, 281, 1.41, 24, 13, 6, 41),
  dp(101, "Raze", true, 233, 1.26, 18, 13, 9, 40),
  dp(102, "Omen", true, 256, 1.31, 18, 11, 5, 17),
  dp(103, "Sova", true, 198, 1.10, 15, 14, 8, 33),
  dp(104, "Killjoy", true, 176, 1.04, 13, 12, 7, 24),
  dp(105, "Reyna", false, 211, 1.05, 17, 16, 2, 42),
  dp(106, "Astra", false, 184, 0.93, 14, 15, 6, 19),
  dp(107, "Cypher", false, 160, 0.79, 11, 16, 5, 34),
  dp(108, "Sage", false, 138, 0.74, 9, 15, 8, 22),
  dp(109, "Yoru", false, 120, 0.66, 8, 17, 3, 18),
]);
// An in-progress (pending) match for the /matches page.
const LIVE_MID = new ObjectId("0123456789abcdef0000aa01");
await db.collection("matches").insertOne({
  _id: LIVE_MID, queue_type: "pro", map: "Bind", status: "pending", match_number: 2,
  created_at: new Date(Date.now() - 12 * 60 * 1000),
  team_a: [
    { id: "100", name: "Zephyr", elo: 2300 }, { id: "101", name: "Ka", elo: 2100 },
    { id: "102", name: "SuperLongPlayerName", elo: 2280 }, { id: "103", name: "Nova", elo: 1990 }, { id: "104", name: "Vyn", elo: 2010 },
  ],
  team_b: [
    { id: "105", name: "Cypher", elo: 2200 }, { id: "106", name: "xX_Sniper_Xx_2024", elo: 2120 },
    { id: "107", name: "Mo", elo: 1900 }, { id: "108", name: "Frostbite", elo: 1965 }, { id: "109", name: "Killjoy", elo: 2020 },
  ],
});
const LIVE_MID2 = new ObjectId("0123456789abcdef0000aa02");
await db.collection("matches").insertOne({
  _id: LIVE_MID2, queue_type: "semipro", map: "Lotus", status: "pending", match_number: 3,
  created_at: new Date(Date.now() - 4 * 60 * 1000),
  team_a: [
    { id: "200", name: "Rho", elo: 2150 }, { id: "201", name: "Sigma", elo: 2080 }, { id: "202", name: "Tau", elo: 1990 },
    { id: "203", name: "Upsilon", elo: 1950 }, { id: "204", name: "Phi", elo: 1900 },
  ],
  team_b: [
    { id: "205", name: "Chi", elo: 2110 }, { id: "206", name: "Psi", elo: 2040 }, { id: "207", name: "Omega", elo: 1980 },
    { id: "208", name: "Iota", elo: 1930 }, { id: "209", name: "Theta", elo: 1890 },
  ],
});
// Plenty of extra fake in-progress matches so the rows overflow (slider arrows).
const MAPS = ["Ascent", "Bind", "Haven", "Split", "Lotus", "Sunset", "Icebox", "Breeze", "Abyss"];
const proA = [
  { id: "100", name: "Zephyr", elo: 2300 }, { id: "101", name: "Ka", elo: 2100 },
  { id: "102", name: "SuperLongPlayerName", elo: 2280 }, { id: "103", name: "Nova", elo: 1990 }, { id: "104", name: "Vyn", elo: 2010 },
];
const proB = [
  { id: "105", name: "Cypher", elo: 2200 }, { id: "106", name: "xX_Sniper_Xx_2024", elo: 2120 },
  { id: "107", name: "Mo", elo: 1900 }, { id: "108", name: "Frostbite", elo: 1965 }, { id: "109", name: "Killjoy", elo: 2020 },
];
const semiA = [
  { id: "200", name: "Rho", elo: 2150 }, { id: "201", name: "Sigma", elo: 2080 }, { id: "202", name: "Tau", elo: 1990 },
  { id: "203", name: "Upsilon", elo: 1950 }, { id: "204", name: "Phi", elo: 1900 },
];
const semiB = [
  { id: "205", name: "Chi", elo: 2110 }, { id: "206", name: "Psi", elo: 2040 }, { id: "207", name: "Omega", elo: 1980 },
  { id: "208", name: "Iota", elo: 1930 }, { id: "209", name: "Theta", elo: 1890 },
];
const extra = [];
function pushFake(prefix, queue, a, bteam, count, startNum) {
  for (let i = 0; i < count; i++) {
    const hx = (i + 1).toString(16).padStart(2, "0");
    extra.push({
      _id: new ObjectId(`0123456789abcdef0000${prefix}${hx}`),
      queue_type: queue, map: MAPS[i % MAPS.length], status: "pending",
      match_number: startNum + i, created_at: new Date(Date.now() - (i + 1) * 6 * 60 * 1000),
      team_a: a, team_b: bteam,
    });
  }
}
pushFake("b1", "pro", proA, proB, 9, 20);
pushFake("b2", "semipro", semiA, semiB, 4, 40);
await db.collection("matches").insertMany(extra);
// Fake customized profiles (web_profiles) so player pages show the header.
await db.collection("web_profiles").insertMany([
  {
    _id: "100",
    bio: "Duelist main, occasional IGL. Entry or nothing. Catch me live on Twitch most evenings.",
    favorite_agent: "Jett", favorite_role: "Duelist", favorite_map: "Ascent",
    socials: { twitch: "zephyr", twitter: "zephyrvalo", youtube: "https://youtube.com/@zephyr" },
    vlr_url: "https://vlr.gg/player/12345/zephyr",
    tracker_url: "https://tracker.gg/valorant/profile/riot/Zephyr%23EUW/overview",
  },
  {
    _id: "101",
    bio: "Sentinel diff. Lurk specialist.",
    favorite_agent: "Killjoy", favorite_role: "Sentinel",
    socials: { twitter: "ka_valo" },
    tracker_url: "https://tracker.gg/valorant/profile/riot/Ka%231234/overview",
  },
  {
    _id: "102",
    bio: "Controller. Smokes on demand, clutches on request.",
    favorite_agent: "Omen", favorite_role: "Controller", favorite_map: "Bind",
    socials: { twitch: "longname", youtube: "https://youtube.com/@longname" },
    vlr_url: "https://vlr.gg/player/999/longname",
  },
]);
await client.close();

console.log(`[dev:demo] Seeded ${allAggs.length} players across ${plan.length} queues.`);
console.log(`[dev:demo] In-memory MongoDB at ${uri}`);
console.log(`[dev:demo] Starting Next.js dev on http://localhost:3000 …`);

const next = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MONGO_URL: uri, AUTH_SECRET: "dev-demo-secret-not-real-0123456789abcdef" },
});

async function shutdown() {
  next.kill();
  await mem.stop();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
next.on("exit", shutdown);
