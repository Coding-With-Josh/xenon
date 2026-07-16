import type { ConsistencyDay } from "@/lib/consistency";

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function ConsistencyCalendar({
  days,
  maxWeeks,
}: {
  days: ConsistencyDay[];
  maxWeeks?: number;
}) {
  // Build a 7-row (Mon-Sun) grid grouped by week columns.
  let weeks: ConsistencyDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // When a window is requested, keep only the most recent N weeks.
  if (maxWeeks && weeks.length > maxWeeks) {
    weeks = weeks.slice(weeks.length - maxWeeks);
  }

  // Month labels along the top, placed at the column where the month starts.
  let lastMonth = "";
  const monthMarks: { col: number; label: string }[] = [];
  weeks.forEach((week, col) => {
    const first = week[0];
    if (!first) return;
    const m = monthLabel(first.date);
    if (m !== lastMonth) {
      monthMarks.push({ col, label: m });
      lastMonth = m;
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-2">
        {/* Weekday labels */}
        <div className="flex flex-col justify-between py-[2px] mr-1 text-[10px] text-muted-foreground">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <span key={i} className="h-[14px] leading-[14px]">
              {d}
            </span>
          ))}
        </div>

        <div>
          {/* Month labels */}
          <div className="flex gap-1 mb-1 pl-1">
            {weeks.map((_, col) => {
              const mark = monthMarks.find((m) => m.col === col);
              return (
                <div key={col} className="w-[14px] text-[10px] text-muted-foreground">
                  {mark ? mark.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, row) => {
                  const day = week[row];
                  if (!day) {
                    return <div key={row} className="size-[14px]" />;
                  }
                  const label = new Date(day.date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "short", day: "numeric" }
                  );
                  return (
                    <div
                      key={row}
                      title={`${label}${day.studied ? " — studied" : " — no session"}`}
                      className={`size-[14px] rounded-[3px] ${
                        day.studied
                          ? "bg-primary/70"
                          : "border border-border bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}