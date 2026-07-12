"use client";

import Link from "next/link";

type FlowSummary = {
  slug: string;
  subject: string;
  topic: string;
  status: string;
  currentStage: string;
  currentSubsectionIndex: number;
  totalSubsections: number;
  updatedAt: Date;
  completedAt: Date | null;
};

function statusPill(status: string) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        Mastered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      In progress
    </span>
  );
}

export function RecentSessionsTable({ flows }: { flows: FlowSummary[] }) {
  if (flows.length === 0) {
    return (
      <div>
        <SectionHeader>Recent Sessions</SectionHeader>
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No study sessions yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Complete a Flow to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader>Recent Sessions</SectionHeader>
        {flows.length >= 5 && (
          <Link
            href="/analytics"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Topic
              </th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                Subject
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-2.5 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {flows.map((flow) => (
              <tr
                key={flow.slug}
                className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/flow/${flow.slug}`}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {flow.topic}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {flow.subject}
                </td>
                <td className="px-4 py-3">{statusPill(flow.status)}</td>
                <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                  {flow.status === "in_progress"
                    ? `${flow.currentSubsectionIndex + 1}/${flow.totalSubsections}`
                    : "Done"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}
