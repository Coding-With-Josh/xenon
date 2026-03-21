"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Question = {
  id: string;
  type: "objective" | "theory";
  question: string;
  options?: string[]; // for objective
  correct?: string; // for objective
  explanation: string;
  markingScheme?: {
    points: string[];
    totalMarks: number;
  }; // for theory
};

type TheoryCheckResult = {
  score: number;
  feedback: string[];
  breakdown: string;
  improvedAnswer: string;
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
    type?: "quiz" | "exam";
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [theoryResults, setTheoryResults] = useState<Record<string, TheoryCheckResult>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checkingTheory, setCheckingTheory] = useState<Record<string, boolean>>({});

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

  async function checkTheoryAnswer(q: Question) {
    if (!answers[q.id]) return;
    setCheckingTheory(prev => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch("/api/quiz/theory/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          idealAnswer: q.explanation,
          studentAnswer: answers[q.id],
          markingScheme: q.markingScheme
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTheoryResults(prev => ({ ...prev, [q.id]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingTheory(prev => ({ ...prev, [q.id]: false }));
    }
  }

  if (loading) return <div className="p-4">Loading quiz...</div>;
  if (!session) return <div className="p-4">Quiz not found.</div>;

  const questions = (session.questions ?? []) as Question[];

  if (submitted && session.score != null) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif">Results</CardTitle>
            <CardDescription className="text-lg">
              {session.score} / {session.totalQuestions} ({session.totalQuestions ? Math.round((session.score! / session.totalQuestions) * 100) : 0}%)
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="space-y-6">
          {questions.map((q, idx) => {
            if (q.type === "theory") {
              const result = theoryResults[q.id];
              return (
                <Card key={q.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-base font-serif">Q{idx + 1}. {q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Your Answer:</p>
                      <p className="p-3 bg-muted rounded-md text-sm">{answers[q.id] || "No answer provided"}</p>
                    </div>
                    
                    {!result && !checkingTheory[q.id] && (
                      <Button variant="secondary" onClick={() => checkTheoryAnswer(q)}>
                        🤖 AI Answer Checker
                      </Button>
                    )}
                    
                    {checkingTheory[q.id] && (
                      <p className="text-sm text-primary animate-pulse">Xe AI is marking your answer...</p>
                    )}

                    {result && (
                      <div className="mt-4 p-4 border rounded-lg bg-primary/5 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">AI Score: {result.score} / {q.markingScheme?.totalMarks}</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Feedback:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {Array.isArray(result.feedback) ? result.feedback.map((f, i) => (
                              <li key={i}>{f}</li>
                            )) : <li>{result.feedback}</li>}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Marking Breakdown:</p>
                          <p className="text-sm text-muted-foreground">{result.breakdown}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Ideal WAEC Answer:</p>
                          <p className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">{q.explanation}</p>
                        </div>
                        {result.improvedAnswer && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold">✨ How to Improve Your Answer:</p>
                            <p className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm italic">{result.improvedAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }

            const userAnswer = answers[q.id]?.toUpperCase().slice(0, 1);
            const correct = userAnswer === q.correct;
            return (
              <Card key={q.id} className={correct ? "border-green-500/30" : "border-destructive/30"}>
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-base font-serif">Q{idx + 1}. {q.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((letter, i) => {
                      const isCorrect = letter === q.correct;
                      const isUser = letter === userAnswer;
                      return (
                        <div 
                          key={letter} 
                          className={`p-3 rounded-md text-sm border ${
                            isCorrect ? "bg-green-500/10 border-green-500/30" : 
                            isUser ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-transparent"
                          }`}
                        >
                          <strong>{letter}.</strong> {q.options?.[i] ?? ""}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-2 p-3 bg-primary/5 rounded-md text-sm">
                      <p className="font-semibold mb-1">Explanation:</p>
                      <p className="text-muted-foreground">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold">Study Session</h1>
          <p className="text-muted-foreground">Practice makes perfect. Take your time.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">Progress</p>
          <p className="text-lg font-bold">{Object.keys(answers).length} / {questions.length}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
        {questions.map((q, idx) => (
          <Card key={q.id} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Q{idx + 1}. {q.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {q.type === "theory" ? (
                <textarea
                  className="w-full min-h-[150px] p-4 rounded-md border border-input bg-background resize-none focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["A", "B", "C", "D"].map((letter, i) => (
                    <label 
                      key={letter} 
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        answers[q.id] === letter ? "bg-primary/10 border-primary" : "bg-muted/30 border-transparent hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={answers[q.id] === letter}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                        className="sr-only"
                      />
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold ${
                        answers[q.id] === letter ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input"
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm">{q.options?.[i] ?? ""}</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="w-full md:w-auto px-12" disabled={submitLoading}>
            {submitLoading ? "Submitting..." : "Finish Session"}
          </Button>
        </div>
      </form>
    </div>
  );
}
