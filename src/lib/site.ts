/**
 * Public origin of the site, used for absolute URLs (robots.txt, sitemap).
 * Falls back to AUTH_URL (already set per environment) then to production.
 */
export const SITE_URL = (
  process.env.SITE_URL ??
  process.env.AUTH_URL ??
  "https://flhub.pro"
).replace(/\/$/, "");
