"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation?: string;
};

export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<{
    id: number;
    questions: Question[];
    answers?: Record<string, string>;
    score?: number;
    totalQuestions?: number;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    fetch(`/api/quiz/session/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSession(data);
        setAnswers((data.answers as Record<string, string>) ?? {});
        if (data.score != null) setSubmitted(true);
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit() {
    if (!session?.id) return;
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession((prev) => prev ? { ...prev, score: data.score, totalQuestions: data.total } : null);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) return <div className="p-4">Loading quiz...</div>;
  if (!session) return <div className="p-4">Quiz not found.</div>;

  const questions = (session.questions ?? []) as Question[];

  if (submitted && session.score != null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardContent className="pt-0">
              <p className="text-2xl font-medium">
                {session.score} / {session.totalQuestions} ({session.totalQuestions ? Math.round((session.score! / session.totalQuestions) * 100) : 0}%)
              </p>
            </CardContent>
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {questions.map((q) => {
            const userAnswer = answers[q.id]?.toUpperCase().slice(0, 1);
            const correct = userAnswer === q.correct;
            return (
              <Card key={q.id} className={correct ? "" : "border-destructive/50"}>
                <CardHeader>
                  <CardTitle className="text-base">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    Your answer: <strong>{userAnswer ?? "-"}</strong>
                    {!correct && <span className="text-destructive"> (Correct: {q.correct})</span>}
                  </p>
                  {q.explanation && <p className="text-muted-foreground text-sm">{q.explanation}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-medium">Quiz</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">Q{idx + 1}. {q.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["A", "B", "C", "D"].map((letter, i) => (
                <label key={letter} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={q.id}
                    value={letter}
                    checked={answers[q.id] === letter}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                    className="rounded-full"
                  />
                  <span>{letter}. {q.options[i] ?? ""}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
        <Button type="submit" disabled={submitLoading}>
          {submitLoading ? "Submitting..." : "Submit quiz"}
        </Button>
      </form>
    </div>
  );
}
