"use client";

import { useState, useCallback, useEffect } from "react";
import { getStageData, type QuizData, type MicroCheckQuestion, type FlowStageProgress } from "@/lib/flows/types";
import { Spinner } from "@/components/ui/spinner";

type RemediationStageProps = {
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

type SubsectionRemediation = {
  subsectionId: string;
  subsectionName: string;
  explanation: string;
  questions: MicroCheckQuestion[];
  answers: Record<string, string>;
  submitted: boolean;
};

export function RemediationStage({
  progress,
  sessionId,
  subject,
  topic,
  subsections,
  onAdvance,
  loading,
}: RemediationStageProps) {
  const quizProgress = progress.find((p) => p.stage === "quiz");
  const quizData = quizProgress ? getStageData<QuizData>(quizProgress) : null;
  const wrongIds = quizData?.wrongSubsectionIds ?? [];
  const questions = quizData?.questions ?? [];

  const wrongSubsections = subsections.filter((s) => wrongIds.includes(s.id));
  const wrongQuestions = questions.filter((q) => wrongIds.includes(q.subsectionId));

  const [remediations, setRemediations] = useState<SubsectionRemediation[]>([]);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = remediations[currentIndex];
  const allDone = remediations.length > 0 && currentIndex >= remediations.length;
  const isLast = currentIndex === remediations.length - 1;

  useEffect(() => {
    if (wrongSubsections.length === 0) {
      setGenerating(false);
      return;
    }
    let cancelled = false;

    async function loadAll() {
      const results: SubsectionRemediation[] = [];
      for (const sub of wrongSubsections) {
        const prevAttempt = wrongQuestions
          .filter((q) => q.subsectionId === sub.id)
          .map((q) => ({
            question: q.question,
            userAnswer: quizData?.answers[q.id] ?? "",
            correctAnswer: q.correct ?? "",
          }));

        const res = await fetch(`/api/flows/${sessionId}/remediate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subsectionId: sub.id,
            subsectionName: sub.name,
            ...(prevAttempt[0] ? { previousAttempt: prevAttempt[0] } : {}),
          }),
        });
        if (!res.ok) throw new Error(`Failed to load remediation for "${sub.name}"`);
        const data = await res.json();
        results.push({
          subsectionId: sub.id,
          subsectionName: sub.name,
          explanation: data.explanation,
          questions: data.questions ?? [],
          answers: {},
          submitted: false,
        });
      }
      if (!cancelled) {
        setRemediations(results);
        setGenerating(false);
      }
    }

    loadAll().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Failed to generate remediation");
        setGenerating(false);
      }
    });

    return () => { cancelled = true; };
  }, [sessionId, wrongSubsections.length]);

  const handleAnswer = useCallback((questionId: string, option: string) => {
    setRemediations((prev) => {
      const next = [...prev];
      const r = { ...next[currentIndex] };
      r.answers = { ...r.answers, [questionId]: option };
      next[currentIndex] = r;
      return next;
    });
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    const r = remediations[currentIndex];
    if (!r) return;

    // Record retry results in question_attempts
    const results = r.questions.map((q) => {
      const userAnswer = r.answers[q.id] ?? "";
      const correct = userAnswer.toUpperCase().slice(0, 1) === q.correct.toUpperCase().slice(0, 1);
      return {
        question: q.question,
        correct,
        userAnswer,
        correctAnswer: q.correct,
        explanation: q.explanation,
      };
    });

    try {
      await fetch(`/api/flows/${sessionId}/remediate/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subsectionId: r.subsectionId, results }),
      });
    } catch (e) {
      console.error("Failed to record remediation results:", e);
    }

    setRemediations((prev) => {
      const next = [...prev];
      const rr = { ...next[currentIndex] };
      rr.submitted = true;
      next[currentIndex] = rr;
      return next;
    });
  }, [currentIndex, remediations, sessionId]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Quick Fix</p>
            <p className="text-muted-foreground text-xs mt-0.5">Reviewing {wrongSubsections.length} {wrongSubsections.length === 1 ? "section" : "sections"}...</p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: wrongSubsections.length }).map((_, i) => (
            <div key={i} className="rounded-xl border p-5 space-y-3">
              <div className="bg-muted animate-pulse rounded h-4 w-1/3" />
              <div className="bg-muted animate-pulse rounded h-16 w-full" />
              <div className="bg-muted animate-pulse rounded h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wrongSubsections.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center space-y-4">
        <p className="text-muted-foreground text-sm">No mistakes to review!</p>
        <button
          onClick={onAdvance}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="rounded-xl border p-6 text-center space-y-4">
        <p className="text-sm font-medium">All sections reviewed!</p>
        <button
          onClick={onAdvance}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
        >
          Continue to mastery
        </button>
      </div>
    );
  }

  const correctCount = current?.questions.filter(
    (q) => current.answers[q.id]?.toUpperCase().slice(0, 1) === q.correct.toUpperCase().slice(0, 1)
  ).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Quick Fix
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Section {currentIndex + 1} of {wrongSubsections.length}
          </p>
        </div>
      </div>

      {current && (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-xl font-medium">{current.subsectionName}</h3>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concept review</p>
            <p className="text-sm leading-relaxed">{current.explanation}</p>
          </div>

          {current.questions.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Try again
              </p>
              {current.questions.map((q, qi) => (
                <div key={q.id} className="rounded-xl border p-5 space-y-3">
                  <p className="text-sm font-medium leading-relaxed">
                    <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {["A", "B", "C", "D"].map((label, oi) => {
                      const option = q.options[oi];
                      if (!option) return null;
                      const isSelected = current.answers[q.id]?.toUpperCase().slice(0, 1) === label;
                      const isCorrectOption = current.submitted && label === q.correct.toUpperCase().slice(0, 1);
                      const isWrongOption = current.submitted && isSelected && !isCorrectOption;

                      return (
                        <button
                          key={label}
                          onClick={() => !current.submitted && handleAnswer(q.id, option)}
                          disabled={current.submitted}
                          className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all duration-150 ${
                            isSelected && !current.submitted
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : isCorrectOption && current.submitted
                                ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/30"
                                : isWrongOption && current.submitted
                                  ? "border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                                  : "border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5"
                          } ${current.submitted ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              isSelected && !current.submitted
                                ? "bg-primary text-primary-foreground"
                                : isCorrectOption && current.submitted
                                  ? "bg-green-500 text-white"
                                  : isWrongOption && current.submitted
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {label}
                          </span>
                          <span className="flex-1">{option.replace(/^[A-D]\)\s*/, "")}</span>
                          {isCorrectOption && current.submitted && (
                            <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isWrongOption && current.submitted && (
                            <svg className="h-4 w-4 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {current.submitted && (
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        current.answers[q.id]?.toUpperCase().slice(0, 1) === q.correct.toUpperCase().slice(0, 1)
                          ? "bg-green-500/5 text-green-700 dark:text-green-300"
                          : "bg-amber-500/5 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {current.answers[q.id]?.toUpperCase().slice(0, 1) === q.correct.toUpperCase().slice(0, 1) ? (
                        <p>{q.explanation}</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium">Correct answer: {q.correct}</p>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {!current.submitted ? (
              <button
                onClick={handleSubmit}
                disabled={current.questions.some((q) => !current.answers[q.id])}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-colors"
              >
                Check answers
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isLast) {
                    onAdvance();
                  } else {
                    setCurrentIndex((i) => i + 1);
                  }
                }}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
              >
                {isLast ? "Continue to mastery" : "Next section"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
