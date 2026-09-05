"use client";

import { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { getStageData, type QuizData, type FlowQuestion, type FlowStageProgress } from "@/lib/flows/types";
import { Spinner } from "@/components/ui/spinner";
import { ExplanationText } from "./explanation-text";
import { play } from "cuelume";

type QuizStageProps = {
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

export function QuizStage({
  subsectionIndex,
  subsections,
  progress,
  sessionId,
  subject,
  topic,
  onAdvance,
  onRetry,
  loading,
}: QuizStageProps) {
  const quizProgress = progress.find((p) => p.stage === "quiz");
  const quizData = quizProgress ? getStageData<QuizData>(quizProgress) : null;
  const questions = quizData?.questions ?? null;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    wrongAnswers: { questionId: string; subsectionId: string; correct: string; userAnswer: string }[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
          if (!res.ok) throw new Error("Failed to generate quiz");
          // Soft ambient cue: background generation finished while they read notes.
          play("droplet");
          window.location.reload();
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to generate quiz");
          setAutoLoading(false);
        });
    }
  }, [questions, loading, sessionId]);

  const handleSelect = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    play("tick");
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flows/${sessionId}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setResult(data);
      setSubmitted(true);
      // Final result: a pass (more than half) is celebrated with chime; a miss
      // of the threshold gets the softer droplet. setEnabled gate covers
      // off/exam states.
      if (data.score > data.total / 2) play("chime");
      else play("droplet");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, answers]);

  const allAnswered = questions ? questions.every((q) => answers[q.id]) : false;

  const handleGenerate = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/flows/${sessionId}/generate-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz");
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
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

  if (loading || autoLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted animate-pulse rounded-xl h-6 w-1/3" />
        <div className="bg-muted animate-pulse rounded-xl h-4 w-1/4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3">
            <div className="bg-muted animate-pulse rounded h-4 w-3/4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="bg-muted animate-pulse rounded-lg h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    if (!error) return null;
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

  const objectiveQuestions = questions.filter((q) => q.type === "objective");
  const theoryQuestions = questions.filter((q) => q.type === "theory");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Full Quiz
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </p>
        </div>
        {submitted && result && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              result.score >= Math.ceil(result.total / 2)
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {result.score}/{result.total}
          </span>
        )}
      </div>

      <h3 className="font-serif text-xl font-medium">Topic Quiz</h3>

      {objectiveQuestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Objective Questions
          </p>
          {objectiveQuestions.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              selected={answers[q.id] ?? null}
              onSelect={(option) => handleSelect(q.id, option)}
              showResult={submitted && result !== null}
              isCorrect={
                submitted && result
                  ? answers[q.id]?.toUpperCase().slice(0, 1) === q.correct?.toUpperCase().slice(0, 1)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {theoryQuestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Theory Questions
          </p>
          {theoryQuestions.map((q, index) => (
            <TheoryCard
              key={q.id}
              question={q}
              index={objectiveQuestions.length + index + 1}
            />
          ))}
        </div>
      )}

      {!submitted ? (
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            data-cuelume-press
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-colors"
          >
            {submitting ? <Spinner size={14} /> : "Submit answers"}
          </button>
        </div>
      ) : (
        <div className="flex gap-3 pt-2">
          <button
            onClick={onAdvance}
            data-cuelume-press
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors"
          >
            {result && result.wrongAnswers.length > 0
              ? "Review mistakes"
              : "Mark complete"}
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  selected,
  onSelect,
  showResult,
  isCorrect,
}: {
  question: FlowQuestion;
  index: number;
  selected: string | null;
  onSelect: (option: string) => void;
  showResult: boolean;
  isCorrect?: boolean;
}) {
  const optionLabels = ["A", "B", "C", "D"];
  const options = question.options ?? [];
  const gridRef = useRef<HTMLDivElement>(null);
  const [singleCol, setSingleCol] = useState(false);

  useEffect(() => {
    // Droplet on a wrong answer (per explicit request). The correct-answer cue
    // for the full quiz is the chime at the final pass/fail result, not per
    // question, so per-question we only mark a miss. setEnabled gate covers
    // off/exam states.
    if (showResult && isCorrect === false) play("droplet");
  }, [showResult, isCorrect]);

  // Keep the 2x2 grid by default — including on mobile, since scanning speed
  // matters most on phones. Fall back to a single column only when an option's
  // *rendered* width can't sit comfortably in half the grid width. We measure
  // actual pixel width (not a character count) so the 115% global font scaling
  // is accounted for.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>("button"));
      if (buttons.length === 0) return;
      const maxOptWidth = Math.max(...buttons.map((b) => b.scrollWidth));
      const gap = 8; // gap-2
      const twoColWidth = (grid.clientWidth - gap) / 2;
      setSingleCol(maxOptWidth > twoColWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [options]);

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <p className="text-sm font-medium leading-relaxed">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        {question.question}
      </p>

      <div ref={gridRef} className={`grid ${singleCol ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
        {options.map((option, oi) => {
          const label = optionLabels[oi];
          const isSelected = selected?.toUpperCase().slice(0, 1) === label;
          const isCorrectOption = showResult && label === question.correct?.toUpperCase().slice(0, 1);
          const isWrongOption = showResult && isSelected && !isCorrectOption;

          return (
            <button
              key={label}
              onClick={() => !showResult && onSelect(option)}
              disabled={showResult}
              className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all duration-150 ${
                isSelected && !showResult
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : isCorrectOption && showResult
                    ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/30"
                    : isWrongOption && showResult
                      ? "border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                      : "border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5"
              } ${showResult ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isSelected && !showResult
                    ? "bg-primary text-primary-foreground"
                    : isCorrectOption && showResult
                      ? "bg-green-500 text-white"
                      : isWrongOption && showResult
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </span>
              <span className="flex-1">{option.replace(/^[A-D]\)\s*/, "")}</span>
              {isCorrectOption && showResult && (
                <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isWrongOption && showResult && (
                <svg className="h-4 w-4 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div
          className={`rounded-lg p-3 ${
            isCorrect
              ? "bg-green-500/5 text-green-700 dark:text-green-300"
              : "bg-amber-500/5 text-amber-700 dark:text-amber-300"
          }`}
        >
          {isCorrect ? (
            <ExplanationText>{question.explanation}</ExplanationText>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Correct answer: {question.correct}</p>
              <ExplanationText>{question.explanation}</ExplanationText>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TheoryCard({
  question,
  index,
}: {
  question: FlowQuestion;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <p className="text-sm font-medium leading-relaxed">
        <span className="text-muted-foreground mr-2">{index}.</span>
        {question.question}
      </p>
      {question.markingScheme && (
        <p className="text-xs text-muted-foreground">
          [{question.markingScheme.totalMarks} marks]
        </p>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary font-medium hover:underline active:scale-[0.98] transition-transform"
      >
        {expanded ? "Hide marking scheme" : "Show marking scheme"}
      </button>
      {expanded && question.markingScheme && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Marking scheme
          </p>
          {question.markingScheme.points.map((point, i) => (
            <p key={i} className="text-sm text-foreground">&bull; {point}</p>
          ))}
          <div className="border-t border-border pt-1.5 mt-1.5">
            <p className="text-xs text-muted-foreground">
              Total: {question.markingScheme.totalMarks} marks
            </p>
          </div>
        </div>
      )}
      {expanded && question.explanation && (
        <div className="rounded-lg bg-blue-500/5 p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Model answer
          </p>
          <p className="text-sm text-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
