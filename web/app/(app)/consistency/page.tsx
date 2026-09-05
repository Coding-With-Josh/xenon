import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConsistency } from "@/lib/consistency";
import { ConsistencyCalendarCard } from "./consistency-calendar-card";
import { MilestonesList } from "./milestones-list";

export default async function ConsistencyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const data = await getConsistency(session.user.id);

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="font-serif text-2xl font-medium">My Consistency</h1>
        <p className="text-muted-foreground text-sm mt-1">
          A quiet record of the days you showed up. No chains to break — just the
          shape of your own study rhythm.
        </p>
      </div>

      {/* Runs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Current run</p>
          <p className="font-serif text-3xl font-medium mt-1">
            {data.currentRun}
            <span className="text-base font-normal text-muted-foreground ml-1">
              day{data.currentRun === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Longest run</p>
          <p className="font-serif text-3xl font-medium mt-1">
            {data.bestRun}
            <span className="text-base font-normal text-muted-foreground ml-1">
              day{data.bestRun === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Days studied</p>
          <p className="font-serif text-3xl font-medium mt-1">
            {data.totalDaysStudied}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Last 12 weeks</h2>
        <ConsistencyCalendarCard days={data.days} />
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span className="inline-block size-3 rounded bg-primary/70" />
          Studied
          <span className="inline-block size-3 rounded border border-border ml-3" />
          No session
        </div>
      </section>

      {/* Milestones */}
      <section>
        <MilestonesList milestones={data.milestones} />
      </section>
    </div>
  );
}
