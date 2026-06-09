import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using the Fast Learner × The Hub platform.",
};

const UPDATED = "June 9, 2026";
const CONTACT = "borde.titouan.47@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the{" "}
        <strong>Fast Learner × The Hub</strong> website (the
        &ldquo;Platform&rdquo;). By accessing or using the Platform, you agree to
        be bound by these Terms. If you do not agree, do not use the Platform.
      </p>

      <h2>Eligibility</h2>
      <p>
        To sign in you need a valid Discord account and, where applicable,
        membership of the associated community. You are responsible for all
        activity that occurs under your account.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not impersonate other players or misrepresent your identity.</li>
        <li>
          Do not submit unlawful, offensive, or infringing content in your
          profile fields or links.
        </li>
        <li>
          Do not attempt to disrupt, scrape, overload, or gain unauthorised access
          to the Platform or its data.
        </li>
        <li>Do not manipulate matches, results, or rankings.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You retain ownership of the profile information and links you submit. By
        publishing them, you grant us a non-exclusive licence to host and display
        that content on the Platform. You are solely responsible for the content
        you provide and confirm you have the right to share it.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Platform, including its source code, design, and original content, is
        the property of Fast Learner × The Hub and is protected by applicable law.
        See our <a href="/legal/notice">Legal Notice</a>. Nothing in these Terms
        grants you any right to copy, modify, or redistribute the Platform.
      </p>

      <h2>Riot Games disclaimer</h2>
      <p>
        This project is not affiliated with, endorsed by, or sponsored by Riot
        Games, Inc. VALORANT and all related marks are trademarks of Riot Games,
        Inc. All in-game data is used for community, non-commercial purposes.
      </p>

      <h2>Availability and warranty</h2>
      <p>
        The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; basis, without warranties of any kind. We do not
        guarantee that the Platform will be uninterrupted, error-free, or that
        statistics will always be accurate.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Fast Learner × The Hub shall not
        be liable for any indirect, incidental, or consequential damages arising
        from your use of, or inability to use, the Platform.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate access to the Platform at any time if these
        Terms are breached. You may stop using the Platform and request deletion of
        your data at any time.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by French law. Any dispute relating to the
        Platform shall be subject to the competent French courts, subject to any
        mandatory consumer-protection rules in your country of residence.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Platform
        after changes take effect constitutes acceptance of the revised Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
