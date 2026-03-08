"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] as const;
const SUBJECTS = ["Physics", "Chemistry", "Biology", "English Language"] as const;

export function ProfileForm({
  initialClassLevel,
  initialSubjects,
}: {
  initialClassLevel: string;
  initialSubjects: string[];
}) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [classLevel, setClassLevel] = useState(initialClassLevel);
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSubject(subject: string) {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classLevel || subjects.length === 0) {
      setError("Please select your class level and at least one subject.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classLevel, subjects }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Update failed");
        setLoading(false);
        return;
      }
      await updateSession({ classLevel, subjects });
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-6">
      <div>
        <label className="text-sm font-medium">Class level</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLASS_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setClassLevel(level)}
              className={`rounded-md border px-3 py-2 text-sm ${
                classLevel === level
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Subjects (select at least one)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => toggleSubject(subject)}
              className={`rounded-md border px-3 py-2 text-sm ${
                subjects.includes(subject)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
