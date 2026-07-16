import { db } from "@/db";
import {
  quizSessions,
  flowSessions,
  questionAttempts,
  flowStageProgress,
} from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export type ConsistencyDay = {
  date: string; // YYYY-MM-DD
  studied: boolean;
};

export type Milestone = {
  id: string;
  label: string;
  reached: boolean;
  detail?: string;
};

export type ConsistencyData = {
  currentRun: number;
  bestRun: number;
  totalDaysStudied: number;
  totalQuestionsAnswered: number;
  days: ConsistencyDay[]; // rolling window, oldest -> newest
  milestones: Milestone[];
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeRun(dates: Set<string>, from: Date): number {
  let run = 0;
  const cursor = new Date(from);
  // If today isn't a study day, the "current" run counts back from yesterday.
  if (!dates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(toDateKey(cursor))) {
    run += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return run;
}

function computeBestRun(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

export async function getConsistency(
  userId: string,
  weeks: number = 12
): Promise<ConsistencyData> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7 - 1);

  const [quizzes, flows, attempts] = await Promise.all([
    db
      .select({ createdAt: quizSessions.createdAt })
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId)),
    db
      .select({ createdAt: flowSessions.createdAt, completedAt: flowSessions.completedAt })
      .from(flowSessions)
      .where(eq(flowSessions.userId, userId)),
    db
      .select({ createdAt: questionAttempts.createdAt, attempts: questionAttempts.attempts })
      .from(questionAttempts)
      .innerJoin(quizSessions, eq(questionAttempts.sessionId, quizSessions.id))
      .where(eq(quizSessions.userId, userId)),
  ]);

  const studyDates = new Set<string>();
  for (const q of quizzes) if (q.createdAt) studyDates.add(toDateKey(q.createdAt));
  for (const f of flows) {
    if (f.createdAt) studyDates.add(toDateKey(f.createdAt));
    if (f.completedAt) studyDates.add(toDateKey(f.completedAt));
  }
  for (const a of attempts) if (a.createdAt) studyDates.add(toDateKey(a.createdAt));

  // Rolling window days
  const days: ConsistencyDay[] = [];
  const today = new Date();
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    days.push({ date: key, studied: studyDates.has(key) });
  }

  const totalQuestionsAnswered = attempts.reduce(
    (sum, a) => sum + (a.attempts ?? 1),
    0
  );

  const currentRun = computeRun(studyDates, new Date());
  const bestRun = computeBestRun(Array.from(studyDates));

  const milestones: Milestone[] = [
    {
      id: "first-7-day-run",
      label: "First 7-day run",
      reached: bestRun >= 7,
      detail: bestRun >= 7 ? `Longest run: ${bestRun} days` : undefined,
    },
    {
      id: "30-days-studied",
      label: "30 days studied",
      reached: studyDates.size >= 30,
      detail:
        studyDates.size >= 30 ? `${studyDates.size} days in total` : undefined,
    },
    {
      id: "100-questions",
      label: "100 questions answered",
      reached: totalQuestionsAnswered >= 100,
      detail:
        totalQuestionsAnswered >= 100
          ? `${totalQuestionsAnswered} questions answered`
          : undefined,
    },
    {
      id: "first-topic-mastered",
      label: "First topic mastered",
      reached: flows.some((f) => f.completedAt != null),
      detail: flows.some((f) => f.completedAt != null)
        ? "Completed a full Flow"
        : undefined,
    },
  ];

  return {
    currentRun,
    bestRun,
    totalDaysStudied: studyDates.size,
    totalQuestionsAnswered,
    days,
    milestones,
  };
}