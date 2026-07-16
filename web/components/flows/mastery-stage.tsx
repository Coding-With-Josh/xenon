"use client";

import { useState, useEffect, useCallback } from "react";
import { getStageData, type QuizData, type MasteryContent, type FlowStageProgress } from "@/lib/flows/types";
import { Spinner } from "@/components/ui/spinner";

type MasteryStageProps = {
  progress: FlowStageProgress[];
  sessionId: number;
  subject: string;
  topic: string;
  onAdvance: () => void;
  loading: boolean;
};

const tabs = ["Exam Tips", "Mnemonics", "Shortcuts & Formulas", "Flashcards"] as const;

export function MasteryStage({
  progress,
  sessionId,
  subject,
  topic,
  onAdvance,
  loading,
}: MasteryStageProps) {
  const quizProgress = progress.find((p) => p.stage === "quiz");
  const quizData = quizProgress ? getStageData<QuizData>(quizProgress) : null;
  const score = quizData?.score ?? 0;
  const total = quizData?.questions?.length ?? 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const [content, setContent] = useState<MasteryContent | null>(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Exam Tips");

  // Flash-card state
  const [flipIdx, setFlipIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/flows/${sessionId}/mastery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load mastery content");
        const data = await res.json();
        if (!cancelled) setContent(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  const handleNextCard = useCallback(() => {
    const cards = content?.flashCards ?? [];
    const next = (flipIdx + 1) % cards.length;
    setFlipIdx(next);
    setFlipped(false);
  }, [content, flipIdx]);

  const handlePrevCard = useCallback(() => {
    const cards = content?.flashCards ?? [];
    const next = (flipIdx - 1 + cards.length) % cards.length;
    setFlipIdx(next);
    setFlipped(false);
  }, [content, flipIdx]);

  const toggleMastered = useCallback((idx: number) => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  if (generating) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 space-y-4 animate-in fade-in duration-500">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Spinner size={24} />
          </div>
          <p className="text-sm text-muted-foreground">Preparing your mastery guide...</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted animate-pulse rounded-xl h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

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

  const cards = content?.flashCards ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-serif text-2xl font-medium">Topic Complete!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            You scored <span className="font-semibold text-foreground">{score}/{total}</span>
            {total > 0 && (
              <span className={pct >= 70 ? "text-green-500" : pct >= 50 ? "text-amber-500" : "text-destructive"}>
                {" "}({pct}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2 text-xs font-medium rounded-t-lg transition-colors active:scale-[0.98] ${
              activeTab === tab
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "Exam Tips" && content?.examTips && (
          <div className="space-y-3">
            {content.examTips.map((tip, i) => (
              <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Mnemonics" && content && (
          <div className="space-y-6">
            {content.memoryTechniques?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Memory Tricks</p>
                {content.memoryTechniques.map((m, i) => (
                  <div key={i} className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{m.mnemonic}</p>
                    <p className="text-sm text-muted-foreground">{m.explanation}</p>
                  </div>
                ))}
              </div>
            )}
            {content.abbreviations?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Abbreviations</p>
                <div className="grid gap-2">
                  {content.abbreviations.map((a, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono font-semibold">{a.abbr}</code>
                        <span className="text-sm font-medium">{a.meaning}</span>
                      </div>
                      {a.context && (
                        <p className="text-xs text-muted-foreground">{a.context}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Shortcuts & Formulas" && content && (
          <div className="space-y-6">
            {content.shortcuts?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shortcuts & Tricks</p>
                {content.shortcuts.map((s, i) => (
                  <div key={i} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                ))}
              </div>
            )}
            {content.keyFormulas?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Formulas</p>
                <div className="grid gap-2">
                  {content.keyFormulas.map((f, i) => (
                    <div key={i} className="rounded-xl border p-4 text-sm leading-relaxed">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Flashcards" && (
          <div className="space-y-6">
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No flashcards available.</p>
            ) : (
              <>
                {/* Progress */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{flipIdx + 1} of {cards.length}</span>
                  <span>{mastered.size} mastered</span>
                </div>

                {/* Card */}
                <div className="perspective-1000" style={{ perspective: "1000px" }}>
                  <button
                    onClick={() => setFlipped((f) => !f)}
                    className="w-full cursor-pointer"
                    style={{ minHeight: "200px" }}
                  >
                    <div
                      className="relative w-full transition-transform duration-500"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        minHeight: "200px",
                      }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 rounded-xl border-2 p-6 flex items-center justify-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <p className="text-center text-sm font-medium leading-relaxed">{cards[flipIdx].front}</p>
                      </div>
                      {/* Back */}
                      <div
                        className="absolute inset-0 rounded-xl border-2 border-green-500/30 bg-green-500/5 p-6 flex items-center justify-center"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <p className="text-center text-sm leading-relaxed">{cards[flipIdx].back}</p>
                      </div>
                    </div>
                  </button>
                </div>

                <p className="text-center text-xs text-muted-foreground">Tap card to flip</p>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handlePrevCard}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted active:scale-[0.98] transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => toggleMastered(flipIdx)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium active:scale-[0.98] transition-colors ${
                      mastered.has(flipIdx)
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mastered.has(flipIdx) ? "Mastered" : "Mark known"}
                  </button>
                  <button
                    onClick={handleNextCard}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted active:scale-[0.98] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="flex justify-center pt-4 border-t border-border">
        <button
          onClick={onAdvance}
          disabled={loading}
          className="rounded-lg bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-colors"
        >
          {loading ? <Spinner size={14} /> : "Mark topic as complete"}
        </button>
      </div>
    </div>
  );
}
