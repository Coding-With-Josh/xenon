"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FlowListItem } from "@/lib/flows-data";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const stageLabels: Record<string, string> = {
  hook: "Hook",
  notes: "Notes",
  microcheck: "Quick check",
  quiz: "Quiz",
  remediation: "Quick fix",
  mastery: "Mastery",
};

type StalenessInfo = { label: string; className: string } | null;

function getStaleness(updatedAt: Date): StalenessInfo {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate > 30) {
    return { label: "Stale", className: "text-amber-500 dark:text-amber-400" };
  }
  if (daysSinceUpdate > 14) {
    return { label: `Last active ${daysSinceUpdate} days ago`, className: "text-muted-foreground" };
  }
  return null;
}

type FlowRowProps = {
  flow: FlowListItem;
  variant: "in-progress" | "completed" | "abandoned";
  onRefresh?: () => void;
};

export function FlowRow({ flow, variant, onRefresh }: FlowRowProps) {
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const stalenessLabel = useMemo(() => getStaleness(flow.updatedAt), [flow.updatedAt]);

  const handleRestart = async () => {
    if (!confirm("This will start a fresh Flow on this topic and mark the current one as abandoned. Continue?")) return;
    setRestarting(true);
    try {
      const res = await fetch(`/api/flows/${flow.id}/restart`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to restart");
      router.push(`/flow/${data.session.slug}`);
    } catch (e) {
      console.error(e);
      setRestarting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/flows/${flow.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setConfirmOpen(false);
      setDeleting(false);
      onRefresh?.();
    } catch (e) {
      console.error(e)
      }
  };

  if (variant === "in-progress") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-colors hover:bg-muted/30">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Subject badge */}
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary shrink-0">
            {flow.subject}
          </span>

          {/* Topic + stage info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{flow.topic}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stageLabels[flow.currentStage] ?? flow.currentStage}
              {flow.currentStage === "notes" && flow.totalSubsections > 0
                ? ` — ${flow.currentSubsectionIndex + 1} of ${flow.totalSubsections}`
                : flow.currentStage === "microcheck"
                  ? ` — ${flow.currentSubsectionIndex + 1} of ${flow.totalSubsections}`
                  : ""}
            </p>
          </div>

          {/* Staleness label */}
          {stalenessLabel && (
            <span className={`text-xs shrink-0 hidden sm:inline ${stalenessLabel.className}`}>
              {stalenessLabel.label}
            </span>
          )}
        </div>

        {/* Actions — full-width button pair beneath on mobile */}
        <div className="flex items-center gap-2 shrink-0 sm:ml-4">
          <Link
            href={`/flow/${flow.slug}`}
            className="flex-1 sm:flex-none rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-h-[40px] flex items-center justify-center"
          >
            Resume
          </Link>
          <button
            onClick={handleRestart}
            disabled={restarting || deleting}
            className="flex-1 sm:flex-none rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50 min-h-[40px]"
          >
            {restarting ? "..." : "Restart"}
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            aria-label="Clear flow"
            title="Clear flow"
            className="rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 min-h-[40px]"
          >
            {deleting ? <Spinner size={14} /> : "Clear"}
          </button>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Clear this Flow?"
          description="This permanently removes the Flow and all of its progress. This cannot be undone."
          confirmLabel="Clear Flow"
          loading={deleting}
          onConfirm={handleConfirmDelete}
        />
      </div>
    );
  }

  if (variant === "completed") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-semibold text-green-600 dark:text-green-400 shrink-0">
            {flow.subject}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{flow.topic}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {flow.quizScore != null && flow.quizTotal != null
                ? `Quiz: ${flow.quizScore}/${flow.quizTotal}`
                : "Completed"}
              {flow.completedAt && ` · ${new Date(flow.completedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:ml-4">
          <Link
            href={`/flow/${flow.slug}`}
            className="flex-1 sm:flex-none rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted min-h-[40px] flex items-center justify-center"
          >
            View notes
          </Link>
          <Link
            href={`/flow/${flow.slug}`}
            className="flex-1 sm:flex-none rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-h-[40px] flex items-center justify-center"
          >
            Flow Replay
          </Link>
        </div>
      </div>
    );
  }

  return null;
}