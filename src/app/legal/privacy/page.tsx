import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Fast Learner × The Hub collects, uses, and protects your data.",
};

const UPDATED = "June 9, 2026";
const CONTACT = "borde.titouan.47@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy explains how <strong>Fast Learner × The Hub</strong>{" "}
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;, the &ldquo;Platform&rdquo;) collects,
        uses, and protects your personal data when you use this website. We are
        committed to handling your data in accordance with the EU General Data
        Protection Regulation (GDPR).
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Discord account data.</strong> When you sign in with Discord,
          we receive your Discord user ID, username, and avatar through Discord
          OAuth. We never see or store your Discord password.
        </li>
        <li>
          <strong>Profile information you provide.</strong> Optional details you
          add to your profile: bio, favourite role, and links you choose to share
          (Twitch, X/Twitter, YouTube, VLR.gg, Tracker.gg).
        </li>
        <li>
          <strong>Gameplay data.</strong> Match results and in-game performance
          statistics from the community 10-mans associated with your account.
        </li>
        <li>
          <strong>Technical data.</strong> A strictly necessary session cookie to
          keep you signed in (see our{" "}
          <a href="/legal/cookies">Cookie Policy</a>).
        </li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To authenticate you and keep you signed in.</li>
        <li>To display your public player profile, ELO, and statistics.</li>
        <li>To build leaderboards and match histories for the community.</li>
        <li>To operate, maintain, and improve the Platform.</li>
      </ul>

      <h2>Legal basis</h2>
      <p>
        We process your data on the basis of your <strong>consent</strong> (given
        when you sign in and choose to publish profile information) and our{" "}
        <strong>legitimate interest</strong> in running a functioning community
        stats platform. You can withdraw consent at any time by deleting your
        profile data or contacting us.
      </p>

      <h2>Sharing and processors</h2>
      <p>
        We do not sell your personal data. Your data is stored in a database
        hosted locally on our own server; we do not use a third-party database
        service. Our hosting provider (OVH) acts as a data processor on our
        behalf. Your public profile, ELO, and stats are visible to other users by
        design.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your data for as long as your account and profile exist on the
        Platform. You may request deletion at any time, after which we remove your
        personal profile data within a reasonable period.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the GDPR you have the right to access, rectify, erase, restrict, and
        port your personal data, and to object to its processing. To exercise any
        of these rights, contact us at{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. You also have the right to
        lodge a complaint with your local data protection authority.
      </p>

      <h2>Children</h2>
      <p>
        The Platform is not directed at children under the age required to hold a
        Discord account in their country. We do not knowingly collect data from
        such children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The &ldquo;last
        updated&rdquo; date above reflects the latest revision.
      </p>

      <h2>Contact</h2>
      <p>
        For any privacy question, email{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
