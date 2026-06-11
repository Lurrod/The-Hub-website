import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// App Router file convention: this auto-populates og:image (and, via the
// twitter-image re-export, twitter:image) site-wide at 1200x630 — the size
// Discord, X and search previews expect. It mirrors the live site: the real
// bg.jpg hero, the brand glows, a frosted "glass" panel and the FL logo, using
// the exact CSS tokens from globals.css.
export const alt = "The Hub — Stats, leaderboards and profiles for Fast Learner x The Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Site tokens (globals.css :root)
const BG = "#05080d";
const TXT = "#eef4fa";
const MUTED = "#a6bccd";
const CYAN = "#2ee6d4";
const GOLD = "#ffcf4d";
const RED2 = "#ff5c84";

function dataUrl(relPath: string, mime: string): string {
  const buf = readFileSync(join(process.cwd(), relPath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export default function OpengraphImage() {
  const bg = dataUrl("public/bg.jpg", "image/jpeg");
  const logo = dataUrl("public/fl_logo.png", "image/png");

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: BG,
          fontFamily: "sans-serif",
        }}
      >
        {/* Real site background photo */}
        <img
          src={bg}
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0, width: size.width, height: size.height, objectFit: "cover" }}
        />
        {/* Brand glows + darkening overlay (mirrors the .orb/.grain layers) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            background:
              "radial-gradient(900px 520px at 10% 6%, rgba(255,70,85,0.30), transparent 55%)," +
              "radial-gradient(820px 520px at 96% 104%, rgba(74,163,255,0.26), transparent 55%)," +
              "linear-gradient(150deg, rgba(5,8,13,0.74), rgba(5,8,13,0.62) 42%, rgba(5,8,13,0.90))",
          }}
        />

        {/* Frosted glass panel, like the site's .glass cards */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            margin: 64,
            padding: "56px 64px",
            width: 1072,
            borderRadius: 28,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          }}
        >
          {/* Logo + eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <img src={logo} width={92} height={92} style={{ borderRadius: 18 }} />
            <span
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: 8,
                textTransform: "uppercase",
                color: CYAN,
                fontWeight: 700,
              }}
            >
              Fast Learner × The Hub
            </span>
          </div>

          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              fontSize: 156,
              fontWeight: 800,
              lineHeight: 1,
              marginTop: 22,
              color: TXT,
              letterSpacing: -2,
            }}
          >
            The Hub
          </div>

          {/* Tagline */}
          <div style={{ display: "flex", fontSize: 38, marginTop: 24, color: MUTED }}>
            Stats · Leaderboards · Player profiles
          </div>

          {/* Gold→pink accent bar (matches the site's score/loss accents) */}
          <div
            style={{
              display: "flex",
              marginTop: 40,
              height: 8,
              width: 280,
              borderRadius: 8,
              background: `linear-gradient(90deg, ${GOLD}, ${RED2})`,
            }}
          />
        </div>

        {/* URL chip, bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: 92,
            right: 104,
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: GOLD,
          }}
        >
          flhub.pro
        </div>
      </div>
    ),
    { ...size },
  );
}
