import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, flowStageProgress } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { FlowStage } from "@/lib/flows/types";

function nextStage(
  current: FlowStage,
  subsectionIndex: number,
  totalSubsections: number
): { stage: FlowStage; subsectionIndex: number } | null {
  switch (current) {
    case "hook":
      return { stage: "notes", subsectionIndex: 0 };
    case "notes":
      return { stage: "microcheck", subsectionIndex };
    case "microcheck":
      if (subsectionIndex + 1 < totalSubsections) {
        return { stage: "notes", subsectionIndex: subsectionIndex + 1 };
      }
      return { stage: "quiz", subsectionIndex: 0 };
    case "quiz":
      return null; // resolved dynamically in handler
    case "remediation":
      return { stage: "mastery", subsectionIndex: 0 };
    case "mastery":
      return null;
  }
}

type QuizProgressData = {
  questions?: { id: string; subsectionId: string }[];
  score?: number;
  wrongSubsectionIds?: string[];
};

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

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let next = nextStage(
      flowSession.currentStage as FlowStage,
      flowSession.currentSubsectionIndex,
      flowSession.totalSubsections
    );

    // For mastery stage, mark the session as completed
    if (flowSession.currentStage === "mastery") {
      const [updated] = await db
        .update(flowSessions)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(flowSessions.id, sessionId))
        .returning();
      return NextResponse.json({ session: updated, completed: true });
    }

    // For quiz stage, determine remediation vs mastery based on results
    if (flowSession.currentStage === "quiz") {
      const [quizProgress] = await db
        .select()
        .from(flowStageProgress)
        .where(
          and(
            eq(flowStageProgress.sessionId, sessionId),
            eq(flowStageProgress.stage, "quiz")
          )
        )
        .orderBy(desc(flowStageProgress.createdAt))
        .limit(1);

      const quizData = (quizProgress?.data ?? {}) as QuizProgressData;
      const wrongSubs = quizData.wrongSubsectionIds ?? [];

      if (wrongSubs.length > 0) {
        next = { stage: "remediation", subsectionIndex: 0 };
      } else {
        next = { stage: "mastery", subsectionIndex: 0 };
      }
    }

    if (!next) {
      return NextResponse.json({ error: "Flow is complete" }, { status: 400 });
    }

    // Mark current stage as completed in progress
    await db.insert(flowStageProgress).values({
      sessionId,
      stage: flowSession.currentStage as FlowStage,
      subsectionIndex:
        flowSession.currentStage === "notes" || flowSession.currentStage === "microcheck"
          ? flowSession.currentSubsectionIndex
          : null,
      completed: true,
      data: {},
    });

    // Update session to next stage
    const [updated] = await db
      .update(flowSessions)
      .set({
        currentStage: next.stage,
        currentSubsectionIndex: next.subsectionIndex,
        updatedAt: new Date(),
      })
      .where(eq(flowSessions.id, sessionId))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (e) {
    console.error("Flow advance error:", e);
    return NextResponse.json({ error: "Failed to advance Flow" }, { status: 500 });
  }
}
