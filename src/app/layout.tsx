import type { Metadata } from "next";
import { Inter, Teko } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const teko = Teko({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-teko" });

export const metadata: Metadata = {
  title: "The Hub — Valorant 10mans Stats",
  description: "Stats, leaderboards and profiles for the Fast Learner x The Hub community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${teko.variable}`}>
        <div className="grain" />
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
