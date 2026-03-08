"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "English Language"] as const;

export function GenerateNoteCard() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [fullNote, setFullNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const promptText = topic.trim() || "General revision notes";
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          subject,
          topic: topic.trim() || undefined,
          fullNote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to generate notes");
        return;
      }
      if (data.id) {
        router.push(`/notes/${data.id}`);
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a note</CardTitle>
        <CardDescription>Create study notes on any topic. Use &quot;Full note&quot; for a longer, exam-ready revision note.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
            <select
              id="subject"
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
            <label htmlFor="topic" className="text-sm font-medium">Topic or prompt</label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Acids and bases, Photosynthesis"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fullNote"
              checked={fullNote}
              onChange={(e) => setFullNote(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="fullNote" className="cursor-pointer text-sm font-normal">
              Full note (longer, more detailed, exam-ready)
            </label>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Generating…" : "Generate note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
