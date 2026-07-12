import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, questionAttempts, quizSessions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });

    const body = await request.json();
    const { subsectionId, results } = body as {
      subsectionId?: string;
      results?: { question: string; correct: boolean; userAnswer: string; correctAnswer: string; explanation: string }[];
    };
    if (!subsectionId || !results) {
      return NextResponse.json({ error: "subsectionId and results required" }, { status: 400 });
    }

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);
    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the quiz session for this flow to get a sessionId FK
    const [quizSession] = await db
      .select()
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.userId, session.user.id),
          eq(quizSessions.subject, flowSession.subject),
          eq(quizSessions.topic, flowSession.topic),
        )
      )
      .orderBy(quizSessions.createdAt)
      .limit(1);

    const quizSessionId = quizSession?.id;
    if (!quizSessionId) {
      return NextResponse.json({ error: "No quiz session found" }, { status: 400 });
    }

    // Write each retry result as a question_attempts row
    const now = new Date();
    for (const r of results) {
      await db.insert(questionAttempts).values({
        sessionId: quizSessionId,
        questionId: `remediation-${subsectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userAnswer: r.userAnswer,
        correct: r.correct,
        explanation: r.explanation,
        subjectId: flowSession.subject,
        topicId: flowSession.topic,
        subsectionId,
        status: r.correct ? "resolved" : "outstanding",
        attempts: r.correct ? 1 : 1,
        firstMissedAt: r.correct ? undefined : now,
        lastAttemptedAt: now,
        resolvedAt: r.correct ? now : undefined,
      });
    }

    // Resolve outstanding mistakes for this subsection if all retry questions were correct
    const allCorrect = results.every((r) => r.correct);
    if (allCorrect) {
      const outstanding = await db
        .select()
        .from(questionAttempts)
        .where(
          and(
            eq(questionAttempts.subsectionId, subsectionId),
            eq(questionAttempts.status, "outstanding"),
            eq(questionAttempts.correct, false),
          )
        );

      if (outstanding.length > 0) {
        const ids = outstanding.map((a) => a.id);
        await db
          .update(questionAttempts)
          .set({ status: "resolved", resolvedAt: now })
          .where(inArray(questionAttempts.id, ids));
      }
    }

    return NextResponse.json({ recorded: results.length, allCorrect });
  } catch (e) {
    console.error("Remediation record error:", e);
    return NextResponse.json({ error: "Failed to record remediation results" }, { status: 500 });
  }
}
