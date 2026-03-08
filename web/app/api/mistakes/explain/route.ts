import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { questionAttempts, quizSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { explainWrongAnswer } from "@/lib/ai/explain";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { attemptId } = body as { attemptId?: number };
    if (attemptId == null) {
      return NextResponse.json({ error: "attemptId required" }, { status: 400 });
    }
    const [attempt] = await db
      .select()
      .from(questionAttempts)
      .where(eq(questionAttempts.id, attemptId))
      .limit(1);
    if (!attempt || !attempt.sessionId) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    const [sessionRow] = await db
      .select({ userId: quizSessions.userId, questions: quizSessions.questions })
      .from(quizSessions)
      .where(eq(quizSessions.id, attempt.sessionId))
      .limit(1);
    if (!sessionRow || sessionRow.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const questions = (sessionRow.questions as { id: string; question: string; correct: string }[]) ?? [];
    const q = questions.find((x) => x.id === attempt.questionId);
    if (!q) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    const explanation = await explainWrongAnswer(
      q.question,
      q.correct,
      attempt.userAnswer ?? ""
    );
    await db
      .update(questionAttempts)
      .set({ explanation })
      .where(eq(questionAttempts.id, attemptId));
    return NextResponse.json({ explanation });
  } catch (e) {
    console.error("Explain error:", e);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
