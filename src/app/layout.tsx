import type { Metadata, Viewport } from "next";
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
    template: "%s - The Hub",
  },
  description: DESCRIPTION,
  applicationName: TITLE_DEFAULT,
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

export const viewport: Viewport = {
  themeColor: "#05080d",
};

// Organisation + site search, exposed as JSON-LD so search engines can read
// the brand and offer a sitelinks search box (HTML-02).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Fast Learner × The Hub",
      url: SITE_URL,
      logo: `${SITE_URL}/fl_logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "The Hub",
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${teko.variable} ${mono.variable}`}>
        <script
          type="application/ld+json"
          // Escape "<" so a future dynamic field can't break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
        />
        <a href="#main" className="skip-link">Skip to main content</a>
        <div className="grain" />
        <Navbar />
        <main id="main" className="site-main" style={{ maxWidth: 1100, margin: "0 auto", padding: 24, minHeight: "60vh" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
