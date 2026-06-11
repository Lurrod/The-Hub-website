"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { QUEUE_TYPES, QUEUE_LABELS, type QueueType } from "@/lib/db/types";

// These tabs change the page's `?queue=` URL, so they are genuinely navigation
// (not an ARIA tab widget). We render a <nav> with real links and mark the
// active one with aria-current="page" — keyboard- and screen-reader-correct by
// default, no roving tabindex or arrow-key handling to reinvent.
export default function QueueTabs({ active, basePath }: { active: QueueType; basePath: string }) {
  const barRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  // tabs-sliding: JS writes the active tab's offsetLeft / offsetWidth onto the
  // pill; CSS owns the tween. On first paint / resize the pill snaps to position
  // without a transition; on click it slides optimistically before navigation.
  const moveTo = (tab: HTMLElement | null, animate: boolean) => {
    const pill = pillRef.current;
    if (!pill || !tab) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth; // force reflow so the snap doesn't animate
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  };

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const activeTab = () => bar.querySelector<HTMLElement>('[aria-current="page"]');
    const raf = requestAnimationFrame(() => moveTo(activeTab(), false));
    const onResize = () => moveTo(activeTab(), false);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  return (
    <nav className="t-tabs" aria-label="Filter by queue" ref={barRef} style={{ marginBottom: 12 }}>
      <span className="t-tabs-pill" aria-hidden="true" ref={pillRef} />
      {QUEUE_TYPES.map((q) => (
        <Link
          key={q}
          href={`${basePath}?queue=${q}`}
          className="t-tab"
          aria-current={q === active ? "page" : undefined}
          data-q={q}
          onClick={(e) => {
            if (q === active) return;
            moveTo(e.currentTarget, true); // optimistic slide before navigation
          }}
        >
          {QUEUE_LABELS[q]}
        </Link>
      ))}
    </nav>
  );
}
