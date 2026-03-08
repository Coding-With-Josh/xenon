import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { quizSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (Number.isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }
  const [quizSession] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.id, sessionId))
    .limit(1);
  if (!quizSession || quizSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: quizSession.id,
    type: quizSession.type,
    subject: quizSession.subject,
    topic: quizSession.topic,
    classLevel: quizSession.classLevel,
    questions: quizSession.questions,
    answers: quizSession.answers,
    score: quizSession.score,
    totalQuestions: quizSession.totalQuestions,
    timeSpentSeconds: quizSession.timeSpentSeconds,
    createdAt: quizSession.createdAt,
  });
}
