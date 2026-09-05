"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { RocketIcon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";

interface TopicEntry {
  topic: string;
  subtopics: string[];
}

type StartNewFlowSectionProps = {
  classLevel: string;
  onFlowStarted: () => void;
  inProgressTopics: Set<string>;
  completedTopics: Set<string>;
  variant?: "default" | "hero";
};

export function StartNewFlowSection({
  classLevel,
  onFlowStarted,
  inProgressTopics,
  completedTopics,
  variant = "default",
}: StartNewFlowSectionProps) {
  const router = useRouter();
  const [subjects] = useState(["Physics", "Chemistry", "Biology", "English Language"]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicEntry[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTopics = useCallback(async (subject: string) => {
    setTopicsLoading(true);
    setSelectedTopic(null);
    try {
      const res = await fetch(
        `/api/curriculum/topics?subject=${encodeURIComponent(subject)}&classLevel=${encodeURIComponent(classLevel)}`
      );
      const data = await res.json();
      if (res.ok) setTopics(data.topics ?? []);
      else setTopics([]);
    } catch {
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  }, [classLevel]);

  async function handleSelectSubject(subject: string) {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    await loadTopics(subject);
  }

  async function handleStartFlow() {
    if (!selectedSubject || !selectedTopic) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/flows/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject, topic: selectedTopic, classLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      onFlowStarted();
      router.push(`/flow/${data.session.slug}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      if (msg.includes("already have")) {
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const topicKey = (subject: string, topic: string) => `${subject}::${topic}`;
  const isHero = variant === "hero";

  const subjectBtnClass = (subject: string) => {
    const selected = selectedSubject === subject;
    if (isHero) {
      return `min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-all backdrop-blur-sm ${selected
          ? "border-white/60 bg-white/20 text-white ring-1 ring-white/30"
          : "border-white/20 bg-white/8 text-white/70 hover:text-white hover:bg-white/15 hover:border-white/40"
        }`;
    }
    return `min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selected
        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50"
      }`;
  };

  const topicBtnClass = (entry: TopicEntry) => {
    const key = topicKey(selectedSubject ?? "", entry.topic);
    const inProg = inProgressTopics.has(key);
    const selected = selectedTopic === entry.topic;
    if (inProg) {
      return `min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-not-allowed line-through ${isHero
          ? "border-white/10 bg-white/5 text-white/40"
          : "border-border/50 bg-muted/30 text-muted-foreground/50"
        }`;
    }
    if (isHero) {
      return `min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-all backdrop-blur-sm ${selected
          ? "border-white/60 bg-white/20 text-white ring-1 ring-white/30"
          : "border-white/20 bg-white/8 text-white/70 hover:text-white hover:bg-white/15 hover:border-white/40"
        }`;
    }
    return `min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selected
        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50"
      }`;
  };

  // Hero variant — matches the dashboard HeroCard gradient card.
  if (isHero) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-primary to-primary/80 p-8 text-primary-foreground">
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
            Start something new
          </p>
          <h2 className="font-serif text-2xl font-medium leading-tight">
            Pick a subject and topic to begin a guided study Flow
          </h2>

          {/* Subject selection */}
          <div className="flex flex-wrap gap-2 pt-1">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSelectSubject(subject)}
                className={subjectBtnClass(subject)}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Topic selection */}
          {selectedSubject &&
            (topicsLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg h-8 w-28 bg-white/10" />
                ))}
              </div>
            ) : topics.length === 0 ? (
              <p className="text-xs text-white/60">No topics found for this subject.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topics.map((entry) => {
                  const key = topicKey(selectedSubject, entry.topic);
                  const isInProg = inProgressTopics.has(key);
                  const isCompleted = completedTopics.has(key);
                  return (
                    <button
                      key={entry.topic}
                      onClick={() => !isInProg && setSelectedTopic(entry.topic)}
                      disabled={isInProg}
                      className={topicBtnClass(entry)}
                      title={
                        isInProg
                          ? "You already have an in-progress Flow on this topic"
                          : isCompleted
                            ? "You've completed this topic before"
                            : ""
                      }
                    >
                      {entry.topic}
                      {isCompleted && !isInProg && (
                        <span className="ml-1.5 text-[10px] text-white/50">(done)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

          {error && <p className="text-xs text-red-300">{error}</p>}

          <button
            disabled={!selectedSubject || !selectedTopic || loading}
            onClick={handleStartFlow}
            className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-5 py-2.5 text-sm font-medium text-black backdrop-blur-sm transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <Spinner size={14} />
            ) : (
              <>
                Start Flow
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute left-[30%] top-[10%] h-24 w-24 rounded-full bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground mb-3">Start a new Flow</h2>

      {/* Subject selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => handleSelectSubject(subject)}
            className={subjectBtnClass(subject)}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Topic selection */}
      {selectedSubject && (
        <div className="mb-4">
          {topicsLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`animate-pulse rounded-lg h-8 w-28 ${isHero ? "bg-white/10" : "bg-muted"}`} />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <p className={`text-xs ${isHero ? "text-white/60" : "text-muted-foreground"}`}>
              No topics found for this subject.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map((entry) => {
                const key = topicKey(selectedSubject, entry.topic);
                const isInProg = inProgressTopics.has(key);
                const isCompleted = completedTopics.has(key);

                return (
                  <button
                    key={entry.topic}
                    onClick={() => !isInProg && setSelectedTopic(entry.topic)}
                    disabled={isInProg}
                    className={topicBtnClass(entry)}
                    title={
                      isInProg
                        ? "You already have an in-progress Flow on this topic"
                        : isCompleted
                          ? "You've completed this topic before"
                          : ""
                    }
                  >
                    {entry.topic}
                    {isCompleted && !isInProg && (
                      <span className={`ml-1.5 text-[10px] ${isHero ? "text-white/50" : "text-muted-foreground/60"}`}>(done)</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className={`text-xs mb-3 ${isHero ? "text-red-300" : "text-destructive"}`}>{error}</p>}

      {isHero ? (
        <button
          disabled={!selectedSubject || !selectedTopic || loading}
          onClick={handleStartFlow}
          className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-white"
        >
          {loading ? <Spinner size={14} /> : <><HugeiconsIcon icon={RocketIcon} size={14} /> Start Flow</>}
        </button>
      ) : (
        <button
          disabled={!selectedSubject || !selectedTopic || loading}
          onClick={handleStartFlow}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Spinner size={14} /> : <><HugeiconsIcon icon={RocketIcon} size={14} /> Start Flow</>}
        </button>
      )}
    </section>
  );
}