"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getStageData, type MicroCheckData, type MicroCheckQuestion, type FlowStageProgress } from "@/lib/flows/types";
import { MicroCheckShimmer } from "@/components/ui/shimmer";

type MicroCheckStageProps = {
  subsectionIndex: number;
  subsections: { name: string; id: string }[];
  progress: FlowStageProgress[];
  sessionId: number;
  subject: string;
  topic: string;
  onAdvance: () => void;
  onRetry: () => void;
  loading: boolean;
};

export function MicroCheckStage({
  subsectionIndex,
  subsections,
  progress,
  sessionId,
  subject,
  topic,
  onAdvance,
  onRetry,
  loading,
}: MicroCheckStageProps) {
  const subsection = subsections[subsectionIndex];
  const mcProgress = progress.find(
    (p) => p.stage === "microcheck" && p.subsectionIndex === subsectionIndex
  );
  const mcData = mcProgress ? getStageData<MicroCheckData>(mcProgress) : null;
  const questions = mcData?.questions ?? null;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (!questions && !loading && !autoTriggered.current) {
      autoTriggered.current = true;
      setAutoLoading(true);
      fetch(`/api/flows/${sessionId}/generate-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to generate micro-check");
          window.location.reload();
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to generate micro-check");
          setAutoLoading(false);
        });
    }
  }, [questions, loading, sessionId]);

  const handleSelect = useCallback((questionId: string, option: string) => {
    setAnswered((prev) => {
      if (prev[questionId]) return prev;
      return { ...prev, [questionId]: true };
    });
    setAnswers((prev) => {
      if (prev[questionId]) return prev;
      return { ...prev, [questionId]: option };
    });
  }, []);

  const allAnswered = questions ? questions.every((q) => answered[q.id]) : false;

  const handleGenerate = useCallback(async () => {
    const res = await fetch(`/api/flows/${sessionId}/generate-stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to generate micro-check");
    window.location.reload();
  }, [sessionId]);

  if (loading || autoLoading) {
    return <MicroCheckShimmer />;
  }

  if (error && !questions) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-4">
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={handleGenerate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    if (!error) return <MicroCheckShimmer />;
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-4">
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={handleGenerate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Quick Check &middot; Subsection {subsectionIndex + 1} of {subsections.length}
        </p>
      </div>

      <h3 className="font-serif text-xl font-medium">
        {subsection?.name ?? "Quick Check"}
      </h3>

      {questions.map((q, index) => {
        const isAnswered = answered[q.id] ?? false;
        const selected = answers[q.id] ?? null;
        const isCorrect = isAnswered
          ? selected?.toUpperCase().slice(0, 1) === q.correct.toUpperCase().slice(0, 1)
          : undefined;

        return (
          <div
            key={q.id}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
          >
            <MicroCheckQuestionCard
              question={q}
              index={index}
              selected={selected}
              answered={isAnswered}
              correct={isCorrect}
              onSelect={(option) => handleSelect(q.id, option)}
            />
          </div>
        );
      })}

      {allAnswered && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={onAdvance}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
          >
            {subsectionIndex + 1 < subsections.length
              ? "Next section"
              : "Continue to quiz"}
          </button>
        </div>
      )}
    </div>
  );
}

function MicroCheckQuestionCard({
  question,
  index,
  selected,
  answered,
  correct,
  onSelect,
}: {
  question: MicroCheckQuestion;
  index: number;
  selected: string | null;
  answered: boolean;
  correct?: boolean;
  onSelect: (option: string) => void;
}) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <p className="text-sm font-medium leading-relaxed">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        {question.question}
      </p>

      <div className="space-y-1.5">
        {question.options.map((option, oi) => {
          const label = optionLabels[oi];
          const isSelected = selected?.toUpperCase().slice(0, 1) === label;
          const isCorrectOption = answered && label === question.correct.toUpperCase().slice(0, 1);
          const isWrongOption = answered && isSelected && !isCorrectOption;

          return (
            <button
              key={label}
              onClick={() => !answered && onSelect(option)}
              disabled={answered}
              className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all duration-150 ${
                isSelected && !answered
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : isCorrectOption && answered
                    ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/30"
                    : isWrongOption && answered
                      ? "border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                      : "border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5"
              } ${answered ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isSelected && !answered
                    ? "bg-primary text-primary-foreground"
                    : isCorrectOption && answered
                      ? "bg-green-500 text-white"
                      : isWrongOption && answered
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </span>
              <span className="flex-1">{option.replace(/^[A-D]\)\s*/, "")}</span>
              {isCorrectOption && answered && (
                <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isWrongOption && answered && (
                <svg className="h-4 w-4 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`rounded-lg p-3 text-sm ${
            correct
              ? "bg-green-500/5 text-green-700 dark:text-green-300"
              : "bg-amber-500/5 text-amber-700 dark:text-amber-300"
          }`}
        >
          {correct ? (
            <p>{question.explanation}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Correct answer: {question.correct}</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
