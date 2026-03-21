"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "English Language"];

export default function ExamStartPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("Physics");
  const [numQuestions, setNumQuestions] = useState(25);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mode, setMode] = useState<"full" | "topic" | "prompt">("full");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState("waec-standard");
  const [questionType, setQuestionType] = useState("mixed");
  const [loading, setLoading] = useState(false);

  const startExam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          numQuestions,
          durationMinutes,
          mode,
          topic: mode === "topic" ? topic : null,
          prompt: mode === "prompt" ? prompt : null,
          difficulty,
          questionType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.sessionId) router.push(`/exam/${data.sessionId}?duration=${data.durationMinutes}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [subject, numQuestions, durationMinutes, mode, topic, prompt, difficulty, questionType, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-4xl font-bold">Exam Simulation</h1>
        <p className="text-muted-foreground text-lg">Master your exams with WAEC/JAMB-style timed practice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant={mode === "full" ? "default" : "outline"} 
          className="h-16 text-lg font-serif"
          onClick={() => setMode("full")}
        >
          🏆 Full Simulation
        </Button>
        <Button 
          variant={mode === "topic" ? "default" : "outline"} 
          className="h-16 text-lg font-serif"
          onClick={() => setMode("topic")}
        >
          🎯 Topic Focus
        </Button>
        <Button 
          variant={mode === "prompt" ? "default" : "outline"} 
          className="h-16 text-lg font-serif"
          onClick={() => setMode("prompt")}
        >
          🤖 AI Prompt
        </Button>
      </div>

      <Card className="shadow-xl border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">
            {mode === "full" && "Full WAEC/JAMB Simulation"}
            {mode === "topic" && "Topic-Based Exam Practice"}
            {mode === "prompt" && "Custom AI-Generated Exam"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "prompt" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your exam</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Set a 1-hour WAEC exam on waves and electricity with 40 questions"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {mode === "topic" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Focus Topic</label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Organic Chemistry"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Questions</label>
                  <Input
                    type="number"
                    min={10}
                    max={50}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 25)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="waec-standard">WAEC Standard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="objective">Objective (MCQ)</option>
                    <option value="theory">Theory</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <Button className="w-full h-12 text-lg font-serif" onClick={startExam} disabled={loading}>
            {loading ? "Preparing Exam..." : "🚀 Start Exam Simulation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
