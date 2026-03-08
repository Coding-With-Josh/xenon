"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Mistake = {
  id: number;
  question: string;
  correctAnswer: string;
  userAnswer: string | null;
  explanation: string | null;
  subject: string;
  topic: string | null;
  createdAt: string;
};

export default function MistakesPage() {
  const [list, setList] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [explainingId, setExplainingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/mistakes")
      .then((res) => res.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  async function explain(id: number) {
    setExplainingId(id);
    try {
      const res = await fetch("/api/mistakes/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setList((prev) =>
        prev.map((m) => (m.id === id ? { ...m, explanation: data.explanation } : m))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setExplainingId(null);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Mistakes</h1>
        <p className="text-muted-foreground text-sm">Review incorrectly answered questions and get explanations.</p>
      </div>
      {list.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">No mistakes to review yet. Take a quiz to see incorrect answers here.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {list.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle className="text-base">{m.question}</CardTitle>
                <p className="text-muted-foreground text-xs">
                  {m.subject}
                  {m.topic ? ` · ${m.topic}` : ""} · {new Date(m.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  Your answer: <strong>{m.userAnswer ?? "—"}</strong>
                  <span className="text-destructive"> (Correct: {m.correctAnswer})</span>
                </p>
                {m.explanation ? (
                  <p className="text-muted-foreground text-sm">{m.explanation}</p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={explainingId !== null}
                    onClick={() => explain(m.id)}
                  >
                    {explainingId === m.id ? "Generating..." : "Explain with Xe"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
