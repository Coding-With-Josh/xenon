"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation?: string;
};

export default function ExamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const durationMinutes = parseInt(searchParams.get("duration") ?? "60", 10);
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
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

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

  useEffect(() => {
    if (submitted || !session) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          fetch("/api/quiz/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: session.id, answers: answersRef.current }),
          })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
              if (ok) setSession((prev) => (prev ? { ...prev, score: data.score, totalQuestions: data.total } : null));
              setSubmitted(true);
            })
            .catch(() => setSubmitted(true));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, submitted]);

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
      setSession((prev) => (prev ? { ...prev, score: data.score, totalQuestions: data.total } : null));
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) return <div className="p-4">Loading exam...</div>;
  if (!session) return <div className="p-4">Exam not found.</div>;

  const questions = (session.questions ?? []) as Question[];
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timerStr = `${m}:${s.toString().padStart(2, "0")}`;

  if (submitted && session.score != null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Exam results</CardTitle>
            <CardContent className="pt-0">
              <p className="text-2xl font-medium">
                {session.score} / {session.totalQuestions} (
                {session.totalQuestions ? Math.round((session.score / session.totalQuestions) * 100) : 0}%)
              </p>
            </CardContent>
          </CardHeader>
        </Card>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium">Exam</h1>
        <div className="rounded-md border bg-muted px-3 py-1 font-mono text-lg">
          Time: {timerStr}
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Q{idx + 1}. {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["A", "B", "C", "D"].map((letter, i) => (
                <label key={letter} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name={q.id}
                    value={letter}
                    checked={answers[q.id] === letter}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                    className="rounded-full"
                  />
                  <span>
                    {letter}. {q.options[i] ?? ""}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
        <Button type="submit" disabled={submitLoading}>
          {submitLoading ? "Submitting..." : "Submit exam"}
        </Button>
      </form>
    </div>
  );
}
