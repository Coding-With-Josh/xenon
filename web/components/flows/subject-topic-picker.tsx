"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { BrainIcon, RocketIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface SubjectTopicPickerProps {
  classLevel: string;
  subjects: string[];
}

interface TopicEntry {
  topic: string;
  subtopics: string[];
}

export function SubjectTopicPicker({ classLevel, subjects }: SubjectTopicPickerProps) {
  const router = useRouter();
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
      const res = await fetch(`/api/curriculum/topics?subject=${encodeURIComponent(subject)}&classLevel=${encodeURIComponent(classLevel)}`);
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
      router.push(`/flow/${data.session.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Start a Flow</h1>
        <p className="text-muted-foreground text-sm">
          Pick a subject and topic. Xenon will guide you through notes, checks, and a quiz.
        </p>
      </div>

      {/* Subject selection */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Subject</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => handleSelectSubject(subject)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedSubject === subject
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <p className="font-serif text-lg font-medium">{subject}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {classLevel} &middot; {subject === "Physics" ? "Mechanics, Waves, etc." : subject === "Chemistry" ? "Atoms, Reactions, etc." : subject === "Biology" ? "Cells, Genetics, etc." : "Grammar, Lit, etc."}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Topic selection */}
      {selectedSubject && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Topic</h2>
          {topicsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border p-4">
                  <div className="bg-muted h-5 w-3/4 rounded" />
                  <div className="bg-muted mt-2 h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : topics.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">No topics found for this subject.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((entry) => (
                <button
                  key={entry.topic}
                  onClick={() => setSelectedTopic(entry.topic)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedTopic === entry.topic
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium">{entry.topic}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {entry.subtopics.length} subsections
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        size="lg"
        className="w-full h-12 text-lg"
        disabled={!selectedSubject || !selectedTopic || loading}
        onClick={handleStartFlow}
      >
        {loading ? <Spinner size={16} /> : <><HugeiconsIcon icon={RocketIcon} size={16} /> Start Flow</>}
      </Button>
    </div>
  );
}
