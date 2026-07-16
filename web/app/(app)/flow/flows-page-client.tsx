"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Compass01Icon } from "@hugeicons/core-free-icons";
import type { UserFlowsData } from "@/lib/flows-data";
import { InProgressList } from "./in-progress-list";
import { CompletedGroups } from "./completed-groups";
import { StartNewFlowSection } from "./start-new-flow-section";

type FlowsPageClientProps = {
  initialData: UserFlowsData;
  classLevel: string;
  hasAnyFlows: boolean;
};

export function FlowsPageClient({ initialData, classLevel, hasAnyFlows }: FlowsPageClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/flows");
      if (res.ok) setData(await res.json());
    } catch {
      // fall through to router.refresh below
    }
    router.refresh();
  }, [router]);

  const handleFlowStarted = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const completedCount = Object.values(data.completed).reduce((sum, arr) => sum + arr.length, 0);
  const inProgressTopics = new Set(data.inProgress.map((f) => `${f.subject}::${f.topic}`));
  const completedTopics = new Set(
    Object.values(data.completed).flat().map((f) => `${f.subject}::${f.topic}`)
  );

  // Brand new user — centered hero
  if (!hasAnyFlows) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-8">
        <div className="text-center space-y-3 max-w-md">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <HugeiconsIcon icon={Compass01Icon} size={24} />
          </div>
          <h2 className="font-serif text-2xl font-medium">Start your first Flow</h2>
          <p className="text-muted-foreground text-sm">
            A Flow guides you through a topic from start to finish — notes, practice, and mastery.
          </p>
        </div>
        <StartNewFlowSection
          classLevel={classLevel}
          onFlowStarted={handleFlowStarted}
          inProgressTopics={new Set()}
          completedTopics={new Set()}
          variant="hero"
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Start New Flow — hero card at the top */}
      <StartNewFlowSection
        classLevel={classLevel}
        onFlowStarted={handleFlowStarted}
        inProgressTopics={inProgressTopics}
        completedTopics={completedTopics}
        variant="hero"
      />

      {/* In Progress */}
      <InProgressList
        items={data.inProgress}
        onRefresh={handleRefresh}
      />

      {/* Completed */}
      <CompletedGroups
        groups={data.completed}
      />

      {/* Abandoned — collapsed at bottom */}
      {data.abandoned.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
            <svg
              className="h-3 w-3 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Abandoned flows ({data.abandoned.length})
          </summary>
          <div className="mt-3 space-y-2">
            {data.abandoned.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-sm opacity-60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
                    {flow.subject}
                  </span>
                  <span className="truncate">{flow.topic}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">
                  Abandoned
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}