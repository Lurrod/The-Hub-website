import type { Metadata } from "next";
import { getQueueStatLines } from "@/lib/db/players";
import { QUEUE_TYPES, type QueueType } from "@/lib/db/types";
import QueueTabs from "@/components/QueueTabs";
import StatsTable from "@/components/StatsTable";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Stats",
  description: "Sortable player statistics — Rating, ACS, ADR, K/D, KAST and more across every ranked queue.",
};

function parseQueue(v: string | undefined): QueueType {
  return (QUEUE_TYPES as string[]).includes(v ?? "") ? (v as QueueType) : "pro";
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const queue = parseQueue((await searchParams).queue);
  const lines = await getQueueStatLines(queue, { minGames: 0 });

  return (
    <>
      <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "20px 4px 12px" }}>
        Stats - all players by queue
      </div>
      <QueueTabs active={queue} basePath="/stats" />
      <StatsTable lines={lines} />
    </>
  );
}
