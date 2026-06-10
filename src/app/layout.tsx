import type { Metadata } from "next";
import { Inter, Teko, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const teko = Teko({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-teko" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

const TITLE_DEFAULT = "The Hub";
const DESCRIPTION =
  "Stats, leaderboards and profiles for the Fast Learner x The Hub community.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: "The Hub - %s",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: TITLE_DEFAULT,
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${teko.variable} ${mono.variable}`}>
        <a href="#main" className="skip-link">Skip to main content</a>
        <div className="grain" />
        <Navbar />
        <main id="main" className="site-main" style={{ maxWidth: 1100, margin: "0 auto", padding: 24, minHeight: "60vh" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
