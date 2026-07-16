"use client";

import { useState } from "react";
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
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type HugeIcon = React.ComponentProps<typeof HugeiconsIcon>["icon"];

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
  const subProgress = progress.filter(
    (p) => p.stage === "notes" && p.subsectionIndex === index
  );
  const subMc = progress.filter(
    (p) => p.stage === "microcheck" && p.subsectionIndex === index
  );

  if (subProgress.some((p) => p.completed) && subMc.some((p) => p.completed))
    return "completed";

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

  if (index < session.currentSubsectionIndex) return "completed";
  if (index > session.currentSubsectionIndex) return "locked";

  return "current";
}

function buildOrderedStages(
  session: FlowSession,
  progress: FlowStageProgress[]
) {
  const quizProgress = progress.find((p) => p.stage === "quiz");
  const quizData = quizProgress?.data as { wrongSubsectionIds?: string[] } | undefined;
  const hasWrongAnswers = (quizData?.wrongSubsectionIds?.length ?? 0) > 0;
  const showRemediation = hasWrongAnswers || session.currentStage === "remediation";

  const orderedStages: { key: string; label: string; icon: HugeIcon }[] = [
    { key: "notes", label: "Notes", icon: NoteIcon },
    { key: "microcheck", label: "Quick check", icon: CheckListIcon },
    { key: "quiz", label: "Quiz", icon: Quiz01Icon },
  ];
  if (showRemediation) {
    orderedStages.push({ key: "remediation", label: "Quick fix", icon: GlobalRefreshIcon });
  }
  orderedStages.push({ key: "mastery", label: "Mastery", icon: GraduationCapIcon });

  const extendedOrder = ["notes", "microcheck", "quiz"];
  if (showRemediation) extendedOrder.push("remediation");
  extendedOrder.push("mastery");

  return { orderedStages, extendedOrder };
}

function stageStatusExtended(
  key: string,
  session: FlowSession,
  extendedOrder: string[]
): "completed" | "current" | "locked" {
  if (key === session.currentStage) return "current";
  const idx = extendedOrder.indexOf(key);
  const currentIdx = extendedOrder.indexOf(session.currentStage);
  if (idx < currentIdx) return "completed";
  return "locked";
}

function StageList({
  session,
  progress,
  subsections,
}: {
  session: FlowSession;
  progress: FlowStageProgress[];
  subsections: { name: string; id: string }[];
}) {
  const { orderedStages, extendedOrder } = buildOrderedStages(session, progress);

  return (
    <div className="border-l border-border pl-5 space-y-1">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-2">
        Flow Progress
      </p>

      {orderedStages.map((stage) => {
        const status = stageStatusExtended(stage.key, session, extendedOrder);
        const isNotes = stage.key === "notes";
        const isCurrent = status === "current";

        return (
          <div key={stage.key}>
            <div
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                isCurrent
                  ? "bg-primary/10 text-foreground"
                  : status === "completed"
                    ? "text-foreground/70"
                    : "text-muted-foreground/40"
              }`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {status === "completed" ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500" />
                ) : status === "current" ? (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                ) : (
                  <HugeiconsIcon icon={CircleLock01Icon} size={16} />
                )}
              </span>

              <HugeiconsIcon icon={stage.icon} size={15} className="shrink-0" />

              <span className="flex-1 text-xs font-medium truncate">{stage.label}</span>

              {isCurrent && (
                <span className="text-[10px] font-medium text-primary">
                  {stage.key === "notes" ? "reading" : "current"}
                </span>
              )}
            </div>

            {isNotes && (
              <div className="ml-7 mt-0.5 space-y-0.5">
                {subsections.map((sub, i) => {
                  const subStatus =
                    isCurrent
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
                        isSubCurrent ? "bg-primary/5" : ""
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
  );
}

export function FlowSidePanel({ session, progress, subsections }: FlowSidePanelProps) {
  const stageLabels: Record<string, string> = {
    hook: "Getting started",
    notes: "Notes",
    microcheck: "Quick check",
    quiz: "Quiz",
    remediation: "Quick fix",
    mastery: "Mastery",
  };
  const currentStageLabel =
    stageLabels[session.currentStage] ?? session.currentStage;
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop / Tablet: persistent right-hand column */}
      <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-0 pt-1">
        <StageList session={session} progress={progress} subsections={subsections} />
      </aside>

      {/* Mobile: collapsed summary chip → bottom sheet */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-lg active:scale-[0.98] transition-transform min-h-[40px]"
            >
              <HugeiconsIcon icon={Menu01Icon} size={16} />
              <span className="max-w-[50vw] truncate">
                {session.topic} · {currentStageLabel}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetTitle className="text-sm font-semibold mb-3">Flow Progress</SheetTitle>
            <StageList session={session} progress={progress} subsections={subsections} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}