import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The cookies used by Fast Learner × The Hub and how to manage them.",
};

const UPDATED = "June 9, 2026";
const CONTACT_DISCORD = "https://discord.com/invite/aSZNHuhJg5";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated={UPDATED}>
      <p>
        This Cookie Policy explains how <strong>Fast Learner × The Hub</strong>{" "}
        uses cookies and similar technologies on this website.
      </p>

      <h2>What cookies we use</h2>
      <p>
        We only use <strong>strictly necessary cookies</strong>. These are
        required to operate the Platform and cannot be switched off in our systems.
      </p>
      <ul>
        <li>
          <strong>Authentication / session.</strong> When you sign in with Discord,
          our authentication library (Auth.js) sets a secure session cookie so the
          Platform remembers that you are logged in across pages.
        </li>
        <li>
          <strong>Security.</strong> A short-lived token cookie is used to protect
          sign-in requests against cross-site request forgery (CSRF).
        </li>
      </ul>

      <h2>What we do not use</h2>
      <p>
        We do <strong>not</strong> use advertising cookies, third-party tracking
        cookies, or analytics that profile you. Because we only set strictly
        necessary cookies, no consent banner is required for them.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can delete or block cookies through your browser settings. Note that
        if you block our session cookie, you will not be able to stay signed in or
        use features that require an account.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Cookie Policy if our use of cookies changes. The
        &ldquo;last updated&rdquo; date above reflects the latest revision.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies? Reach us on{" "}
        <a href={CONTACT_DISCORD} target="_blank" rel="noreferrer">
          our Discord server
        </a>
        .
      </p>
    </LegalPage>
  );
}
