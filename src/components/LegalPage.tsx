import Link from "next/link";
import s from "./legal.module.css";

const LINKS: { href: string; label: string }[] = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/notice", label: "Legal Notice" },
  { href: "/legal/cookies", label: "Cookie Policy" },
];

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <article className={`glass ${s.doc}`}>
      <header className={s.head}>
        <span className={s.kicker}>Legal</span>
        <h1>{title}</h1>
        <p className={s.updated}>Last updated: {updated}</p>
      </header>

      <div className={s.body}>{children}</div>

      <nav className={s.foot}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
    </article>
  );
}
