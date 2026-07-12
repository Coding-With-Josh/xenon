"use client";

import { useState } from "react";
import { ConsistencyCalendar } from "./consistency-calendar";
import type { ConsistencyDay } from "@/lib/consistency";

export function ConsistencyCalendarCard({ days }: { days: ConsistencyDay[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Mobile: 4-week window by default, expand to full history on demand */}
      <div className="sm:hidden">
        <ConsistencyCalendar days={days} maxWeeks={expanded ? undefined : 4} />
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 w-full rounded-lg border border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted min-h-[40px]"
          >
            View all 12 weeks
          </button>
        )}
      </div>

      {/* Tablet / Desktop: full 12-week grid */}
      <div className="hidden sm:block">
        <ConsistencyCalendar days={days} />
      </div>
    </>
  );
}