import { useMemo } from "react";
import type { Feeding } from "@/lib/types";
import { totalMl } from "@/lib/queries/feedings";
import { formatDelta } from "@/lib/time";
import { useNow } from "@/lib/hooks/use-now";

export function DashboardHeader({
  feedingsToday,
  allRecentFeedings,
}: {
  feedingsToday: Feeding[];
  allRecentFeedings: Feeding[];
}) {
  useNow(60000); // rerender once per minute so "vor X min" stays fresh
  const todaySum = useMemo(
    () => feedingsToday.reduce((acc, f) => acc + totalMl(f), 0),
    [feedingsToday],
  );

  const lastFeed = useMemo(() => {
    // pick the most recent feeding that had liquid (pre/milk/combo), skip pumping
    const withLiquid = allRecentFeedings.filter((f) => f.type !== "pump");
    return withLiquid[0] ?? null;
  }, [allRecentFeedings]);

  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">Letztes Schmausen</div>
      <div className="text-3xl font-bold">
        {lastFeed
          ? `vor ${formatDelta(lastFeed.occurredAt.toDate())}`
          : "noch keine"}
      </div>
      <div className="pt-1 text-sm text-muted-foreground">
        Heute:{" "}
        <span className="font-semibold text-foreground">{todaySum} ml</span>{" "}
        &middot;{" "}
        <span>
          {feedingsToday.length} Eintrag{feedingsToday.length === 1 ? "" : "e"}
        </span>
      </div>
    </div>
  );
}
