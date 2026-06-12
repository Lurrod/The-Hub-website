import { unstable_cache } from "next/cache";
import type { Filter } from "mongodb";
import { getDb } from "./client";
import type { WebProfile } from "./types";
import { isCountryCode } from "@/lib/profile/countries";
import { ageRangeToDobWindow, computeAge } from "@/lib/profile/age";

/** Cache tag for the LFT listing; revalidate with `revalidateTag`. */
export const LFT_PLAYERS_TAG = "lft-players";

const DEFAULT_LIMIT = 100;

export interface LftFilters {
  roles?: string[];
  nationality?: string;
  minAge?: number;
  maxAge?: number;
  query?: string;
}

export interface LftPlayer {
  userId: string;
  username: string;
  avatar: string | null;
  roles: string[];
  nationality?: string;
  age: number | null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the Mongo filter for an LFT query. Pure (no DB) so it is unit-tested.
 * `now` is injected for deterministic age→DOB conversion.
 */
export function buildLftQuery(filters: LftFilters, now: Date): Filter<WebProfile> {
  const q: Filter<WebProfile> = { lft_enabled: true };

  if (filters.roles && filters.roles.length > 0) {
    q.roles = { $in: filters.roles };
  }
  if (filters.nationality && isCountryCode(filters.nationality)) {
    q.nationality = filters.nationality;
  }
  const win = ageRangeToDobWindow(filters.minAge, filters.maxAge, now);
  if (win.gte || win.lte) {
    q.date_of_birth = {
      ...(win.gte ? { $gte: win.gte } : {}),
      ...(win.lte ? { $lte: win.lte } : {}),
    };
  }
  const name = (filters.query ?? "").trim().slice(0, 100);
  if (name.length > 0) {
    q.discord_username = { $regex: escapeRegex(name), $options: "i" };
  }
  return q;
}

/** LFT players matching `filters`, newest opt-ins first. */
export async function getLftPlayers(
  filters: LftFilters,
  limit = DEFAULT_LIMIT,
): Promise<LftPlayer[]> {
  const now = new Date();
  const db = await getDb();
  const docs = await db
    .collection<WebProfile>("web_profiles")
    .find(buildLftQuery(filters, now))
    .sort({ lft_updated_at: -1 })
    .limit(limit)
    .toArray();

  return docs.map((d) => ({
    userId: d._id,
    username: d.discord_username ?? "Unknown",
    avatar: d.discord_avatar ?? null,
    roles: d.roles ?? [],
    nationality: d.nationality || undefined,
    age: computeAge(d.date_of_birth, now),
  }));
}

const cachedLftPlayers = unstable_cache(
  (filters: LftFilters, limit: number) => getLftPlayers(filters, limit),
  [LFT_PLAYERS_TAG],
  { revalidate: 60, tags: [LFT_PLAYERS_TAG] },
);

/** Cached variant for page rendering. */
export async function getCachedLftPlayers(
  filters: LftFilters,
  limit = DEFAULT_LIMIT,
): Promise<LftPlayer[]> {
  return cachedLftPlayers(filters, limit);
}
