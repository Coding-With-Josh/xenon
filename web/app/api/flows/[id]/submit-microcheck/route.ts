import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, flowStageProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    const { subsectionIndex, answers } = body as {
      subsectionIndex?: number;
      answers?: Record<string, string>;
    };
    if (subsectionIndex == null || !answers) {
      return NextResponse.json({ error: "subsectionIndex and answers required" }, { status: 400 });
    }

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get the micro-check data from the stage progress
    const [progress] = await db
      .select()
      .from(flowStageProgress)
      .where(
        and(
          eq(flowStageProgress.sessionId, sessionId),
          eq(flowStageProgress.stage, "microcheck"),
          eq(flowStageProgress.subsectionIndex, subsectionIndex)
        )
      )
      .orderBy(flowStageProgress.createdAt)
      .limit(1);

    const questions = ((progress?.data as { questions?: { id: string; correct: string }[] })?.questions ?? []) as {
      id: string;
      correct: string;
    }[];

    let score = 0;
    const wrongAnswers: { questionId: string; correct: string; userAnswer: string }[] = [];

    for (const q of questions) {
      const userAnswer = (answers[q.id] ?? "").trim().toUpperCase().slice(0, 1);
      const isCorrect = userAnswer === (q.correct ?? "").toUpperCase().slice(0, 1);
      if (isCorrect) {
        score++;
      } else {
        wrongAnswers.push({
          questionId: q.id,
          correct: q.correct,
          userAnswer,
        });
      }
    }

    const pass = score >= questions.length; // all correct to pass
    const subsectionId = `${flowSession.subject}-${flowSession.topic}-${subsectionIndex}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    // Record micro-check result in progress data
    await db
      .update(flowStageProgress)
      .set({
        completed: true,
        data: {
          ...(progress?.data as Record<string, unknown>),
          answers,
          score,
          pass,
        },
        updatedAt: new Date(),
      })
      .where(eq(flowStageProgress.id, progress?.id ?? 0));

    return NextResponse.json({
      pass,
      score,
      total: questions.length,
      wrongAnswers,
      subsectionId,
    });
  } catch (e) {
    console.error("Micro-check submit error:", e);
    return NextResponse.json({ error: "Failed to submit micro-check" }, { status: 500 });
  }
}
