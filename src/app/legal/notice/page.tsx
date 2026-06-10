import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Legal Notice",
  description: "Publisher, hosting, and ownership information for the Platform.",
};

const UPDATED = "June 9, 2026";
const CONTACT_DISCORD = "https://discord.com/invite/aSZNHuhJg5";

export default function NoticePage() {
  return (
    <LegalPage title="Legal Notice" updated={UPDATED}>
      <p>
        This Legal Notice (&ldquo;Mentions légales&rdquo;) is provided in
        accordance with applicable law, including the French Act for Confidence in
        the Digital Economy (LCEN).
      </p>

      <h2>Publisher</h2>
      <p>
        The Platform is published by <strong>Titouan Borde</strong> under the
        name <strong>Fast Learner × The Hub</strong>, an amateur community
        project.
        <br />
        Contact:{" "}
        <a href={CONTACT_DISCORD} target="_blank" rel="noreferrer">
          our Discord server
        </a>
        .
      </p>

      <h2>Publication director</h2>
      <p>
        The director of publication is <strong>Titouan Borde</strong>, reachable
        on{" "}
        <a href={CONTACT_DISCORD} target="_blank" rel="noreferrer">
          our Discord server
        </a>
        .
      </p>

      <h2>Hosting</h2>
      <p>
        The Platform is hosted by <strong>OVH SAS</strong>, 2 rue Kellermann,
        59100 Roubaix, France - RCS Lille Métropole 424 761 419 -{" "}
        <a href="https://www.ovhcloud.com" target="_blank" rel="noreferrer">
          ovhcloud.com
        </a>
        . The database runs locally on the same server; no third-party database
        service is used.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Unless otherwise stated, the Platform and all of its content (source code,
        design, text, and graphics created for it) are the exclusive property of
        Fast Learner × The Hub. All rights reserved. Any reproduction,
        distribution, or modification, in whole or in part, without prior written
        permission is prohibited.
      </p>

      <h2>Trademarks</h2>
      <p>
        VALORANT is a trademark of Riot Games, Inc. This project is not affiliated
        with, endorsed by, or sponsored by Riot Games, Inc. Third-party names and
        logos remain the property of their respective owners.
      </p>

      <h2>Personal data &amp; cookies</h2>
      <p>
        Information about the processing of personal data is available in our{" "}
        <a href="/legal/privacy">Privacy Policy</a>, and information about cookies
        in our <a href="/legal/cookies">Cookie Policy</a>.
      </p>

      <h2>Contact</h2>
      <p>
        For any request relating to this Legal Notice, reach us on{" "}
        <a href={CONTACT_DISCORD} target="_blank" rel="noreferrer">
          our Discord server
        </a>
        .
      </p>
    </LegalPage>
  );
}
