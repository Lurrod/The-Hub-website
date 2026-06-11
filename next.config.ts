import type { NextConfig } from "next";

// Security headers applied to every response. CSP allows: self, inline styles
// (Tailwind/next inject style attributes), the Discord & flagcdn image CDNs used
// by next/image, and Google Fonts served self-hosted by next/font (data: covers
// the woff2 inlining). Adjust connect-src if a future client calls a new origin.
// 'unsafe-eval' is only needed by the dev server (HMR / React Refresh); never
// shipped to production. 'unsafe-inline' on script-src covers Next's hydration
// bootstrap and the inline JSON-LD; on style-src it covers the inline styles
// used throughout the app.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`;
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https://cdn.discordapp.com https://flagcdn.com",
  "style-src 'self' 'unsafe-inline'",
  scriptSrc,
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/avatars/**" },
      { protocol: "https", hostname: "flagcdn.com", pathname: "/w80/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
