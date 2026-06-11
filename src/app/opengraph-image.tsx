import { ImageResponse } from "next/og";

// App Router file convention: this auto-populates og:image (and, via the
// twitter-image re-export, twitter:image) site-wide at 1200x630 — the size
// Discord, X and search previews expect. Generated at build/request time, so
// there is no binary asset to maintain.
export const alt = "The Hub — Stats, leaderboards and profiles for Fast Learner x The Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(1200px 600px at 80% -10%, #102132 0%, #05080d 60%), #05080d",
          color: "#eaf2f8",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#2ee6d4",
            fontWeight: 700,
          }}
        >
          Fast Learner × The Hub
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 1,
            marginTop: 18,
            color: "#ffffff",
          }}
        >
          The Hub
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            marginTop: 28,
            color: "#a6bccd",
          }}
        >
          Stats · Leaderboards · Player profiles
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            height: 8,
            width: 260,
            borderRadius: 8,
            background: "linear-gradient(90deg, #ffcf4d, #ff5c84)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 70,
            right: 80,
            fontSize: 28,
            color: "#7f93a6",
            fontWeight: 700,
          }}
        >
          flhub.pro
        </div>
      </div>
    ),
    { ...size },
  );
}
