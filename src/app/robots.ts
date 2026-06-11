import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /me is auth-gated, /api is machine-only. /search is intentionally NOT
      // disallowed: the JSON-LD SearchAction (sitelinks search box) targets it,
      // so crawlers must be able to reach it. The result pages are kept out of
      // the index via a page-level `robots: { index: false, follow: true }`.
      disallow: ["/me", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
