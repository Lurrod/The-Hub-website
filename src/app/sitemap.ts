import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSitemapEntries } from "@/lib/db/sitemap";

/** Regenerated hourly; player/match URLs follow the bot's DB without a redeploy. */
export const revalidate = 3600;

const LEGAL_PAGES = ["privacy", "terms", "notice", "cookies"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/leaderboard`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/stats`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/matches`, changeFrequency: "hourly", priority: 0.8 },
    ...LEGAL_PAGES.map((page) => ({
      url: `${SITE_URL}/legal/${page}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  let entries;
  try {
    entries = await getSitemapEntries();
  } catch (error) {
    // DB unreachable (e.g. CI build with a placeholder MONGO_URL): serve the
    // static routes rather than failing the whole sitemap.
    console.error("sitemap: could not enumerate players/matches", error);
    return staticRoutes;
  }

  return [
    ...staticRoutes,
    ...entries.players.map((p) => ({
      url: `${SITE_URL}/player/${p.userId}`,
      lastModified: p.updatedAt ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...entries.matches.map((m) => ({
      url: `${SITE_URL}/match/${m.matchId}`,
      lastModified: m.createdAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
