import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { quizSessions, questionAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { sessionId, answers, timeSpentSeconds } = body as {
      sessionId?: number;
      answers?: Record<string, string>;
      timeSpentSeconds?: number;
    };
    if (sessionId == null || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "sessionId and answers required" }, { status: 400 });
    }
    const [quizSession] = await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId))
      .limit(1);
    if (!quizSession || quizSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const questions = (quizSession.questions as { id: string; correct: string }[]) ?? [];
    let score = 0;
    const attempts: { questionId: string; userAnswer: string | null; correct: boolean }[] = [];
    for (const q of questions) {
      const userAnswer = answers[q.id]?.trim().toUpperCase().slice(0, 1) ?? null;
      const correct = userAnswer === q.correct;
      if (correct) score++;
      attempts.push({ questionId: q.id, userAnswer, correct });
    }
    await db
      .update(quizSessions)
      .set({
        answers,
        score,
        timeSpentSeconds: timeSpentSeconds ?? null,
      })
      .where(eq(quizSessions.id, sessionId));
    for (const a of attempts) {
      await db.insert(questionAttempts).values({
        sessionId,
        questionId: a.questionId,
        userAnswer: a.userAnswer,
        correct: a.correct,
      });
    }
    return NextResponse.json({
      score,
      total: questions.length,
      percentage: questions.length ? Math.round((score / questions.length) * 100) : 0,
    });
  } catch (e) {
    console.error("Quiz submit error:", e);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
