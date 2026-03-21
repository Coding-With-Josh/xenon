"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GenerateQuizCard() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("waec-standard");
  const [type, setType] = useState("objective");
  const [isPrompt, setIsPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topicOrPrompt: topic.trim(), 
          numQuestions, 
          difficulty, 
          questionType: type,
          isPrompt
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.sessionId) router.push(`/quiz/${data.sessionId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🧠</span> AI Study Planner
        </CardTitle>
        <CardDescription>Generate a custom quiz or use a natural language prompt.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isPrompt ? "What should I test you on?" : "Topic or Concept"}
            </label>
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={isPrompt ? "e.g. Give me 10 hard WAEC questions on electrolysis" : "e.g. Photosynthesis, Newton's Laws"}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPrompt(!isPrompt)}
                className={isPrompt ? "bg-primary/10" : ""}
              >
                {isPrompt ? "Form Mode" : "Prompt Mode"}
              </Button>
            </div>
          </div>

          {!isPrompt && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Questions</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  disabled={loading}
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={50}>50 Questions (Custom)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="waec-standard">WAEC Standard</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={loading}
                >
                  <option value="objective">Objective (MCQ)</option>
                  <option value="theory">Theory</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-lg" disabled={loading || !topic.trim()}>
            {loading ? "Generating Quiz..." : "🚀 Generate Study Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
