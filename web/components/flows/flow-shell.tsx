"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FlowSession, FlowStageProgress } from "@/lib/flows/types";
import { FlowStageRenderer } from "./flow-stage-renderer";

type FlowShellProps = {
  session: FlowSession;
  progress: FlowStageProgress[];
  subsections: { name: string; id: string }[];
  className?: string;
};

export function FlowShell({ session: initialSession, progress: initialProgress, subsections, className }: FlowShellProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [progress, setProgress] = useState(initialProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefetchedQuiz = useRef(false);

  // Prefetch quiz generation when on the last subsection's micro-check
  useEffect(() => {
    if (
      !prefetchedQuiz.current &&
      session.currentStage === "microcheck" &&
      session.currentSubsectionIndex === session.totalSubsections - 1
    ) {
      prefetchedQuiz.current = true;
      fetch(`/api/flows/${session.id}/generate-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  }, [session.currentStage, session.currentSubsectionIndex, session.totalSubsections, session.id]);

  const stageLabel = session.currentStage === "hook" ? "Hook"
    : session.currentStage === "notes" ? "Notes"
    : session.currentStage === "microcheck" ? "Quick check"
    : session.currentStage === "quiz" ? "Quiz"
    : session.currentStage === "remediation" ? "Quick fix"
    : "Mastery";

  const progressPct = session.currentStage === "hook" ? 0
    : session.currentStage === "notes"
      ? (session.currentSubsectionIndex / session.totalSubsections) * 50
      : session.currentStage === "microcheck"
        ? 50 + ((session.currentSubsectionIndex + 1) / session.totalSubsections) * 25
        : session.currentStage === "quiz" ? 75
        : session.currentStage === "remediation" ? 90
        : 100;

  const handleAdvance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flows/${session.id}/advance`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to advance");
      if (data.completed) {
        router.push("/dashboard");
        return;
      }
      setSession(data.session);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to advance");
    } finally {
      setLoading(false);
    }
  }, [session.id, router]);

  const handleGenerateAndAdvance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const genRes = await fetch(`/api/flows/${session.id}/generate-stage`, { method: "POST" });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error ?? "Generation failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setLoading(false);
    }
  }, [session.id]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleGenerateAndAdvance();
  }, [handleGenerateAndAdvance]);

  const handleSkip = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/flows/${session.id}/advance`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to skip");
      setSession(data.session);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to skip");
    } finally {
      setLoading(false);
    }
  }, [session.id]);

  const handleExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className={`max-w-3xl space-y-6 animate-in fade-in duration-500 ${className ?? ""}`}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {session.currentStage === "hook" ? "Getting started"
              : session.currentStage === "notes" || session.currentStage === "microcheck"
                ? `Subsection ${session.currentSubsectionIndex + 1} of ${session.totalSubsections}`
                : stageLabel}
          </span>
          <span>{stageLabel}</span>
        </div>
        <div className="bg-zinc-200 dark:bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stage content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={`${session.currentStage}-${session.currentSubsectionIndex}`}>
        <FlowStageRenderer
        stage={session.currentStage as import("@/lib/flows/types").FlowStage}
        subsectionIndex={session.currentSubsectionIndex}
        subsections={subsections}
        progress={progress}
        sessionId={session.id}
        subject={session.subject}
        topic={session.topic}
        onAdvance={handleAdvance}
        onRetry={handleRetry}
        onSkip={handleSkip}
        onExit={handleExit}
        error={error}
        loading={loading}
      />
    </div>
    </div>
  );
}
