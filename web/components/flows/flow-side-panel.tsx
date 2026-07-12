"use client";

import type { FlowSession, FlowStageProgress } from "@/lib/flows/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  NoteIcon,
  CheckListIcon,
  Quiz01Icon,
  GlobalRefreshIcon,
  GraduationCapIcon,
  CheckmarkCircle01Icon,
  CircleLock01Icon,
} from "@hugeicons/core-free-icons";

type FlowSidePanelProps = {
  session: FlowSession;
  progress: FlowStageProgress[];
  subsections: { name: string; id: string }[];
};

function subsectionStatus(
  index: number,
  session: FlowSession,
  progress: FlowStageProgress[]
): "completed" | "current" | "locked" {
  // Check if this specific subsection has a completed notes or microcheck entry
  const subProgress = progress.filter(
    (p) => p.stage === "notes" && p.subsectionIndex === index
  );
  const subMc = progress.filter(
    (p) => p.stage === "microcheck" && p.subsectionIndex === index
  );

  // If notes has a completed=true entry, subsection is done
  if (subProgress.some((p) => p.completed) && subMc.some((p) => p.completed))
    return "completed";

  // If it's the current subsection of the current stage
  if (
    session.currentStage === "notes" &&
    session.currentSubsectionIndex === index
  )
    return "current";
  if (
    session.currentStage === "microcheck" &&
    session.currentSubsectionIndex === index
  )
    return "current";

  // Before the current subsection → completed? Actually depends on whether we passed it
  if (index < session.currentSubsectionIndex) return "completed";
  if (index > session.currentSubsectionIndex) return "locked";

  return "current";
}

export function FlowSidePanel({ session, progress, subsections }: FlowSidePanelProps) {
  const quizProgress = progress.find((p) => p.stage === "quiz");
  const quizData = quizProgress?.data as { wrongSubsectionIds?: string[] } | undefined;
  const hasWrongAnswers = (quizData?.wrongSubsectionIds?.length ?? 0) > 0;

  // Determine if remediation should appear
  const showRemediation = hasWrongAnswers || session.currentStage === "remediation";

  // Recalculate stage order with conditional remediation
  const orderedStages: { key: string; label: string; icon: any }[] = [
    { key: "notes", label: "Notes", icon: NoteIcon },
    { key: "microcheck", label: "Quick check", icon: CheckListIcon },
    { key: "quiz", label: "Quiz", icon: Quiz01Icon },
  ];
  if (showRemediation) {
    orderedStages.push({ key: "remediation", label: "Quick fix", icon: GlobalRefreshIcon });
  }
  orderedStages.push({ key: "mastery", label: "Mastery", icon: GraduationCapIcon });

  // Build a custom order for status checking
  const extendedOrder = ["notes", "microcheck", "quiz"];
  if (showRemediation) extendedOrder.push("remediation");
  extendedOrder.push("mastery");

  function stageStatusExtended(key: string): "completed" | "current" | "locked" {
    if (key === session.currentStage) return "current";
    const idx = extendedOrder.indexOf(key);
    const currentIdx = extendedOrder.indexOf(session.currentStage);
    if (idx < currentIdx) return "completed";
    return "locked";
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-0 pt-1">
      <div className="border-l border-border pl-5 space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-2">
          Flow Progress
        </p>

        {orderedStages.map((stage) => {
          const status = stageStatusExtended(stage.key);
          const isNotes = stage.key === "notes";
          const isCurrent = status === "current";

          return (
            <div key={stage.key}>
              {/* Stage row */}
              <div
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                  isCurrent
                    ? "bg-primary/10 text-foreground"
                    : status === "completed"
                      ? "text-foreground/70"
                      : "text-muted-foreground/40"
                }`}
              >
                {/* Status icon */}
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {status === "completed" ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500" />
                  ) : status === "current" ? (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  ) : (
                    <HugeiconsIcon icon={CircleLock01Icon} size={16} />
                  )}
                </span>

                {/* Stage icon */}
                <HugeiconsIcon icon={stage.icon} size={15} className="shrink-0" />

                {/* Label */}
                <span className="flex-1 text-xs font-medium truncate">{stage.label}</span>

                {/* Current badge */}
                {isCurrent && (
                  <span className="text-[10px] font-medium text-primary">
                    {stage.key === "notes" ? "reading" : "current"}
                  </span>
                )}
              </div>

              {/* Notes subsections */}
              {isNotes && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {subsections.map((sub, i) => {
                    const subStatus = isCurrent
                      ? subsectionStatus(i, session, progress)
                      : status === "completed"
                        ? "completed"
                        : "locked";

                    const isSubCurrent =
                      session.currentStage === "notes" &&
                      session.currentSubsectionIndex === i;

                    return (
                      <div
                        key={sub.id}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                          isSubCurrent
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                          {subStatus === "completed" ? (
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-green-500" />
                          ) : subStatus === "current" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          ) : (
                            <HugeiconsIcon icon={CircleLock01Icon} size={12} />
                          )}
                        </span>
                        <span
                          className={`flex-1 truncate text-xs ${
                            subStatus === "locked"
                              ? "text-muted-foreground/30"
                              : subStatus === "current"
                                ? "text-foreground font-medium"
                                : "text-muted-foreground/70"
                          }`}
                        >
                          {sub.name}
                        </span>
                        {isSubCurrent && (
                          <span className="text-[10px] text-primary font-medium shrink-0">reading</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
