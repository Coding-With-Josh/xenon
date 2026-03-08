import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { questionAttempts, quizSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wrong = await db
    .select({
      id: questionAttempts.id,
      sessionId: questionAttempts.sessionId,
      questionId: questionAttempts.questionId,
      userAnswer: questionAttempts.userAnswer,
      explanation: questionAttempts.explanation,
      createdAt: questionAttempts.createdAt,
      subject: quizSessions.subject,
      topic: quizSessions.topic,
      questions: quizSessions.questions,
    })
    .from(questionAttempts)
    .innerJoin(quizSessions, eq(questionAttempts.sessionId, quizSessions.id))
    .where(and(eq(quizSessions.userId, session.user.id), eq(questionAttempts.correct, false)))
    .orderBy(desc(questionAttempts.createdAt));
  const list = wrong.map((r) => {
    const q = (r.questions as { id: string; correct: string; question: string; options?: string[] }[])?.find(
      (x) => x.id === r.questionId
    );
    return {
      id: r.id,
      sessionId: r.sessionId,
      question: q?.question ?? "",
      correctAnswer: q?.correct ?? "",
      userAnswer: r.userAnswer,
      explanation: r.explanation,
      subject: r.subject,
      topic: r.topic,
      createdAt: r.createdAt,
    };
  });
  return NextResponse.json(list);
}
