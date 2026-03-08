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
  }, [subject, numQuestions, durationMinutes, router]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Exam simulation</h1>
        <p className="text-muted-foreground text-sm">WAEC/JAMB-style timed practice exam.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Start exam</CardTitle>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Number of questions</label>
              <Input
                type="number"
                min={10}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 25)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                min={15}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={startExam} disabled={loading}>
              {loading ? "Starting..." : "Start exam"}
            </Button>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
