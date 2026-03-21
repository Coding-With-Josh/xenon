"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StudyTask {
  subject: string;
  topic: string;
  type: "notes" | "quiz" | "practice";
  completed: boolean;
}

export function StudyPlannerCard() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<StudyTask[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study-plan/today")
      .then((res) => res.json())
      .then((data) => {
        setPlan(data.tasks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  async function generatePlan() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examType: "WAEC", // Default, can be dynamic later
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days out
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      // Refresh plan
      const todayRes = await fetch("/api/study-plan/today");
      const todayData = await todayRes.json();
      setPlan(todayData.tasks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <Skeleton className="h-[200px] w-full" />;

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>🧠</span> AI Study Planner
            </CardTitle>
            <CardDescription>Your personalized daily study goal.</CardDescription>
          </div>
          {plan.length === 0 && (
            <Button size="sm" onClick={generatePlan} disabled={generating}>
              {generating ? "Generating..." : "Generate Plan"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.length > 0 ? (
          <div className="space-y-3">
            {plan.map((task, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                <input type="checkbox" checked={task.completed} className="w-4 h-4 rounded-md border border-primary text-primary" readOnly />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.subject} – {task.topic}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {task.type} session
                  </p>
                </div>
                <div className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full font-bold">
                  TODAY
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">No plan for today yet.</p>
            {error && <p className="text-xs text-destructive mb-4">{error}</p>}
            <Button variant="outline" onClick={generatePlan} disabled={generating}>
              {generating ? "Generating..." : "🚀 Auto-Generate Timetable"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
