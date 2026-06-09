"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { QUEUE_TYPES, QUEUE_LABELS, type QueueType } from "@/lib/db/types";

export default function QueueTabs({ active, basePath }: { active: QueueType; basePath: string }) {
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
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
    const activeTab = () => bar.querySelector<HTMLElement>('[aria-selected="true"]');
    const raf = requestAnimationFrame(() => moveTo(activeTab(), false));
    const onResize = () => moveTo(activeTab(), false);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  return (
    <div className="t-tabs" role="tablist" ref={barRef} style={{ marginBottom: 12 }}>
      <span className="t-tabs-pill" aria-hidden="true" ref={pillRef} />
      {QUEUE_TYPES.map((q) => (
        <button
          key={q}
          type="button"
          role="tab"
          className="t-tab"
          aria-selected={q === active}
          data-q={q}
          onClick={(e) => {
            if (q === active) return;
            moveTo(e.currentTarget, true); // optimistic slide before navigation
            router.push(`${basePath}?queue=${q}`);
          }}
        >
          {QUEUE_LABELS[q]}
        </button>
      ))}
    </div>
  );
}
