import type { Metadata } from "next";
import { Inter, Teko, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const teko = Teko({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-teko" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: {
    default: "The Hub",
    template: "The Hub - %s",
  },
  description: "Stats, leaderboards and profiles for the Fast Learner x The Hub community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${teko.variable} ${mono.variable}`}>
        <div className="grain" />
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, minHeight: "60vh" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
