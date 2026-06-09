// One-shot responsive audit: screenshots key pages at mobile/desktop widths
// and reports any element wider than the viewport (horizontal overflow).
// Usage: node scripts/responsive-check.mjs  (expects dev server on :3000)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const PAGES = [
  ["home", "/"],
  ["leaderboard", "/leaderboard"],
  ["stats", "/stats"],
  ["matches", "/matches"],
  ["match", "/match/0123456789abcdef0123dead"],
  ["player", "/player/100"],
  ["me", "/me"],
  ["legal", "/legal/privacy"],
];
const VIEWPORTS = [
  ["mobile-390", 390, 844],
  ["tablet-768", 768, 1024],
  ["desktop-1366", 1366, 900],
];

mkdirSync("test-results/responsive", { recursive: true });
const browser = await chromium.launch();
let failures = 0;

for (const [vpName, width, height] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const bad = [];
      // table wrappers are allowed to scroll horizontally; their children don't count
      // scroll containers AND overflow-hidden clippers: children can't widen the page
      const scrollers = [...document.querySelectorAll("*")].filter((el) => {
        const o = getComputedStyle(el).overflowX;
        return o === "auto" || o === "scroll" || o === "hidden" || o === "clip";
      });
      for (const el of document.querySelectorAll("body *")) {
        if (scrollers.some((s) => s !== el && s.contains(el))) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 1 && (r.right > doc.clientWidth + 1 || r.left < -1)) {
          bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} right=${Math.round(r.right)} left=${Math.round(r.left)}`);
        }
      }
      return { docOverflow: doc.scrollWidth - doc.clientWidth, bad: bad.slice(0, 6) };
    });
    await page.screenshot({ path: `test-results/responsive/${vpName}-${name}.png`, fullPage: true });
    const status = overflow.bad.length === 0 ? "OK " : "FAIL";
    if (overflow.bad.length > 0) failures++;
    console.log(`${status} [${vpName}] ${path} (docOverflowX=${overflow.docOverflow}px)`);
    for (const b of overflow.bad) console.log(`     -> ${b}`);
  }
  await page.close();
}
await browser.close();
console.log(failures === 0 ? "\nAll pages clean." : `\n${failures} page/viewport combos with overflow.`);
process.exit(failures === 0 ? 0 : 1);
