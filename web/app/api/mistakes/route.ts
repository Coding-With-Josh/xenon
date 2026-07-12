import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { questionAttempts, quizSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const subsectionFilter = url.searchParams.get("subsectionId");

  const conditions = [
    eq(quizSessions.userId, session.user.id),
    eq(questionAttempts.correct, false),
  ];
  if (statusFilter) {
    conditions.push(eq(questionAttempts.status, statusFilter as any));
  }
  if (subsectionFilter) {
    conditions.push(eq(questionAttempts.subsectionId, subsectionFilter));
  }

  const wrong = await db
    .select({
      id: questionAttempts.id,
      sessionId: questionAttempts.sessionId,
      questionId: questionAttempts.questionId,
      userAnswer: questionAttempts.userAnswer,
      explanation: questionAttempts.explanation,
      correct: questionAttempts.correct,
      subjectId: questionAttempts.subjectId,
      topicId: questionAttempts.topicId,
      subsectionId: questionAttempts.subsectionId,
      status: questionAttempts.status,
      category: questionAttempts.category,
      attempts: questionAttempts.attempts,
      firstMissedAt: questionAttempts.firstMissedAt,
      lastAttemptedAt: questionAttempts.lastAttemptedAt,
      resolvedAt: questionAttempts.resolvedAt,
      createdAt: questionAttempts.createdAt,
      subject: quizSessions.subject,
      topic: quizSessions.topic,
      questions: quizSessions.questions,
    })
    .from(questionAttempts)
    .innerJoin(quizSessions, eq(questionAttempts.sessionId, quizSessions.id))
    .where(and(...conditions))
    .orderBy(desc(questionAttempts.createdAt));

  const list = wrong.map((r) => {
    const q = (r.questions as { id: string; correct: string; question: string; options?: string[] }[])?.find(
      (x) => x.id === r.questionId
    );
    return {
      id: r.id,
      sessionId: r.sessionId,
      questionId: r.questionId,
      question: q?.question ?? "",
      correctAnswer: q?.correct ?? "",
      userAnswer: r.userAnswer,
      explanation: r.explanation,
      correct: r.correct,
      subject: r.subject,
      topic: r.topic,
      subjectId: r.subjectId,
      topicId: r.topicId,
      subsectionId: r.subsectionId,
      status: r.status,
      category: r.category,
      attempts: r.attempts,
      firstMissedAt: r.firstMissedAt,
      lastAttemptedAt: r.lastAttemptedAt,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
    };
  });
  return NextResponse.json(list);
}
