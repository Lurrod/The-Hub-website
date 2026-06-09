import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /me is auth-gated, /api is machine-only, /search is parameterized noise.
      disallow: ["/me", "/api/", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
