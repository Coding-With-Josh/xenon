"use client";

import { useState, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, CheckmarkCircle01Icon, TimeHalfPassIcon, ArrowRight01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";

type MistakeAttempt = {
  id: number;
  sessionId: number;
  questionId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string | null;
  explanation: string | null;
  correct: boolean;
  subject: string;
  topic: string | null;
  subjectId: string | null;
  topicId: string | null;
  subsectionId: string | null;
  status: "outstanding" | "in_review" | "resolved";
  category: string | null;
  attempts: number;
  firstMissedAt: string | null;
  lastAttemptedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  concept: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  calculation: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  formula: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  reading: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  careless: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default function MistakesPage() {
  const [list, setList] = useState<MistakeAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categorizing, setCategorizing] = useState(false);

  const fetchMistakes = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/mistakes?${params}`);
      const data = await res.json();
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMistakes(statusFilter || undefined);
  }, [statusFilter, fetchMistakes]);

  const categorizeAll = useCallback(async () => {
    setCategorizing(true);
    const uncategorized = list.filter((m) => !m.category).map((m) => m.id);
    if (uncategorized.length === 0) return;
    try {
      await fetch("/api/mistakes/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptIds: uncategorized }),
      });
      fetchMistakes(statusFilter || undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setCategorizing(false);
    }
  }, [list, statusFilter, fetchMistakes]);

  const updateStatus = useCallback(async (id: number, status: string) => {
    try {
      await fetch("/api/mistakes/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: id, status }),
      });
      setList((prev) => prev.map((m) => (m.id === id ? { ...m, status: status as any, resolvedAt: status === "resolved" ? new Date().toISOString() : m.resolvedAt } : m)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const groupedBySubject = list.reduce<Record<string, MistakeAttempt[]>>((acc, m) => {
    const key = m.subject;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium">Mistakes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {list.length} {list.length === 1 ? "mistake" : "mistakes"}
            {list.filter((m) => m.status === "outstanding").length > 0 && (
              <span className="text-destructive ml-1">
                · {list.filter((m) => m.status === "outstanding").length} outstanding
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={categorizeAll}
            disabled={categorizing || list.filter((m) => !m.category).length === 0}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {categorizing ? <Spinner size={12} /> : "Auto-categorize"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {["", "outstanding", "in_review", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              statusFilter === s
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "" ? "All" : s === "outstanding" ? "Outstanding" : s === "in_review" ? "In Review" : "Resolved"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted animate-pulse rounded-xl h-28 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border p-8 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No mistakes to review yet.</p>
          <a href="/dashboard" className="text-sm text-primary font-medium hover:underline">
            Go to dashboard
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBySubject).map(([subject, mistakes]) => (
            <div key={subject} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{subject}</h2>
              <div className="space-y-3">
                {mistakes.map((m) => (
                  <div key={m.id} className="rounded-xl border p-5 space-y-3">
                    {/* Top row: status + category badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          m.status === "resolved"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : m.status === "in_review"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {m.status === "resolved" ? "Resolved" : m.status === "in_review" ? "In Review" : "Outstanding"}
                      </span>
                      {m.category && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            categoryColors[m.category] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {m.category}
                        </span>
                      )}
                      {m.topic && (
                        <span className="text-[11px] text-muted-foreground">{m.topic}</span>
                      )}
                      {m.subsectionId && (
                        <span className="text-[11px] text-muted-foreground">· {m.subsectionId}</span>
                      )}
                      {m.attempts > 1 && (
                        <span className="text-[11px] text-muted-foreground">· {m.attempts} attempts</span>
                      )}
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-sm font-medium leading-relaxed">{m.question}</p>

                    {/* Answers */}
                    <div className="flex gap-4 text-sm">
                      <p>
                        Your answer:{" "}
                        <span className="text-destructive font-medium">{m.userAnswer ?? "—"}</span>
                      </p>
                      <p>
                        Correct:{" "}
                        <span className="text-green-600 dark:text-green-400 font-medium">{m.correctAnswer}</span>
                      </p>
                    </div>

                    {/* Explanation */}
                    {m.explanation && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        {m.explanation}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {m.status !== "resolved" && (
                        <button
                          onClick={() => updateStatus(m.id, "resolved")}
                          className="rounded-lg border border-green-500/30 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-500/5 transition-colors"
                        >
                          Mark resolved
                        </button>
                      )}
                      {m.status === "outstanding" && (
                        <button
                          onClick={() => updateStatus(m.id, "in_review")}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Start review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
