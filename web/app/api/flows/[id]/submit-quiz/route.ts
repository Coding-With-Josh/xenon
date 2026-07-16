import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, flowStageProgress, questionAttempts, quizSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { FlowQuestion } from "@/lib/flows/types";

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
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body = await request.json();
    const { answers } = body as { answers?: Record<string, string> };
    if (!answers) {
      return NextResponse.json({ error: "answers required" }, { status: 400 });
    }

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get quiz data from the latest quiz stage progress
    const [quizProgress] = await db
      .select()
      .from(flowStageProgress)
      .where(
        and(
          eq(flowStageProgress.sessionId, sessionId),
          eq(flowStageProgress.stage, "quiz")
        )
      )
      .orderBy(flowStageProgress.createdAt)
      .limit(1);

    const questions = ((quizProgress?.data as { questions?: FlowQuestion[] })?.questions ?? []) as FlowQuestion[];
    if (questions.length === 0) {
      return NextResponse.json({ error: "No quiz questions found" }, { status: 400 });
    }

    let score = 0;
    const wrongAnswers: { questionId: string; subsectionId: string; correct: string; userAnswer: string }[] = [];

    for (const q of questions) {
      const userAnswer = (answers[q.id] ?? "").trim();
      const userLetter = userAnswer.toUpperCase().slice(0, 1);
      const correctLetter = (q.correct ?? "").toUpperCase().slice(0, 1);
      const isCorrect = q.type === "objective" ? userLetter === correctLetter : false;
      if (isCorrect) {
        score++;
      } else {
        wrongAnswers.push({
          questionId: q.id,
          subsectionId: q.subsectionId,
          correct: q.correct ?? "",
          userAnswer,
        });
      }
    }

    // Create a quiz session wrapper so question attempts can FK to it
    const [quizSession] = await db
      .insert(quizSessions)
      .values({
        type: "quiz",
        userId: session.user.id,
        subject: flowSession.subject,
        topic: flowSession.topic,
        questions: questions as unknown as Record<string, unknown>[],
        answers,
        score,
        totalQuestions: questions.length,
      })
      .returning();

    // Create question attempt records (FK to quizSession, not flowSession)
    for (const w of wrongAnswers) {
      await db.insert(questionAttempts).values({
        sessionId: quizSession.id,
        questionId: w.questionId,
        userAnswer: w.userAnswer,
        correct: false,
        subjectId: flowSession.subject,
        topicId: flowSession.topic,
        subsectionId: w.subsectionId,
        status: "outstanding",
        attempts: 1,
        firstMissedAt: new Date(),
        lastAttemptedAt: new Date(),
      });
    }

    const wrongSubsectionIds = [...new Set(wrongAnswers.map((w) => w.subsectionId))];

    // Update quiz progress data
    await db
      .update(flowStageProgress)
      .set({
        completed: true,
        data: {
          ...(quizProgress?.data as Record<string, unknown>),
          answers,
          score,
          wrongSubsectionIds,
        },
        updatedAt: new Date(),
      })
      .where(eq(flowStageProgress.id, quizProgress?.id ?? 0));

    return NextResponse.json({
      score,
      total: questions.length,
      wrongAnswers,
      wrongSubsectionIds,
    });
  } catch (e) {
    console.error("Quiz submit error:", e);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
